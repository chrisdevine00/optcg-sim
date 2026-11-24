/**
 * Helpers for the wave-3 independent card tests (OP15-002 .. ST32-003). Public API, frozen fixtures
 * and the earlier kits only. Every answer helper accepts ONE named kind of prompt and fails on
 * anything else (see kit-op17b.ts), so a missing or extra "up to" / "you may" prompt is caught.
 * Cards are played with raw actions where a pending target choice could otherwise be answered by
 * the kit (docs/reviews/m6b-OP-16.md R6).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, CardPlacement, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision, don, play } from '../../helpers.ts';
import { BLUE, choices, donChoices, kind, RED, side, theirTurn } from '../kit.ts';
import { mine } from '../m4b/kit-a.ts';
import {
  atMain,
  need,
  offeredAbilities,
  pickInst,
  toMyNextMain,
  useAbility,
} from '../op17/kit-op17b.ts';

export * from '../op16/kit-op16a.ts';
export { donChoices, toMyNextMain };

/** Leaders used as scenery. None of their text matters unless a test says so. */
export const W3L = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}, <Strike>. [Activate: Main] only. */
  plain: 'ST01-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}, <Strike>. [Activate: Main] only. */
  kid: 'ST02-001',
  /** OP03-040 Nami: Blue, 5000, 5 Life, {East Blue}, <Wisdom>. Deck-out and [DON!! x1] damage text only. */
  eastBlue: 'OP03-040',
  /** OP01-002 Trafalgar Law: Green/Red, 5000, 4 Life, {Heart Pirates}, <Slash>. [Activate: Main] only. */
  slash: 'OP01-002',
  /** OP16-022 Monkey.D.Luffy: Blue/Green, 5000, 4 Life, {Straw Hat Crew}/{Impel Down}, <Strike>. [Activate: Main] only. */
  impel: 'OP16-022',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. Only a [DON!! x1][Opponent's Turn] boost. */
  yamato: 'ST09-001',
} as const;

/** Scenery cards with the stats the tests rely on. */
export const W3C = {
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, <Wisdom>. */
  thatch: 'OP02-007',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, <Slash>. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, <Special>. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, <Strike>. */
  kingdew: 'OP02-006',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, <Slash>. */
  shiki: 'OP12-005',
  /** OP02-084 Blugori: Purple, cost 1, 3000, Counter +1000, {Animal}/{Impel Down}, <Slash>. */
  blugori: 'OP02-084',
  /** OP02-088 Sphinx: Purple, cost 4, 6000, Counter +1000, {Animal}/{Impel Down}, <Strike>. */
  sphinx: 'OP02-088',
  /** OP16-042 Prisoner of Impel Down: Blue, cost 6, 6000, Counter +2000, {Impel Down}. */
  prisoner: 'OP16-042',
  /** OP17-056 Rocks Pirates: Blue Event, cost 0. [Main] rest 5 DON!!: return up to 1 Character with cost 6 or less to hand. */
  bounce: 'OP17-056',
  /** OP15-115 Impact Dial: Yellow Event, cost 2. [Main] K.O. up to 1 of the opponent's Characters (cost 4 or less), then add 1 Life card to hand. */
  impactDial: 'OP15-115',
} as const;

/**
 * p2's Main Phase (turn 4) like `theirs`, but p1's Leader may be a placement (for example with
 * DON!! given). p1 has no DON!! in the cost area; p2 has 10 active.
 */
export function theirsLeader(
  leader: string | CardPlacement,
  spec: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  return theirTurn(
    { ...side(W3L.plain, BLUE, { costArea: { active: 0, rested: 0 }, ...spec }), leader },
    side(W3L.plain, RED, { costArea: { active: 10, rested: 0 }, ...p2 }),
  );
}

/** DON!! on the field of a player: cost area (active and rested) plus DON!! given to cards. */
export function fieldDon(g: TestGame, p: PlayerId): number {
  const d = don(g, p);
  return d.active + d.rested + d.given;
}

/** True if the single [Activate: Main] of `card` is offered now. */
export function offeredNow(g: TestGame, card: InstanceId): boolean {
  return offeredAbilities(g, card).length > 0;
}

/** End p1's turn: p2 owes their Main Phase (nothing else is pending). */
export function toTheirMain(g: TestGame): void {
  act(g, { type: 'endTurn' });
  need(g, 'main', 'p2');
}

/** The id of the named option whose label matches `re` in the pending mode `choose`. */
export function optionMatching(g: TestGame, re: RegExp): string {
  const d = need(g, 'choose');
  const hit = d.options?.find((o) => re.test(o.label));
  if (!hit) throw new Error(`No option matches ${re}: ${JSON.stringify(d.options)}`);
  return hit.id;
}

/** Pick the named option whose label matches `re`. */
export function pickOption(g: TestGame, re: RegExp): void {
  const id = optionMatching(g, re);
  act(g, { type: 'pick', choice: { option: id } });
}

/** Pick a DON!! class in a pending "choose a DON!! card" decision (strict: the class must be offered). */
export function pickDonClass(g: TestGame, from: 'costActive' | 'costRested'): void {
  need(g, 'choose');
  const want = donChoices(g).find((c) => c.from === from);
  if (!want)
    throw new Error(`${from} DON!! is not offered; offered ${JSON.stringify(donChoices(g))}`);
  act(g, { type: 'pick', choice: want });
}

/** The DON!! classes (by `from`) offered by the pending decision, sorted. */
export function offeredDonFrom(g: TestGame): string[] {
  return donChoices(g)
    .map((c) => c.from)
    .sort();
}

/**
 * Answer, in whatever order the engine asks them, the two parts of "give up to 1 DON!! (any kind)
 * to a Leader or Character": the DON!! class (only when asked) and the target. Each prompt must be
 * a `choose` owed by `who`; anything else fails. Stops when no `choose` of `who` is pending.
 */
export function giveAnyDon(
  g: TestGame,
  who: PlayerId,
  o: { from?: 'costActive' | 'costRested'; target: InstanceId },
): void {
  for (let i = 0; i < 4; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== who) return;
    if (donChoices(g).length > 0) {
      if (!o.from) throw new Error('A DON!! class was asked but the test named none');
      pickDonClass(g, o.from);
    } else if (choices(g).includes(o.target)) {
      act(g, { type: 'pick', choice: o.target });
      if (
        decision(g)?.kind === 'choose' &&
        decision(g)?.player === who &&
        g.legal().some((a) => a.type === 'done') &&
        choices(g).length === 0 &&
        donChoices(g).length === 0
      )
        act(g, { type: 'done' });
    } else {
      throw new Error(`Cannot answer ${decision(g)?.prompt}`);
    }
  }
}

/** The pending decision is an "up to" choose that may be ended empty; end it. Strict. */
export function endUpTo(g: TestGame): void {
  need(g, 'choose');
  expect(g.legal().some((a) => a.type === 'done')).toBe(true);
  act(g, { type: 'done' });
}

/** Card instance ids of `who`'s zone (any order). */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): InstanceId[] {
  return g.zone(who, zone).map((c) => c.instance);
}

/** DON!! given to the card (instance). */
export function givenTo(g: TestGame, card: InstanceId): number {
  return g.card(card).don;
}

/**
 * "[Activate: Main] [Once Per Turn] You may give 1 of your opponent's rested DON!! cards to 1 of
 * your opponent's Characters: Give up to 1 rested DON!! card to its owner's Leader or 1 of their
 * Characters." (OP15-003 Alvida, OP15-017 Morgan.) M6b-Q24 (whose DON!!) is open: every position
 * keeps my own DON!! all active, so the opponent's rested DON!! are the only candidates.
 */
export function describeGiveCost(id: string): void {
  const THATCH = W3C.thatch;
  const SAI = W3C.sai;
  const start = (p2: Parameters<typeof mine>[2] = {}) => {
    const g = mine(
      W3L.kid,
      { characters: [id] },
      { characters: [THATCH, SAI], costArea: { active: 2, rested: 3 }, ...p2 },
    );
    const first = (card: string) =>
      g.zone('p2', 'characters').find((c) => c.card === card)?.instance ?? ('' as InstanceId);
    return { g, me: g.find('p1', 'characters', id), thatch: first(THATCH), sai: first(SAI) };
  };
  describe(`${id} [Activate: Main] [Once Per Turn] cost: give 1 rested DON!! to a Character`, () => {
    it('paying: the cost gives one rested DON!! to a Character, the effect one more to a Leader', () => {
      const { g, me, thatch } = start();
      useAbility(g, me);
      need(g, 'choose', 'p1');
      pickInst(g, [thatch]);
      need(g, 'choose', 'p1');
      pickInst(g, [g.leader('p2')]);
      expect(atMain(g)).toBe(true);
      expect(g.card(thatch).don).toBe(1);
      expect(g.card(g.leader('p2')).don).toBe(1);
      expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 1, given: 2 });
      expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0, given: 0 });
    });

    it("the cost asks for exactly 1 of the opponent's Characters (the Leader and my cards are not offered)", () => {
      const { g, me, thatch, sai } = start();
      useAbility(g, me);
      const d = need(g, 'choose', 'p1');
      expect(d.purpose).toBe('cost');
      expect(choices(g).sort()).toEqual([thatch, sai].sort());
      expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    });

    it("the effect may go to the opponent's Leader or either Character (the same Character is allowed)", () => {
      const { g, me, thatch, sai } = start();
      useAbility(g, me);
      pickInst(g, [thatch]);
      need(g, 'choose', 'p1');
      expect(choices(g).sort()).toEqual([g.leader('p2'), thatch, sai].sort());
    });

    it('the cost needs a rested opposing DON!!: with none the ability is not offered and nothing changes', () => {
      const { g, me } = start({ costArea: { active: 5, rested: 0 } });
      expect(offeredNow(g, me)).toBe(false);
      expect(don(g, 'p2')).toMatchObject({ active: 5, rested: 0, given: 0 });
    });

    it('the cost needs an opposing Character: with none the ability is not offered', () => {
      const { g, me } = start({ characters: [] });
      expect(offeredNow(g, me)).toBe(false);
      expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 3, given: 0 });
    });

    it('with exactly one rested DON!! the cost takes it and the effect finds none: only one DON!! is given', () => {
      const { g, me, thatch } = start({ costArea: { active: 2, rested: 1 } });
      useAbility(g, me);
      pickInst(g, [thatch]);
      if (kind(g) === 'choose') endUpTo(g);
      expect(atMain(g)).toBe(true);
      expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 0, given: 1 });
      expect(g.card(thatch).don).toBe(1);
    });

    it('"up to 1": after paying the cost the effect may give nothing; the cost stays paid', () => {
      const { g, me, thatch } = start();
      useAbility(g, me);
      pickInst(g, [thatch]);
      endUpTo(g);
      expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2, given: 1 });
      expect(g.card(g.leader('p2')).don).toBe(0);
    });

    it('[Once Per Turn]: not offered again this turn, offered again next turn', () => {
      const { g, me, thatch } = start({ hand: [W3C.marco] });
      useAbility(g, me);
      pickInst(g, [thatch]);
      pickInst(g, [g.leader('p2')]);
      expect(offeredNow(g, me)).toBe(false);
      // The given DON!! went back at the opponent's Refresh and were set active: the opponent plays
      // a card, which rests 3 DON!!, so a rested DON!! exists again for my next turn's cost.
      toTheirMain(g);
      play(g, g.find('p2', 'hand', W3C.marco));
      act(g, { type: 'endTurn' });
      expect(atMain(g)).toBe(true);
      expect(offeredNow(g, me)).toBe(true);
    });

    it("the given DON!! add no power on my turn and return to their owner's cost area at that owner's Refresh", () => {
      const { g, me, thatch } = start();
      useAbility(g, me);
      pickInst(g, [thatch]);
      pickInst(g, [thatch]);
      expect(g.card(thatch).don).toBe(2);
      expect(g.power(thatch)).toBe(8000);
      toTheirMain(g);
      expect(g.card(g.find('p2', 'characters', THATCH)).don).toBe(0);
      expect(don(g, 'p2')).toMatchObject({ given: 0, active: 7, rested: 0 });
    });
  });
}

/** Current decision kind, for readable failures. */
export function now(g: TestGame): string | null {
  return kind(g);
}

export type { CardId };

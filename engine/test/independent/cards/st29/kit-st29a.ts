/**
 * Helpers for the ST-29 and older block-4 independent card tests (group A). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper here accepts ONE named kind of prompt and
 * fails on anything else, so a missing or extra "up to" / "you may" prompt is caught. Scenery stats
 * are noted next to each constant; tests repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, cardIds, decision } from '../../helpers.ts';
import { canFinish, cardOf, choices, kind, offered } from '../kit.ts';
import {
  activateTrigger,
  declineTrigger,
  don,
  fill,
  hitLeader,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  play,
  theirs,
  unusable,
} from '../op14/kit-op14a.ts';

export * from '../op14/kit-op14a.ts';

/** Leaders used as scenery. */
export const L29 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life. Named [Monkey.D.Luffy]; only an [Activate: Main]. */
  luffy: 'ST01-001',
  /** ST29-001 Monkey.D.Luffy: Yellow, 5000, 6 Life. Named [Monkey.D.Luffy]; [When Attacking] draws (card under test). */
  st29Luffy: 'ST29-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. Not named Luffy; only an [Activate: Main]. */
  croc: 'ST03-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life. Not named Luffy. */
  kid: 'ST02-001',
  /** OP03-040 Nami: Blue, 5000, 5 Life, {East Blue}. Named [Nami]; no effect that fires unprompted. */
  nami: 'OP03-040',
  /** EB01-040 Kyros: Black/Yellow, 5000, 4 Life, {Dressrosa}. Only an [Activate: Main]. */
  dressrosa: 'EB01-040',
} as const;

/** Scenery cards. Stats are the printed ones. */
export const C29 = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla. */
  c1: 'OP02-060',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  c7: 'OP02-020',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. Vanilla. */
  red1: 'OP01-010',
  /** ST01-014 Guard Point: Red Event, cost 1 ([Counter] only). A plain Event card. */
  event: 'ST01-014',
  /** OP01-104 Speed: Purple Character, cost 2, 3000, "[Trigger] Play this card." (a card with a [Trigger]). */
  speed: 'OP01-104',
  /** ST01-010 Franky: Red, cost 4, 6000, Counter +1000, {Straw Hat Crew}. Vanilla. */
  shc4: 'ST01-010',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, Counter +1000, {FILM}/{Straw Hat Crew}/{Supernovas}. Vanilla. */
  zoroSn: 'OP02-043',
  /** OP01-076 Bellamy: Blue, cost 2, 4000, Counter +1000, {Dressrosa}. Vanilla. */
  bellamy: 'OP01-076',
  /** OP10-054 Blue Gilly: Blue, cost 3, 5000, Counter +1000, {Dressrosa}. Vanilla. */
  gilly: 'OP10-054',
  /** ST29-011 Brook: Yellow, cost 2, 2000, Counter +1000, {Straw Hat Crew}/{Egghead}, [Blocker]. */
  brook: 'ST29-011',
  /** OP09-072 Franky: Purple, cost 4, 5000, [Blocker]. [On Play] only (not played in tests). */
  blockerFranky: 'OP09-072',
  /** EB01-059 Kingdom Come: Yellow Event, cost 6. [Main] K.O. up to 1 Character; then trash Life down to 1. */
  kingdomCome: 'EB01-059',
} as const;

/** Card ids in a zone, sorted. */
export function ids29(g: TestGame, who: PlayerId, zone: Parameters<typeof cardIds>[2]): CardId[] {
  return cardIds(g, who, zone).sort();
}

/** Instance of a card of `who` in `zone`. */
export function inst(
  g: TestGame,
  who: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
  card: CardId,
  nth = 0,
): InstanceId {
  return g.find(who, zone, card, nth);
}

/** True when the pending decision is the plain Main Phase of `who`. */
export function isMain(g: TestGame, who: PlayerId): boolean {
  const d = decision(g);
  return d?.kind === 'main' && d.player === who;
}

/**
 * Pick the cards (by instance) of a pending exact-N `choose` with purpose `cost`. Strict: the
 * pending decision must be a cost pick; no `done` is sent unless the pick is still open after the
 * last wanted card has been picked and offers nothing more.
 */
export function payCost29(g: TestGame, cards: InstanceId[]): void {
  const d = need(g, 'choose');
  expect(d.purpose).toBe('cost');
  const left = [...cards];
  for (let guard = 0; left.length && guard < 20; guard++) {
    const pick = left.find((c) => choices(g).includes(c));
    if (pick === undefined) {
      throw new Error(
        `Cannot pick ${left.map((c) => cardOf(g, c))}; offered ${choices(g).map((c) => cardOf(g, c))}`,
      );
    }
    act(g, { type: 'pick', choice: pick });
    left.splice(left.indexOf(pick), 1);
  }
}

/** Pick instances in a pending non-cost `choose` (strict), then `done` only when it asks and is still open. */
export function pickTargets(g: TestGame, targets: InstanceId[]): void {
  const d = need(g, 'choose');
  expect(d.purpose).not.toBe('cost');
  const left = [...targets];
  for (let guard = 0; left.length && guard < 20; guard++) {
    const pick = left.find((c) => choices(g).includes(c));
    if (pick === undefined) {
      throw new Error(
        `Cannot pick ${left.map((c) => cardOf(g, c))}; offered ${choices(g).map((c) => cardOf(g, c))}`,
      );
    }
    act(g, { type: 'pick', choice: pick });
    left.splice(left.indexOf(pick), 1);
  }
  if (kind(g) === 'choose' && d.max !== undefined && targets.length < d.max && canFinish(g)) {
    act(g, { type: 'done' });
  }
}

/**
 * Raw picks for an exact-N `choose` of any purpose: exactly these instances are picked, one `pick`
 * action each, and never a `done`.
 */
export function pickRaw(g: TestGame, cards: InstanceId[]): void {
  need(g, 'choose');
  const left = [...cards];
  for (let guard = 0; left.length && guard < 20; guard++) {
    const pick = left.find((c) => choices(g).includes(c));
    if (pick === undefined) {
      throw new Error(
        `Cannot pick ${left.map((c) => cardOf(g, c))}; offered ${choices(g).map((c) => cardOf(g, c))}`,
      );
    }
    act(g, { type: 'pick', choice: pick });
    left.splice(left.indexOf(pick), 1);
  }
}

/** True when the game is waiting on `who` at a `choose` that offers `i`. */
export function offersTo(g: TestGame, who: PlayerId, i: InstanceId): boolean {
  const d = decision(g);
  return d?.kind === 'choose' && d.player === who && choices(g).includes(i);
}

/** Say yes to a pending "you may" of `who`. Fails on anything but an acceptable `optional`. */
export function yes29(g: TestGame, who: PlayerId): void {
  need(g, 'optional', who);
  expect(offered(g, who)).toBe(true);
  act(g, { type: 'optional', accept: true });
}

/** p2 attacks p1's Leader with its Leader (p1 defends): stops at the Block Step. */
export function p2AttacksLeader(g: TestGame): void {
  act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
}

/**
 * The defender (p1) activates the Event [Counter] in hand; the cost, target and any "you may" are
 * left pending for the test. Any DON!! cost is paid by the engine's own pick if asked (active DON!!).
 */
export function counterEvent(g: TestGame, card: CardId): void {
  need(g, 'counter', 'p1');
  const inHand = g.find('p1', 'hand', card);
  const a = g
    .legal()
    .find((x) => (x.type === 'activate' || x.type === 'counter') && x.card === inHand);
  if (!a) throw new Error(`${card} cannot be used as a Counter now`);
  g.act(a);
}

/** True while p1 owes the Counter Step. */
export function inCounter(g: TestGame): boolean {
  const d = decision(g);
  return d?.kind === 'counter' && d.player === 'p1';
}

/**
 * Shared tests for the cost-0 Events whose [Counter] reads "You may trash 1 card from your hand: Up
 * to 1 of your Leader or Character cards gains +3000 power during this battle." (OP02-068, OP03-072,
 * OP03-097). The engine asks "use?", then the hand pick, then the target.
 */
export function describeTrashCounter(cfg: { id: CardId }): void {
  const { id } = cfg;
  /** p2's Leader (5000) attacks my Leader (or my rested Mohji); the Counter Step is pending. */
  const defend = (handCards: CardId[], target: 'leader' | 'char' = 'leader', active = 0) => {
    const g = theirs(
      L29.croc,
      {
        hand: [id, ...handCards],
        costArea: { active, rested: 0 },
        characters: [{ card: C29.c1, rested: true }],
        life: fill(C29.c1, 4),
      },
      {},
    );
    act(g, {
      type: 'attack',
      attacker: g.leader('p2'),
      target: target === 'leader' ? g.leader('p1') : g.find('p1', 'characters', C29.c1),
    });
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  };
  const use = (g: TestGame) => {
    counterEvent(g, id);
    need(g, 'optional', 'p1');
  };

  describe(`${id} [Counter] may trash 1 card: +3000 power during this battle`, () => {
    it('printed values: Event, cost 0, usable as a Counter with no DON!! at all', () => {
      const g = defend([C29.c2]);
      const e = g.find('p1', 'hand', id);
      expect(g.card(e).cost).toBe(0);
      expect(
        g.legal().some((a) => (a.type === 'activate' || a.type === 'counter') && a.card === e),
      ).toBe(true);
    });

    it('accepting: trash the chosen hand card, pick my Leader: 5000 -> 8000, the 5000 attack fails', () => {
      const g = defend([C29.c2, C29.c3]);
      use(g);
      act(g, { type: 'optional', accept: true });
      payCost29(g, [g.find('p1', 'hand', C29.c3)]);
      need(g, 'choose', 'p1');
      pickTargets(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
      expect(kind(g)).toBe('counter');
      act(g, { type: 'endCounter' });
      expect(g.life('p1')).toBe(4);
      expect(ids29(g, 'p1', 'trash')).toEqual([id, C29.c3].sort());
      expect(ids29(g, 'p1', 'hand')).toEqual([C29.c2]);
    });

    it('the cost pick offers my other hand cards only (not the Event being used)', () => {
      const g = defend([C29.c2, C29.c3]);
      use(g);
      act(g, { type: 'optional', accept: true });
      need(g, 'choose', 'p1');
      expect(
        choices(g)
          .map((c) => cardOf(g, c))
          .sort(),
      ).toEqual([C29.c2, C29.c3].sort());
    });

    it('declining ("you may"): nothing is trashed and nobody is boosted; the Event is still used up', () => {
      const g = defend([C29.c2]);
      use(g);
      act(g, { type: 'optional', accept: false });
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(ids29(g, 'p1', 'hand')).toEqual([C29.c2]);
      expect(ids29(g, 'p1', 'trash')).toEqual([id]);
    });

    it('with no other card in hand the cost cannot be paid: "use" is not available and nothing is boosted', () => {
      const g = defend([]);
      counterEvent(g, id);
      unusable(g, 'p1');
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('the +3000 may go to one of my Characters (the Leader is the other candidate)', () => {
      const g = defend([C29.c2], 'char');
      use(g);
      act(g, { type: 'optional', accept: true });
      payCost29(g, [g.find('p1', 'hand', C29.c2)]);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([L29.croc, C29.c1].sort());
      pickTargets(g, [g.find('p1', 'characters', C29.c1)]);
      expect(g.power(g.find('p1', 'characters', C29.c1))).toBe(6000);
      act(g, { type: 'endCounter' });
      expect(ids29(g, 'p1', 'characters')).toEqual([C29.c1]);
    });

    it('"up to 1": paying and then choosing nobody leaves everyone unboosted (the cost stays paid)', () => {
      const g = defend([C29.c2]);
      use(g);
      act(g, { type: 'optional', accept: true });
      payCost29(g, [g.find('p1', 'hand', C29.c2)]);
      none(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(ids29(g, 'p1', 'trash')).toEqual([id, C29.c2].sort());
    });

    it('the boost lasts only for this battle', () => {
      const g = defend([C29.c2]);
      use(g);
      act(g, { type: 'optional', accept: true });
      payCost29(g, [g.find('p1', 'hand', C29.c2)]);
      pickTargets(g, [g.leader('p1')]);
      act(g, { type: 'endCounter' });
      expect(isMain(g, 'p2')).toBe(true);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('it costs no DON!!: the DON!! area is untouched', () => {
      const g = defend([C29.c2], 'leader', 2);
      use(g);
      act(g, { type: 'optional', accept: true });
      payCost29(g, [g.find('p1', 'hand', C29.c2)]);
      pickTargets(g, [g.leader('p1')]);
      expect(don(g)).toMatchObject({ active: 2, rested: 0 });
    });
  });
}

/**
 * Shared tests for a Character whose only relevant effect is [Blocker] (CR 10-1-1): Robin, Brook,
 * Ideo, and Killer's [Blocker] half. p1 defends on p2's turn. `leader` must have no effect that
 * fires in these battles.
 */
export function describeBlocker(cfg: {
  id: CardId;
  cost: number;
  power: number;
  counter: number | null;
  /** Characters that may stand next to the blocker on p1's side (kept to a minimum). */
  leader?: string;
}): void {
  const { id } = cfg;
  const leader = cfg.leader ?? L29.croc;
  /** p2's Leader (5000) attacks p1's Leader; the Block Step is pending for p1. */
  const attacked = (
    chars: (string | { card: string; rested?: boolean })[] = [id],
    p1: Partial<Parameters<typeof theirs>[1]> = {},
  ) => {
    const g = theirs(leader, { characters: chars, ...p1 }, {});
    act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    return g;
  };
  const blockActions = (g: TestGame) =>
    g.legal().flatMap((a) => (a.type === 'block' && a.blocker !== null ? [a.blocker] : []));

  describe(`${id} [Blocker]`, () => {
    it(`printed values: cost ${cfg.cost}, ${cfg.power} power, Counter ${cfg.counter}, has [Blocker]`, () => {
      const g = theirs(leader, { characters: [id] }, {});
      const c = inst(g, 'p1', 'characters', id);
      expect(g.card(c).cost).toBe(cfg.cost);
      expect(g.card(c).power).toBe(cfg.power);
      expect(g.card(c).counter).toBe(cfg.counter);
      expect(g.card(c).keywords).toContain('Blocker');
    });

    it('when my Leader is attacked it may block: the blocker rests and becomes the target', () => {
      const g = attacked();
      need(g, 'block', 'p1');
      const c = inst(g, 'p1', 'characters', id);
      expect(blockActions(g)).toEqual([c]);
      act(g, { type: 'block', blocker: c });
      expect(g.card(c).rested).toBe(true);
      expect(g.life('p1')).toBe(4);
    });

    it('the block shields the Leader: no Life is lost and the blocker (lower power) is K.O.d by the 5000 attacker', () => {
      const g = theirs(leader, { characters: [id], life: fill(C29.c1, 4) }, {});
      act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
      act(g, { type: 'block', blocker: inst(g, 'p1', 'characters', id) });
      act(g, { type: 'endCounter' });
      expect(g.life('p1')).toBe(4);
      if (cfg.power <= 5000) {
        expect(ids29(g, 'p1', 'characters')).toEqual([]);
        expect(ids29(g, 'p1', 'trash')).toEqual([id]);
      }
      expect(isMain(g, 'p2')).toBe(true);
    });

    it('not blocking is allowed: the Leader takes the hit', () => {
      const g = theirs(leader, { characters: [id], life: fill(C29.c1, 4) }, {});
      act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
      act(g, { type: 'block', blocker: null });
      act(g, { type: 'endCounter' });
      expect(g.life('p1') === 3 || kind(g) === 'trigger').toBe(true);
      expect(ids29(g, 'p1', 'characters')).toEqual([id]);
    });

    it('a rested copy cannot block', () => {
      const g = attacked([{ card: id, rested: true }]);
      expect(kind(g)).toBe('block');
      expect(blockActions(g)).toEqual([]);
    });

    it('it can also block an attack aimed at another of my (rested) Characters', () => {
      const g = theirs(leader, { characters: [id, { card: C29.c3, rested: true }] }, {});
      act(g, {
        type: 'attack',
        attacker: g.leader('p2'),
        target: inst(g, 'p1', 'characters', C29.c3),
      });
      need(g, 'block', 'p1');
      expect(blockActions(g)).toEqual([inst(g, 'p1', 'characters', id)]);
    });

    it('a Counter after the block can lift it: with 4 Counters of +1000 in hand it survives the 5000 attack', () => {
      const g = theirs(
        leader,
        { characters: [id], hand: fill(C29.c1, 4), life: fill(C29.c1, 4) },
        {},
      );
      act(g, { type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
      const c = inst(g, 'p1', 'characters', id);
      act(g, { type: 'block', blocker: c });
      const uses = Math.ceil((5001 - cfg.power) / 1000);
      expect(uses).toBeLessThanOrEqual(4);
      for (let i = 0; i < uses; i++) {
        act(g, { type: 'counter', card: g.find('p1', 'hand', C29.c1, 0), target: c });
      }
      expect(g.power(c)).toBeGreaterThan(5000);
      act(g, { type: 'endCounter' });
      expect(ids29(g, 'p1', 'characters')).toEqual([id]);
    });

    it('nothing is asked when I play it on my turn (no [On Play])', () => {
      const g = mine(leader, { hand: [id] });
      play(g, g.find('p1', 'hand', id));
      expect(isMain(g, 'p1')).toBe(true);
    });
  });
}

/**
 * Shared tests for the Yellow Straw Hat Crew Characters whose [Trigger] reads "If your Leader is
 * [Monkey.D.Luffy], play this card." (Jinbe, Nami, Robin). The defender is p1 (the turn is p2's).
 */
export function describeLuffyTrigger(cfg: {
  id: CardId;
  cost: number;
  power: number | null;
  counter: number | null;
}): void {
  const { id } = cfg;
  /** p2 hits my Leader; my top Life card is `id`. Stops at the trigger decision. */
  const hit = (leader: string, chars: string[] = []) => {
    const g = theirs(leader, { life: [id, ...fill(C29.c1, 3)], characters: chars, hand: [] }, {});
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  };

  describe(`${id} [Trigger] If your Leader is [Monkey.D.Luffy], play this card`, () => {
    it(`printed values: cost ${cfg.cost}, ${cfg.power} power, Counter ${cfg.counter}`, () => {
      const g = theirs(L29.luffy, { hand: [id] }, {});
      const c = g.find('p1', 'hand', id);
      expect(g.card(c).cost).toBe(cfg.cost);
      expect(g.card(c).power).toBe(cfg.power);
      expect(g.card(c).counter).toBe(cfg.counter);
    });

    it('with ST01-001 Monkey.D.Luffy as Leader: activating plays it (active) and no card goes to my hand', () => {
      const g = hit(L29.luffy);
      activateTrigger(g);
      expect(ids29(g, 'p1', 'characters')).toEqual([id]);
      expect(g.card(inst(g, 'p1', 'characters', id)).rested).toBe(false);
      expect(ids29(g, 'p1', 'hand')).toEqual([]);
      expect(ids29(g, 'p1', 'trash')).toEqual([]);
      expect(g.life('p1')).toBe(3);
    });

    it('with ST29-001 Monkey.D.Luffy as Leader (another card of that name) it plays as well', () => {
      const g = hit(L29.st29Luffy);
      activateTrigger(g);
      expect(ids29(g, 'p1', 'characters')).toEqual([id]);
    });

    it('with a Leader not named Monkey.D.Luffy nothing is played: it ends in the trash', () => {
      const g = hit(L29.croc);
      activateTrigger(g);
      expect(ids29(g, 'p1', 'characters')).toEqual([]);
      expect(ids29(g, 'p1', 'hand')).toEqual([]);
      expect(ids29(g, 'p1', 'trash')).toEqual([id]);
    });

    it('only MY Leader counts: an opposing Monkey.D.Luffy Leader does not make it play', () => {
      const g = theirs(L29.croc, { life: [id, ...fill(C29.c1, 3)] }, {});
      // p2's Leader is ST01-001 Monkey.D.Luffy by default.
      expect(g.card(g.leader('p2')).card).toBe(L29.luffy);
      hitLeader(g);
      activateTrigger(g);
      expect(ids29(g, 'p1', 'characters')).toEqual([]);
      expect(ids29(g, 'p1', 'trash')).toEqual([id]);
    });

    it('declining the [Trigger] adds the card to my hand and plays nothing', () => {
      const g = hit(L29.luffy);
      declineTrigger(g);
      expect(ids29(g, 'p1', 'hand')).toEqual([id]);
      expect(ids29(g, 'p1', 'characters')).toEqual([]);
    });

    it('with 5 Characters already out, playing it asks which one to trash and keeps the limit', () => {
      const five = [C29.c1, C29.c2, C29.c3, C29.c4, C29.c5];
      const g = hit(L29.luffy, five);
      activateTrigger(g);
      need(g, 'choose', 'p1');
      pickInst(g, [inst(g, 'p1', 'characters', C29.c2)]);
      expect(ids29(g, 'p1', 'characters')).toEqual([id, C29.c1, C29.c3, C29.c4, C29.c5].sort());
      expect(ids29(g, 'p1', 'trash')).toEqual([C29.c2]);
    });

    it('the damage is one card: Life drops by one and the turn goes on', () => {
      const g = hit(L29.luffy);
      activateTrigger(g);
      expect(g.life('p1')).toBe(3);
      expect(isMain(g, 'p2')).toBe(true);
    });
  });
}

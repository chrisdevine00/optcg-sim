/**
 * Helpers for the OP-16 group-A independent card tests (OP16-001 .. OP16-037). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts), so a missing or extra "up to" / "you may" prompt is
 * caught. Scenery stats are noted next to each constant; tests repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, cardIds, decision, noDefence, takeMost } from '../../helpers.ts';
import { opponentKOs, SC2 } from '../op17/kit-op17a.ts';
import {
  atMain,
  choices,
  kind,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  payDonStrict,
  payHand,
  pickInOrder,
  pickInst,
  unusable,
  yes,
} from '../op17/kit-op17b.ts';
import { playCard } from '../m4b/kit-a.ts';
import { offeredAbilities, useAbility } from '../op17/kit-op17b.ts';

export * from '../op17/kit-op17b.ts';
export { opponentKOs, SC2 };

/** Leaders used as scenery. None has an effect that fires unless a test makes it. */
export const OL = {
  /** OP16-001 Portgas.D.Ace: Red, 5000, 5 Life, {Whitebeard Pirates}. [Activate: Main] only. Name includes "Ace". */
  ace: 'OP16-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}. Vanilla; name has no "Ace". */
  luffy: 'ST01-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** OP16-022 Monkey.D.Luffy: Blue/Green, 5000, 4 Life, {Straw Hat Crew}/{Impel Down}. [Activate: Main] only. */
  impel: 'OP16-022',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Supernovas}/{Kid Pirates}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. [Activate: Main] only; neutral opponent. */
  croc: 'ST03-001',
} as const;

/** Vanilla Characters (no text) the OP-16 tests use, with the stats they rely on. */
export const OV = {
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  thatch: 'OP02-007',
  /** OP16-016 Ramba: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates Allies}. */
  ramba: 'OP16-016',
  /** OP17-006 Kingdew: Red, cost 7, 8000, Counter +2000, {Whitebeard Pirates}. */
  kingdew7: 'OP17-006',
  /** OP16-004 Curiel: Red, cost 7, 8000, Counter +2000, {Whitebeard Pirates}. */
  curiel: 'OP16-004',
  /** OP10-014 Franky: Red, cost 6, 8000, Counter +1000, {Animal}/{Straw Hat Crew}/{Punk Hazard}. Not Whitebeard. */
  franky8: 'OP10-014',
  /** OP06-005 Gasparde: Red, cost 6, 8000, Counter +1000, {FILM}/{Former Navy}/{Gasparde Pirates}. */
  gasparde8: 'OP06-005',
  /** P-016 Shanks: Red, cost 8, 10000, Counter +1000, {FILM}/{The Four Emperors}/{Red-Haired Pirates}. */
  shanks10: 'P-016',
  /** EB02-004 Don Accino: Red, cost 8, 10000, Counter +1000, {Accino Family}. */
  accino10: 'EB02-004',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. */
  shiki10: 'OP12-005',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  oars9: 'OP02-020',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  kingdew5: 'OP02-006',
  /** OP03-006 Speed Jil: Red, cost 4, 6000, Counter +1000, {Whitebeard Pirates}. */
  jil6: 'OP03-006',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin6: 'OP01-018',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  marco5: 'OP01-023',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai4: 'OP01-012',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. */
  komachiyo3: 'OP01-010',
  /** OP13-009 Curly.Dadan: Red, cost 1, 2000, Counter +1000, {Mountain Bandits}. */
  dadan2: 'OP13-009',
  /** OP02-014 Whitey Bay: Red, cost 1, 2000, Counter +1000, {Whitebeard Pirates Allies}. */
  whiteyBay2: 'OP02-014',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000, {Alabasta}. */
  cobra0: 'OP04-012',
  /** EB01-005 Doma: Red, cost 1, 3000, Counter +1000, {Whitebeard Pirates Allies}. */
  doma3: 'EB01-005',
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (only an [Activate: Main]). */
  stageHq: 'OP05-021',
} as const;

/** The Characters of `who` (card ids, sorted). */
export function charIds(g: TestGame, who: PlayerId): CardId[] {
  return g
    .zone(who, 'characters')
    .map((c) => c.card)
    .sort();
}

/** The nth Character with this card id of `who`. */
export function ch(g: TestGame, who: PlayerId, card: CardId, nth = 0): InstanceId {
  return g.find(who, 'characters', card, nth);
}

/** True if the Character `card` of `who` is rested. */
export function restedChar(g: TestGame, who: PlayerId, card: CardId, nth = 0): boolean {
  return g.card(ch(g, who, card, nth)).rested;
}

/** Power of the nth Character with this card id of `who`. */
export function pw(g: TestGame, who: PlayerId, card: CardId, nth = 0): number | null {
  return g.power(ch(g, who, card, nth));
}

/** Cost of a card instance (current value from `derive`). */
export function costOf(g: TestGame, i: InstanceId): number | null {
  return g.card(i).cost;
}

/**
 * Card ids revealed by an effect or a cost. Playing a card, using a Counter or an Event and a
 * [Trigger] each also emit a `CardRevealed` event for that card (reason play / counter / event /
 * trigger / banish): those are the rule-mandated reveals, not the ones an effect asks for.
 */
export function revealedByEffects(g: TestGame): (CardId | null)[] {
  const rule = new Set(['play', 'counter', 'event', 'trigger', 'banish']);
  return g.events
    .filter((e) => e.type === 'CardRevealed' && !rule.has(String(e.reason)))
    .map((e) => (e.card as CardId | undefined) ?? null);
}

/** Hand cards used to probe "Character card with 8000 power": 7000, two of 8000, 9000, 10000. */
export const POWER_PROBE = {
  p7000: OV.kingdew5,
  p8000a: OV.thatch,
  p8000b: OV.ramba,
  p9000: OV.oars9,
  p10000: OV.accino10,
} as const;

/**
 * Standard tests for a cost "you may reveal / trash `n` Character card(s) with 8000 power from your
 * hand: ...". `start(extraHand)` must put `extraHand` in the acting player's hand, trigger the
 * effect, and stop at its first prompt (the "use it?" question, or nothing at all when it cannot be
 * paid). `happened` checks whether the effect after the colon has resolved.
 */
export function describeEightKCost(cfg: {
  id: string;
  verb: 'reveal' | 'trash';
  n?: number;
  who?: PlayerId;
  start: (extraHand: CardId[]) => TestGame;
  happened: (g: TestGame) => boolean;
  /** Cards already in the acting player's trash after the effect starts (for example the Event itself). */
  trashBase?: CardId[];
  /** Runs after the cost is paid (for example to pick the effect's target). */
  afterPay?: (g: TestGame) => void;
}): void {
  const { id, verb, start, happened } = cfg;
  const n = cfg.n ?? 1;
  const who = cfg.who ?? 'p1';
  const base = cfg.trashBase ?? [];
  const P = POWER_PROBE;
  const pay = (g: TestGame) => {
    yes(g, who);
    need(g, 'choose', who);
    return g;
  };
  describe(`${id} cost: ${verb} ${n} Character card(s) with 8000 power from hand`, () => {
    it('offers exactly the Characters with 8000 power (not 7000, 9000 or 10000) as the cost', () => {
      const g = pay(start([P.p7000, P.p8000a, P.p8000b, P.p9000, P.p10000]));
      let seen = offeredIds(g);
      if (n === 2) {
        // An exact-2 pick lists only the picks that can start a canonical selection: take the
        // first, then read what the second pick may be.
        act(g, { type: 'pick', choice: choices(g)[0]! });
        seen = [...seen, ...offeredIds(g)];
      }
      expect([...new Set(seen)].sort()).toEqual([P.p8000a, P.p8000b].sort());
    });

    it('with no 8000-power Character in hand (7000, 9000, 10000 only) the cost cannot be paid', () => {
      const g = start([P.p7000, P.p9000, P.p10000]);
      unusable(g, who);
      expect(happened(g)).toBe(false);
      expect(atMain(g, who)).toBe(true);
    });

    it('with an empty hand the cost cannot be paid', () => {
      const g = start([]);
      unusable(g, who);
      expect(happened(g)).toBe(false);
      expect(atMain(g, who)).toBe(true);
    });

    it(`declining the "you may" ${verb}s nothing and the effect does not happen`, () => {
      const g = start([P.p8000a, P.p8000b]);
      need(g, 'optional', who);
      no(g, who);
      expect(happened(g)).toBe(false);
      expect(cardIds(g, who, 'hand').sort()).toEqual([P.p8000a, P.p8000b].sort());
      expect(cardIds(g, who, 'trash')).toEqual(base);
      expect(revealedByEffects(g)).toEqual([]);
    });

    if (n === 2) {
      it('needs two such cards: with only one 8000-power Character the cost cannot be paid', () => {
        const g = start([P.p8000a, P.p7000]);
        unusable(g, who);
        expect(happened(g)).toBe(false);
        expect(atMain(g, who)).toBe(true);
      });
    }

    it(`paying: the chosen card${n === 2 ? 's are' : ' is'} ${verb === 'reveal' ? 'revealed and stay in hand' : 'trashed'}, then the effect happens`, () => {
      const g = pay(start([P.p8000a, P.p8000b, P.p7000]));
      const chosen = n === 2 ? [P.p8000a, P.p8000b] : [P.p8000b];
      payHand(g, chosen);
      cfg.afterPay?.(g);
      expect(happened(g)).toBe(true);
      const hand = cardIds(g, who, 'hand');
      if (verb === 'reveal') {
        expect(revealedByEffects(g).sort()).toEqual([...chosen].sort());
        for (const c of chosen) expect(hand).toContain(c);
        expect(cardIds(g, who, 'trash')).toEqual(base);
      } else {
        expect(cardIds(g, who, 'trash').sort()).toEqual([...base, ...chosen].sort());
        expect(hand).not.toContain(P.p8000b);
        expect(hand).toContain(P.p7000);
      }
    });
  });
}

/** True if playing the hand card `inst` is among the legal actions now. */
export function canPlayCard(g: TestGame, inst: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'playCard' && a.card === inst);
}

/**
 * Pay an exact-N cost pick with these cards. When only one candidate exists the engine may decide
 * the pick on its own (forced pick, ARCHITECTURE §2.3): then nothing is asked and nothing is done.
 */
export function payCost(g: TestGame, cards: CardId[]): void {
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') payHand(g, cards);
}

export { takeMost };

/**
 * p1 plays OP05-077 Gamma Knife from hand (cost: DON!! -1) and gives `target` -5000 power during
 * this turn, then declines the follow-up "add DON!!" count by taking the most (it changes no test).
 */
export function gammaKnife(g: TestGame, target: InstanceId): void {
  playCard(g, SC2.gammaKnife);
  yes(g);
  payDonStrict(g, 1);
  pickInst(g, [target]);
  takeMost(g);
}

/**
 * Use the single [Activate: Main] of `card` if the engine offers it; return whether it was offered.
 * For conditions that gate an effect, a test then asserts only the outcome (what changed), so it
 * holds whether the engine refuses the activation or lets it resolve to nothing.
 */
export function tryActivate(g: TestGame, card: InstanceId): boolean {
  if (offeredAbilities(g, card).length === 0) return false;
  useAbility(g, card);
  return true;
}

/**
 * An "up to N" effect with no candidate: the engine still asks the (empty) `choose`, which ends
 * with `done`. Asserts the prompt is a `choose` with nothing to pick, then answers it.
 */
export function skipEmpty(g: TestGame): void {
  need(g, 'choose');
  expect(choices(g)).toEqual([]);
  none(g);
}

/**
 * Pay a pending "rest N of your cards" cost with these cards and `donN` active DON!!. When exactly N
 * candidates exist the engine may decide the pick itself (forced pick): then nothing is asked and
 * nothing is done here.
 */
export function payRest(g: TestGame, cards: InstanceId[], donN = 0): void {
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') pickInOrder(g, cards, donN, 'costActive');
}

type Placed = CardId | { card: CardId; rested?: boolean };

/**
 * OP16-025 Bunkov / OP16-029 Antlerkov: "[When Attacking] If you have [partner], play up to 1
 * Character card with a cost of 2 or less from your hand." The two cards mirror each other.
 * `board(chars, hand, p2chars)` builds p1's Main Phase with `id` ready to attack.
 */
export function describePartnerAttack(cfg: {
  id: CardId;
  partner: CardId;
  board: (chars: Placed[], hand: CardId[], p2chars?: CardId[]) => TestGame;
}): void {
  const { id, partner, board } = cfg;
  const SAI = OV.sai4; // cost 2
  const KOM = OV.komachiyo3; // cost 1
  const MARCO3 = OV.marco5; // cost 3
  const swing = (g: TestGame) => attack(g, g.find('p1', 'characters', id), g.leader('p2'));
  const handIds = (g: TestGame) => cardIds(g, 'p1', 'hand').sort();
  describe(`${id} [When Attacking] with [${partner}]: play up to 1 Character with cost 2 or less`, () => {
    it('with the partner on my field, the attack offers exactly the Characters with cost 2 or less in hand', () => {
      const g = board([id, partner], [SAI, KOM, MARCO3, OV.thatch]);
      swing(g);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([KOM, SAI].sort());
    });

    it('plays the chosen Character for free (no DON!! paid), active, and the battle goes on', () => {
      const g = board([id, partner], [SAI]);
      swing(g);
      pickInst(g, [g.find('p1', 'hand', SAI)]);
      expect(charIds(g, 'p1')).toEqual([id, partner, SAI].sort());
      expect(handIds(g)).toEqual([]);
      expect(restedChar(g, 'p1', SAI)).toBe(false);
      expect(g.card(g.find('p1', 'characters', id)).rested).toBe(true);
      noDefence(g);
      expect(atMain(g, 'p1')).toBe(true);
    });

    it('boundary: cost 2 qualifies, cost 3 does not', () => {
      const g = board([id, partner], [SAI, MARCO3]);
      swing(g);
      need(g, 'choose');
      expect(offeredIds(g)).toEqual([SAI]);
    });

    it('"up to 1": may play nothing', () => {
      const g = board([id, partner], [SAI]);
      swing(g);
      expect(mayChooseNone(g)).toBe(true);
      none(g);
      expect(charIds(g, 'p1')).toEqual([id, partner].sort());
      expect(handIds(g)).toEqual([SAI]);
    });

    it('plays only one when two qualify', () => {
      const g = board([id, partner], [SAI, KOM]);
      swing(g);
      pickInst(g, [g.find('p1', 'hand', SAI)]);
      expect(charIds(g, 'p1')).toEqual([id, partner, SAI].sort());
      expect(handIds(g)).toEqual([KOM]);
    });

    it('without the partner nothing is asked and nothing is played', () => {
      const g = board([id], [SAI]);
      swing(g);
      expect(kind(g)).toBe('block');
      noDefence(g);
      expect(charIds(g, 'p1')).toEqual([id]);
      expect(handIds(g)).toEqual([SAI]);
    });

    it('the partner may be rested: "if you have" is satisfied by a rested Character', () => {
      const g = board([id, { card: partner, rested: true }], [SAI]);
      swing(g);
      need(g, 'choose');
      expect(offeredIds(g)).toEqual([SAI]);
    });

    it('a partner in my hand does not count', () => {
      const g = board([id], [SAI, partner]);
      swing(g);
      expect(kind(g)).toBe('block');
    });

    it("a partner on the opponent's field does not count", () => {
      const g = board([id], [SAI], [partner]);
      swing(g);
      expect(kind(g)).toBe('block');
    });

    it('with no Character of cost 2 or less in hand nothing is played', () => {
      const g = board([id, partner], [MARCO3, OV.thatch, 'OP16-020']);
      swing(g);
      noDefence(g);
      expect(charIds(g, 'p1')).toEqual([id, partner].sort());
      expect(handIds(g)).toEqual([MARCO3, 'OP16-020', OV.thatch].sort());
    });

    it('an Event with cost 0 in hand is not a Character card and is not offered', () => {
      const g = board([id, partner], [SAI, 'OP16-020']);
      swing(g);
      need(g, 'choose');
      expect(offeredIds(g)).toEqual([SAI]);
    });
  });
}

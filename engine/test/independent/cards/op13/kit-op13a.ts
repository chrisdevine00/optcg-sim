/**
 * Helpers for the OP-13 group-A independent card tests (OP13-005 .. OP13-031). Public API, frozen
 * fixtures and the earlier kits only. Every answer helper accepts ONE named kind of prompt and
 * fails on anything else (see kit-op17b.ts). Scenery stats are noted next to each constant; tests
 * repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision } from '../../helpers.ts';
import { choices, hasEvent, kind, reachablePickSets } from '../kit.ts';
import {
  atMain,
  deck,
  hand,
  mayChooseNone,
  minus,
  need,
  none,
  offeredIds,
  pickCards,
  settleOrders,
  tail,
} from '../op17/kit-op17b.ts';

export * from '../op15/kit-op15a.ts';

/** Leaders used as scenery (stats repeated where a test depends on them). */
export const L13 = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life. Vanilla. Name [Monkey.D.Luffy]. */
  luffy: 'ST01-001',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, {FILM}. [Activate: Main] only. Name is neither Sabo, Ace nor Luffy. */
  shanks: 'ST05-001',
  /** OP13-002 Portgas.D.Ace: Blue/Red, 6000, 3 Life. [On Your Opponent's Attack] only. Name [Portgas.D.Ace]. */
  ace: 'OP13-002',
  /** OP13-004 Sabo: Red/Black, 5000 (4000 with 4+ Life), 5 Life. Name [Sabo]. */
  sabo: 'OP13-004',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life. [Activate: Main] only. */
  croc: 'ST03-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life. [Activate: Main] only. */
  kid: 'ST02-001',
} as const;

/** Vanilla Characters used as scenery. */
export const V13 = {
  /** P-119 Portgas.D.Ace: Red, cost 4, 6000, Counter +1000. Vanilla; name [Portgas.D.Ace]. */
  ace: 'P-119',
  /** P-022 Monkey.D.Luffy: Red, cost 4, 6000, Counter +1000. Vanilla; name [Monkey.D.Luffy]. */
  luffy: 'P-022',
  /** OP04-012 Nefeltari Cobra: Red, cost 2, 0 power, Counter +1000, {Alabasta}. Inert alone. */
  cobra0: 'OP04-012',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  thatch: 'OP02-007',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. */
  komachiyo: 'OP01-010',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  koala: 'EB05-041',
  /** OP12-083 Inazuma: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}. Vanilla. */
  inazuma: 'OP12-083',
  /** OP13-088 Terry Gilteo: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}. Vanilla. */
  terry: 'OP13-088',
  /** OP05-012 Hack: Red, cost 3, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}. Vanilla. */
  hackRed: 'OP05-012',
  /** ST08-008 Higuma: Black, cost 1, 2000, Counter +1000, {Mountain Bandits}, [On Play] only (inert once on the field). */
  higumaB: 'ST08-008',
  /** ST01-003 Karoo: Red, cost 1, 3000, Counter +1000, {Animal}/{Alabasta}. Vanilla. */
  karoo1: 'ST01-003',
  /** ST01-009 Nefeltari Vivi: Red, cost 2, 4000, Counter +1000, {Alabasta}. Vanilla. */
  vivi2: 'ST01-009',
  /** EB02-001 Karoo: Red, cost 5, 7000, Counter +1000, {Animal}/{Alabasta}. Vanilla. */
  karoo5: 'EB02-001',
  /** ST01-008 Nico Robin: Red, cost 3, 5000, Counter +1000, {Straw Hat Crew}. Vanilla. */
  robin3: 'ST01-008',
  /** ST01-010 Franky: Red, cost 4, 6000, Counter +1000, {Straw Hat Crew}. Vanilla. */
  franky4: 'ST01-010',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, {FILM}/{Straw Hat Crew}. Vanilla. */
  sunny1: 'P-015',
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, {FILM}. Vanilla. */
  gordon: 'ST05-007',
  /** ST05-012 Baccarat: Purple, cost 3, 5000, Counter +1000, {FILM}/{Grantesoro}. Vanilla. */
  baccarat: 'ST05-012',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji: 'OP02-060',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  shiki10: 'OP12-005',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  oars: 'OP02-020',
} as const;

/** Brief description of the pending decision (for failure messages). */
export function whatNow(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.player}:${d.kind}/${d.purpose} max=${d.max} ${d.prompt}` : 'none';
}

/** Sorted instances currently offered, or [] when no `choose` is pending. */
export function offeredInsts(g: TestGame): InstanceId[] {
  return kind(g) === 'choose' ? [...choices(g)].sort() : [];
}

/** Answer the pending "how many (up to N)" count prompt (a `choose` with purpose mode) with `n`. */
export function pickCount(g: TestGame, n: number, who?: PlayerId): void {
  const d = need(g, 'choose', who);
  expect(d.purpose).toBe('mode');
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** The counts offered by the pending count prompt, as numbers, in offered order. */
export function countOptions(g: TestGame): number[] {
  const d = need(g, 'choose');
  return (d.options ?? []).map((o) => Number(o.id));
}

/** Pick exactly one instance in the pending choose (raw pick; never sends `done`). */
export function pickRaw(g: TestGame, i: InstanceId): void {
  need(g, 'choose');
  act(g, { type: 'pick', choice: i });
}

/** Raw `done` for a pending choose that allows it (never swallows a later prompt). */
export function doneRaw(g: TestGame): void {
  need(g, 'choose');
  act(g, { type: 'done' });
}

/** DON!! given to a card instance. */
export function donOn(g: TestGame, i: InstanceId): number {
  return g.card(i).don;
}

/** The Characters of `who` as sorted card ids. */
export function charsOfIds(g: TestGame, who: PlayerId): CardId[] {
  return g
    .zone(who, 'characters')
    .map((c) => c.card)
    .sort();
}

// ---------------------------------------------------------------------------------------------
// "Look at N cards from the top; reveal up to 1 [X] and add it to your hand; rest to the bottom"
// ---------------------------------------------------------------------------------------------

/**
 * Standard tests for "look at `n` cards from the top of your deck; reveal up to 1 card that
 * matches and add it to your hand. Then, place the rest at the bottom of your deck in any order".
 * `start(deckTopFirst)` must trigger the effect and stop at its first prompt (the candidate pick).
 * `match` are two qualifying cards, `miss` a non-qualifying one, `edgeHit` a card exactly on the
 * boundary that qualifies and `edgeMiss` one just outside it.
 */
export function describeLook13(cfg: {
  id: string;
  n: number;
  start: (deckTopFirst: CardId[]) => TestGame;
  match: [CardId, CardId];
  miss: CardId;
  edgeHit: CardId;
  edgeMiss: CardId;
}): void {
  const { id, n, start, match, miss, edgeHit, edgeMiss } = cfg;
  const pad = (k: number) => Array.from({ length: k }, () => miss);
  const beyond = match[0];
  const rest = (): CardId[] => [beyond, ...Array.from({ length: 8 }, () => V13.mohji)];
  const top = (): CardId[] => [match[0], miss, match[1], ...pad(n - 3)];
  const begin = (t: CardId[]) => start([...t, ...rest()]);
  const total = n + 9;
  const settle = (g: TestGame) => {
    settleOrders(g);
    expect(atMain(g)).toBe(true);
  };
  const emptyOrNone = (g: TestGame) => {
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    settle(g);
  };
  describe(`${id} look at ${n}, add up to 1 matching card, rest to the bottom`, () => {
    it('offers exactly the qualifying cards of the top; the pick goes to hand, the rest to the bottom', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...match].sort());
      pickCards(g, [match[1]]);
      settle(g);
      expect(hand(g)).toEqual([match[1]]);
      expect(deck(g)).toHaveLength(total - 1);
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), n - 1)).toEqual(minus(top(), [match[1]]).sort());
    });

    it('the chosen card is revealed; the other looked-at cards are not', () => {
      const g = begin(top());
      pickCards(g, [match[1]]);
      settle(g);
      expect(hasEvent(g, 'CardRevealed', { card: match[1] })).toBe(true);
      expect(hasEvent(g, 'CardRevealed', { card: miss })).toBe(false);
    });

    it('"up to 1": may add nothing; all looked-at cards go to the bottom', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      expect(mayChooseNone(g)).toBe(true);
      none(g);
      settle(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(total);
      expect(deck(g)[0]).toBe(beyond);
      expect(tail(deck(g), n)).toEqual([...top()].sort());
    });

    it('adds at most one card even when two qualify', () => {
      const sets = reachablePickSets(begin(top()));
      expect(sets.has('')).toBe(true);
      expect(sets.has(match[0])).toBe(true);
      expect(sets.has(match[1])).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it(`only the top ${n} are looked at: a qualifying card in position ${n + 1} is not offered`, () => {
      const g = begin(pad(n));
      emptyOrNone(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)[0]).toBe(beyond);
    });

    it('boundary: the card exactly on the limit qualifies, the one just outside does not', () => {
      const g = begin([edgeHit, edgeMiss, ...pad(n - 2)]);
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([edgeHit]);
      pickCards(g, [edgeHit]);
      settle(g);
      expect(hand(g)).toEqual([edgeHit]);
    });

    it('with no qualifying card, nothing is added and the looked-at cards still go to the bottom', () => {
      const g = begin([edgeMiss, ...pad(n - 1)]);
      emptyOrNone(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(total);
      expect(tail(deck(g), n)).toEqual([edgeMiss, ...pad(n - 1)].sort());
    });

    it('the looked-at cards leave the top: the next card is the one that was below them', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      none(g);
      settle(g);
      expect(deck(g).slice(0, 9)).toEqual(rest());
    });
  });
}

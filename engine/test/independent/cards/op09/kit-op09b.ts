/**
 * Helpers for the OP-09 group-B independent card tests (OP09-031 to OP09-074). Public API, frozen
 * fixtures and the earlier kits only. Scenery stats are noted next to each constant; tests repeat
 * the ones they rely on.
 *
 * Answer helpers accept exactly one named prompt kind: a test fails on the wrong prompt rather than
 * skipping it. Tests that assert whether a prompt appears use raw `g.act`.
 */
import { describe, expect, it } from 'vitest';
import { queries, type CardId, type InstanceId, type PlayerId } from '@optcg/engine';
import { act, attack, blockers, decision, noDefence, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { canFinish, choices, hasEvent, kind, reachablePickSets } from '../kit.ts';

import {
  atMain,
  BLUE,
  deck,
  hand,
  kw,
  mine,
  playId,
  theirs,
  need,
  none,
  offeredIds,
  pickCards,
  settleOrders,
  tail,
  trash,
} from '../op14/kit-op14d.ts';

export * from '../op14/kit-op14d.ts';

/** Leaders used as scenery. */
export const L9 = {
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** OP09-042 Buggy: Blue, 5000, 5 Life, {The Four Emperors}/{Cross Guild}. Only an [Activate: Main] (rest 5 DON!!). */
  crossGuild: 'OP09-042',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla. */
  luffy: 'ST01-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  baroque: 'ST03-001',
} as const;

/** Vanilla scenery Characters (no effect text, no [Trigger]). */
export const V9 = {
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000, {Giant}/{New Giant Pirates}. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000, {Whitebeard Pirates}. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000, {Whitebeard Pirates}. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000, {Giant}/{Whitebeard Pirates Allies}. */
  c7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000, {FILM}/{Golden Lion Pirates}. */
  c8: 'OP12-005',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000, {Former Whitebeard Pirates}. */
  c3: 'OP01-023',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  c1: 'P-015',
  /** OP09-038 Rob Lucci: Green, cost 4, 6000, Counter +1000, {CP9}/{ODYSSEY}. */
  lucci: 'OP09-038',
  /** OP03-015 Lim: Red, cost 3, 2000, [Blocker], {ODYSSEY}. Named [Lim]. */
  limOther: 'OP03-015',
  /** OP09-055 Mr.1(Daz.Bonez): Blue, cost 5, 7000, Counter +1000, {Former Baroque Works}/{Cross Guild}. */
  mr1: 'OP09-055',
  /** OP12-055 Mohji & Cabaji: Blue, cost 5, 6000, Counter +2000, {Cross Guild}. */
  mohjiCabaji5: 'OP12-055',
  /** OP12-049 Buggy: Blue, cost 6, 7000, Counter +2000, {The Four Emperors}/{Cross Guild}. */
  buggy6: 'OP12-049',
  /** OP02-053 Crocodile: Blue, cost 5, 7000, Counter +1000, {Impel Down}/{Former Baroque Works}. */
  croc5: 'OP02-053',
  /** OP14-095 Mr.9: Black, cost 5, 6000, Counter +2000, {Baroque Works}. */
  mr9: 'OP14-095',
  /** ST30-013 Mr.2.Bon.Kurei(Bentham): Green, cost 4, 6000, Counter +1000, {Impel Down}/{Former Baroque Works}. */
  bentham4: 'ST30-013',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, Counter +1000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}. */
  moria4: 'OP02-054',
  /** OP06-094 Lola: Black, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}. */
  lola4: 'OP06-094',
  /** OP01-070 Dracule Mihawk: Blue, cost 9, 9000, no Counter, {The Seven Warlords of the Sea}. Named [Dracule Mihawk]; [On Play] only. */
  mihawk9: 'OP01-070',
  /** OP01-045 Jean Bart: Green, cost 4, 6000, Counter +1000, {Heart Pirates}. */
  heart4: 'OP01-045',
  /** ST02-012 Bepo: Green, cost 1, 3000, Counter +1000, {Heart Pirates}/{Minks}. */
  heart1: 'ST02-012',
  /** OP02-033 Jinbe: Green, cost 2, 4000, Counter +1000, {FILM}/{Fish-Man}/{Straw Hat Crew}. */
  shc2: 'OP02-033',
  /** OP02-028 Usopp: Green, cost 3, 5000, Counter +1000, {FILM}/{Straw Hat Crew}. */
  shc3: 'OP02-028',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  wano1: 'OP01-010',
  /** EB01-005 Doma: Red, cost 1, 3000, Counter +1000, {Whitebeard Pirates Allies}. */
  doma: 'EB01-005',
  /** OP12-025 Kin'emon: Green, cost 6, 8000, Counter +1000, {Land of Wano}/{The Akazaya Nine}. */
  wano6: 'OP12-025',
  /** OP09-054 Richie: Blue, cost 2, 2000, Counter +1000, [Blocker], {Animal}/{Cross Guild}. Card under test elsewhere. */
  richie: 'OP09-054',
  /** OP09-043 Alvida: Blue, cost 5, 6000, Counter +1000, {Cross Guild}. Named [Alvida]. */
  alvida: 'OP09-043',
  /** OP03-023 Alvida: Green, cost 1, 3000, Counter +1000, {East Blue}/{Alvida Pirates}. Named [Alvida], vanilla. */
  alvida1: 'OP03-023',
} as const;

/** Events used as scenery. */
export const E9 = {
  /** OP09-057 Cross Guild: Blue Event, cost 1, {Cross Guild}. */
  blueEvent: 'OP09-057',
  /** ST01-014 Guard Point: Red Event, cost 1, [Counter]. */
  redEvent: 'ST01-014',
} as const;

/** The pending decision as a string, for scratch debugging. */
export function dbg9(g: TestGame): string {
  const d = decision(g);
  if (!d) return 'no decision';
  const legal = g
    .legal()
    .map((a) => JSON.stringify(a))
    .slice(0, 14);
  return `${d.kind}/${d.purpose} for ${d.player} max=${d.max}: ${d.prompt} | opts=${(d.options ?? []).map((o) => o.id + ':' + o.label)} | legal=${legal.join(' ')}`;
}

/** The DON!! summary of a player (deck, active, rested, given). */
export function donSum(g: TestGame, who: PlayerId = 'p1') {
  return queries.don(g.state, who);
}

/** True when the card (an instance) is rested. */
export function isRested(g: TestGame, i: InstanceId): boolean {
  return g.card(i).rested;
}

/** The pending decision must be a `choose` with nothing to pick and `done` allowed (max 0 ask). Answers it. */
export function answerEmptyChoose(g: TestGame, who: PlayerId = 'p1'): void {
  const d = decision(g);
  expect(d?.kind).toBe('choose');
  expect(d?.player).toBe(who);
  expect(choices(g)).toHaveLength(0);
  expect(canFinish(g)).toBe(true);
  act(g, { type: 'done' });
}

/** True when the game waits on a `choose` of `who`. */
export function chooseIsPending(g: TestGame, who: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return !!d && kind(g) === 'choose' && d.player === who;
}

/** A card id list of `n` copies. */
export function copies(card: CardId, n: number): CardId[] {
  return Array.from({ length: n }, () => card);
}

// ---------------------------------------------------------------------------------------------
// Shared: "Look at 5 cards from the top of your deck; reveal up to 1 <filter> and add it to your
// hand. Then, place the rest at the bottom of your deck in any order and trash 1 card from your
// hand." (OP09-034 Perona [On Play], OP09-044 Izo [When Attacking])
// ---------------------------------------------------------------------------------------------

export interface BlockerCfg {
  id: CardId;
  /** Printed power. */
  power: number;
  /** Printed Counter value. */
  counter: number;
  cost: number;
}

/** Standard tests for a Character whose whole text is [Blocker] (OP09-054 Richie, OP09-071 Nico Robin). */
export function describeVanillaBlocker(cfg: BlockerCfg): void {
  const { id, power, counter, cost } = cfg;
  const defend = (own: (CardId | { card: CardId; rested: boolean })[] = [id]) =>
    theirs(L9.neutral, { characters: own, hand: [V9.c2] }, { characters: [V9.c3, V9.c8] });
  describe(`${id}: [Blocker] and nothing else`, () => {
    it('has [Blocker]', () => {
      const g = mine(L9.neutral, { characters: [id] });
      expect(kw(g, g.find('p1', 'characters', id))).toContain('Blocker');
    });

    it('can block an attack on my Leader: it is the only blocker offered and is rested by blocking', () => {
      const g = defend();
      const atk = g.find('p2', 'characters', V9.c3);
      attack(g, atk, g.leader('p1'));
      expect(blockers(g)).toEqual([g.find('p1', 'characters', id)]);
      act(g, { type: 'block', blocker: g.find('p1', 'characters', id) });
      expect(g.card(g.find('p1', 'characters', id)).rested).toBe(true);
    });

    it('can block an attack on another of my Characters', () => {
      const g = defend([id, { card: V9.c4, rested: true }]);
      attack(g, g.find('p2', 'characters', V9.c3), g.find('p1', 'characters', V9.c4));
      expect(blockers(g)).toEqual([g.find('p1', 'characters', id)]);
    });

    it('a rested one cannot block', () => {
      const g = defend([{ card: id, rested: true }]);
      attack(g, g.find('p2', 'characters', V9.c3), g.leader('p1'));
      expect(blockers(g)).toEqual([]);
    });

    it(`blocking an attacker with more than ${power} power loses the battle: it is K.O.'d and trashed`, () => {
      const g = defend();
      attack(g, g.find('p2', 'characters', V9.c8), g.leader('p1'));
      act(g, { type: 'block', blocker: g.find('p1', 'characters', id) });
      noDefence(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([id]);
      expect(g.life('p1')).toBe(4);
    });

    it('the Leader takes no damage when it blocks (the blocked attack never reaches the Leader)', () => {
      const g = defend();
      attack(g, g.find('p2', 'characters', V9.c3), g.leader('p1'));
      act(g, { type: 'block', blocker: g.find('p1', 'characters', id) });
      noDefence(g);
      expect(g.life('p1')).toBe(4);
    });

    it(`playing it asks nothing: no [On Play]; it costs ${cost} and enters active`, () => {
      const g = mine(L9.neutral, { hand: [id] });
      playId(g, id);
      expect(atMain(g)).toBe(true);
      expect(g.card(g.find('p1', 'characters', id)).rested).toBe(false);
      expect(donSum(g, 'p1')).toMatchObject({ active: 10 - cost, rested: cost });
    });

    it(`its Counter of +${counter} can be used from hand: it saves a Leader from an equal-power attack`, () => {
      const g = theirs(L9.neutral, { hand: [id] }, { characters: [V9.c3] });
      attack(g, g.find('p2', 'characters', V9.c3), g.leader('p1'));
      passBlock(g);
      act(g, { type: 'counter', card: g.find('p1', 'hand', id), target: g.leader('p1') });
      expect(g.power(g.leader('p1'))).toBe(5000 + counter);
      act(g, { type: 'endCounter' });
      expect(g.life('p1')).toBe(4);
    });
  });
}

export interface LookBottomCfg {
  id: CardId;
  n: number;
  /** Where the game stands when p1's effect has fully resolved. */
  after: 'main' | 'block';
  /** Begin the effect with p1's deck = `deckTopFirst`; leave the first prompt pending. */
  start: (deckTopFirst: CardId[]) => TestGame;
  /** Two cards that satisfy the filter. */
  match: [CardId, CardId];
  /** A card that satisfies the filter only through a multi-valued type or a type that merely includes the text. */
  multi?: CardId;
  /** A card that satisfies the filter but is excluded by name ("other than [itself]"). */
  excluded?: CardId;
  /** A card that does not satisfy the filter. */
  miss: CardId;
}

/** "Look at n; reveal up to 1 <filter> and add it to your hand. Then, place the rest at the bottom of your deck in any order." */
export function describeLookBottom(cfg: LookBottomCfg): void {
  const { id, n, start, match, multi, excluded, miss } = cfg;
  const pad = (k: number): CardId[] => Array.from({ length: k }, () => miss);
  const below: CardId[] = [match[0], ...Array.from({ length: 8 }, () => BLUE)];
  const begin = (top: CardId[]) => start([...top, ...below]);
  const total = n + below.length;
  const top = (): CardId[] => [match[0], miss, match[1], ...pad(n - 3)];
  const finished = (g: TestGame) => {
    settleOrders(g, 'p1');
    if (cfg.after === 'main') expect(decision(g)?.kind).toBe('main');
    else expect(decision(g)?.player).toBe('p2');
  };
  describe(`${id} look at ${n}, add up to 1, rest to the bottom`, () => {
    it('offers exactly the matching cards of the top; the pick goes to hand and the rest to the bottom', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...match].sort());
      pickCards(g, [match[1]]);
      finished(g);
      expect(hand(g)).toEqual([match[1]]);
      expect(deck(g)).toHaveLength(total - 1);
      expect(deck(g)[0]).toBe(match[0]);
      const left = [...top()];
      left.splice(left.indexOf(match[1]), 1);
      expect(tail(deck(g), n - 1)).toEqual([...left].sort());
    });

    it('"up to 1": adding nothing is allowed; all looked-at cards go to the bottom', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      none(g);
      finished(g);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(total);
      expect(deck(g)[0]).toBe(match[0]);
      expect(tail(deck(g), n)).toEqual([...top()].sort());
    });

    it('adds at most one card even when two qualify', () => {
      const g = begin(top());
      const sets = reachablePickSets(g);
      expect(sets.has('')).toBe(true);
      expect(sets.has(match[0])).toBe(true);
      expect(sets.has(match[1])).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it(`only the top ${n} are looked at: a match in position ${n + 1} is neither offered nor moved`, () => {
      const g = begin(pad(n));
      // An "up to" pick over hidden cards is asked even when nothing qualifies (max 0).
      answerEmptyChoose(g, 'p1');
      finished(g);
      expect(deck(g)[0]).toBe(match[0]);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(total);
    });

    it('the added card is revealed (CR 11-2-1); the cards that are not added are not', () => {
      const g = begin(top());
      pickCards(g, [match[1]]);
      finished(g);
      expect(hasEvent(g, 'CardRevealed', { card: match[1] })).toBe(true);
      expect(hasEvent(g, 'CardRevealed', { card: miss })).toBe(false);
    });

    if (multi) {
      it('a card whose types only include the filter text qualifies', () => {
        const g = begin([multi, miss, ...pad(n - 2)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([multi]);
      });
    }

    if (excluded) {
      it('"other than [itself]": a card of the excluded name is not offered though it matches otherwise', () => {
        const g = begin([excluded, match[1], ...pad(n - 2)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([match[1]]);
      });
    }

    it('the looked-at cards leave the top: the card that was below them is now on top', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      none(g);
      finished(g);
      expect(deck(g).slice(0, 9)).toEqual(below);
    });
  });
}

export interface LookTrashCfg {
  id: CardId;
  n: number;
  /** Where the game stands when p1's effect has fully resolved. */
  after: 'main' | 'block';
  /** Begin the effect with p1's deck = `deckTopFirst` and `extraHand` in hand; leave the first prompt pending. */
  start: (deckTopFirst: CardId[], extraHand: CardId[]) => TestGame;
  /** Two cards that satisfy the filter. */
  match: [CardId, CardId];
  /** A card that satisfies the filter only through a multi-valued type or a type that merely includes the text. */
  multi?: CardId;
  /** A card that does not satisfy the filter. */
  miss: CardId;
  /** A card (not matching) that goes to hand for the trash step. */
  fodder: CardId;
}

export function describeLookTrash(cfg: LookTrashCfg): void {
  const { id, n, start, match, multi, miss, fodder } = cfg;
  const pad = (k: number): CardId[] => Array.from({ length: k }, () => miss);
  const below: CardId[] = [match[0], ...Array.from({ length: 8 }, () => BLUE)];
  const begin = (top: CardId[], extra: CardId[] = [fodder]) => start([...top, ...below], extra);
  const total = n + below.length;
  const finished = (g: TestGame) => {
    settleOrders(g, 'p1');
    if (cfg.after === 'main') expect(decision(g)?.kind).toBe('main');
    else expect(decision(g)?.player).toBe('p2');
  };
  const top = (): CardId[] => [match[0], miss, match[1], ...pad(n - 3)];
  describe(`${id} look at ${n}, add up to 1, rest to the bottom, then trash 1 from hand`, () => {
    it('offers exactly the matching cards of the top; the pick goes to hand; the rest goes to the bottom; then 1 hand card is trashed', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([...match].sort());
      pickCards(g, [match[1]]);
      settleOrders(g, 'p1');
      need(g, 'choose', 'p1');
      // The added card is in the hand and may be trashed, as may the card held before.
      expect(offeredIds(g)).toEqual([fodder, match[1]].sort());
      pickCards(g, [fodder]);
      finished(g);
      expect(hand(g)).toEqual([match[1]]);
      expect(trash(g)).toEqual([fodder]);
      expect(deck(g)).toHaveLength(total - 1);
      expect(deck(g)[0]).toBe(match[0]);
      const left = [...top()];
      left.splice(left.indexOf(match[1]), 1);
      expect(tail(deck(g), n - 1)).toEqual([...left].sort());
    });

    it('the card just added may itself be the one trashed', () => {
      const g = begin(top());
      pickCards(g, [match[0]]);
      settleOrders(g, 'p1');
      pickCards(g, [match[0]]);
      finished(g);
      expect(hand(g)).toEqual([fodder]);
      expect(trash(g)).toEqual([match[0]]);
    });

    it('"up to 1": adding nothing is allowed; all looked-at cards go to the bottom and 1 card is still trashed', () => {
      const g = begin(top());
      need(g, 'choose', 'p1');
      none(g);
      settleOrders(g, 'p1');
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toEqual([fodder]);
      pickCards(g, [fodder]);
      finished(g);
      expect(hand(g)).toEqual([]);
      expect(trash(g)).toEqual([fodder]);
      expect(deck(g)).toHaveLength(total);
      expect(deck(g)[0]).toBe(match[0]);
      expect(tail(deck(g), n)).toEqual([...top()].sort());
    });

    it('adds at most one card even when two qualify', () => {
      const g = begin(top());
      const sets = reachablePickSets(g);
      expect(sets.has('')).toBe(true);
      expect(sets.has(match[0])).toBe(true);
      expect(sets.has(match[1])).toBe(true);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    });

    it(`only the top ${n} are looked at: a match in position ${n + 1} is neither offered nor moved`, () => {
      const g = begin(pad(n));
      // An "up to" pick over hidden cards is asked even when nothing qualifies (max 0).
      answerEmptyChoose(g, 'p1');
      settleOrders(g, 'p1');
      need(g, 'choose', 'p1');
      pickCards(g, [fodder]);
      finished(g);
      expect(deck(g)[0]).toBe(match[0]);
      expect(hand(g)).toEqual([]);
    });

    it('the trash is exactly 1, not "up to": it cannot be skipped and no selection has 2 cards', () => {
      const g = begin(top(), [fodder, BLUE]);
      pickCards(g, [match[1]]);
      settleOrders(g, 'p1');
      need(g, 'choose', 'p1');
      expect(canFinish(g)).toBe(false);
      for (const s of reachablePickSets(g)) expect(s.split('+').filter(Boolean)).toHaveLength(1);
    });

    it('the added card is revealed (CR 11-2-1); the cards that are not added are not', () => {
      const g = begin(top());
      pickCards(g, [match[1]]);
      settleOrders(g, 'p1');
      pickCards(g, [fodder]);
      finished(g);
      expect(hasEvent(g, 'CardRevealed', { card: match[1] })).toBe(true);
      expect(hasEvent(g, 'CardRevealed', { card: miss })).toBe(false);
    });

    if (multi) {
      it('a card whose types only include the filter text qualifies; a non-matching card is not offered', () => {
        const g = begin([multi, miss, ...pad(n - 2)]);
        need(g, 'choose', 'p1');
        expect(offeredIds(g)).toEqual([multi]);
      });
    }

    it('with an empty hand and nothing added there is nothing to trash: no card leaves the hand and the game moves on', () => {
      const g = begin(top(), []);
      need(g, 'choose', 'p1');
      none(g);
      settleOrders(g, 'p1');
      if (kind(g) === 'choose') answerEmptyChoose(g, 'p1');
      finished(g);
      expect(trash(g)).toEqual([]);
      expect(hand(g)).toEqual([]);
    });

    it('with an empty hand and a card added, that card is the only one that can be trashed', () => {
      const g = begin(top(), []);
      pickCards(g, [match[1]]);
      settleOrders(g, 'p1');
      if (kind(g) === 'choose') pickCards(g, [match[1]]);
      finished(g);
      expect(hand(g)).toEqual([]);
      expect(trash(g)).toEqual([match[1]]);
    });
  });
}

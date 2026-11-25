/**
 * Helpers for the EB-02 group-A independent card tests. Public API, frozen fixtures and the earlier
 * kits only. Every answer helper accepts ONE named kind of prompt. Scenery stats are noted next to
 * each constant; tests repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, decision, fill } from '../../helpers.ts';
import {
  canFinish,
  choices,
  choose,
  chooseNone,
  donChoices,
  kind,
  reachablePickSets,
} from '../kit.ts';
import { deck, hand, mine, tail } from '../m4b/kit-a.ts';
import { playRaw } from '../op15/kit-op15a.ts';

export * from '../op15/kit-op15a.ts';

/** Leaders used as scenery (none has an effect that fires unless a test makes it). */
export const E2L = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. [Activate: Main] only. */
  shc: 'ST01-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, {Baroque Works}/{The Seven Warlords of the Sea}. [Activate: Main] only. */
  croc: 'ST03-001',
  /** ST13-002 Portgas.D.Ace: Red, 5000, {Whitebeard Pirates}. [DON!! x2] [Activate: Main]; [End of Your Turn] face-up Life only. */
  ace: 'ST13-002',
  /** OP05-022 Donquixote Rosinante: Black, 5000, {Donquixote Pirates}/{Navy}. [Blocker]; [End of Your Turn] set active. */
  rosinante: 'OP05-022',
  /** ST09-001 Yamato: Yellow, 5000, {Land of Wano}. Only an [Opponent's Turn] boost at 2 or less Life. */
  wano: 'ST09-001',
  /** OP06-020 Hody Jones: Green, 5000, {Fish-Man}/{New Fish-Man Pirates}. [Activate: Main] only. */
  fishMan: 'OP06-020',
  /** OP03-040 Nami: Green, 5000, {East Blue}. Only a deck-out rule and a [DON!! x1] attack effect. */
  eastBlue: 'OP03-040',
  /** EB04-001 Jewelry Bonney: Red/Yellow (multicoloured), 4 Life, {Bonney Pirates}/{Egghead}. */
  multi: 'EB04-001',
} as const;

/** Vanilla scenery Characters (no text that fires). */
export const E2C = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000, {Animal}/{Land of Wano}. */
  komachiyo: 'OP01-010',
  /** ST01-003 Karoo: Red, cost 1, 3000, Counter +1000, {Animal}/{Alabasta}. */
  karoo1: 'ST01-003',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000, {Happosui Army}. */
  sai: 'OP01-012',
  /** OP03-035 Momoo: Green, cost 2, 4000, Counter +1000, {Animal}/{East Blue}. */
  momoo: 'OP03-035',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  marco: 'OP01-023',
  /** EB02-029 Grandpa Ryu: cost 3, 5000, Counter +1000, {Animal}/{East Blue}. */
  ryu: 'EB02-029',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** EB02-001 Karoo: cost 5, 7000, Counter +1000, {Animal}/{Alabasta}. */
  karoo5: 'EB02-001',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  thatch: 'OP02-007',
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. */
  mohji: 'OP02-060',
  /** OP04-007 Sanji: cost 1, 3000, Counter +1000, {Alabasta}/{Straw Hat Crew}. */
  shc1: 'OP04-007',
  /** OP02-033 Jinbe: cost 2, 4000, Counter +1000, {FILM}/{Fish-Man}/{Straw Hat Crew}. */
  shc2: 'OP02-033',
  /** OP09-063 Usopp: cost 4, 6000, Counter +1000, {Straw Hat Crew}. */
  shc4: 'OP09-063',
  /** EB05-041 Koala: cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. */
  koala: 'EB05-041',
  /** OP05-012 Hack: cost 3, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}. */
  hack: 'OP05-012',
  /** OP09-113 Morley: cost 4, 6000, Counter +1000, {Giant}/{Revolutionary Army}. */
  morley: 'OP09-113',
  /** EB02-012 Gaimon: cost 1, 1000, Counter +1000, {East Blue}. Under test elsewhere; a 1000-power body without [Sarfunkel]. */
  gaimon: 'EB02-012',
  /** OP03-032 Buggy: cost 3, 5000, no Counter, {Buggy Pirates}/{East Blue}. Vanilla (slash K.O. protection only). */
  buggy3: 'OP03-032',
} as const;

/** The labels of the pending count question (a `choose` with purpose `mode` over option ids). */
export function countOptions(g: TestGame): string[] {
  const d = decision(g);
  return d?.kind === 'choose' && d.purpose === 'mode' ? (d.options ?? []).map((o) => o.id) : [];
}

/** Answer the pending count question with `n`. */
export function answerCount(g: TestGame, n: number): void {
  const d = decision(g);
  if (d?.kind !== 'choose' || d.purpose !== 'mode')
    throw new Error(`Expected a count question, got ${d?.kind}/${d?.purpose} (${d?.prompt})`);
  act(g, { type: 'pick', choice: { option: String(n) } });
}

/** Pay a pending DON!! cost with N picks of the class `from` (strict: DON!! classes only). */
export function payDonFrom(g: TestGame, n: number, from: 'costActive' | 'costRested'): void {
  for (let i = 0; i < n; i++) {
    if (kind(g) !== 'choose') return;
    const want = donChoices(g).find((o) => o.from === from);
    if (!want) throw new Error(`No ${from} DON!! offered`);
    act(g, { type: 'pick', choice: want });
  }
}

/** True if the pending decision is a `choose` that offers `i`. */
export function offers(g: TestGame, i: InstanceId): boolean {
  return kind(g) === 'choose' && choices(g).includes(i);
}

/** Card id helper for typing. */
export type Id = CardId;
export type Who = PlayerId;

// ---------------------------------------------------------------------------------------------
// "If you have 3 or more DON!! cards on your field, look at 7 cards from the top of your deck;
// reveal up to 1 [NAMED] and add it to your hand. Then, place the rest at the bottom of your deck in
// any order and play up to 1 [NAMED] from your hand." (EB02-013 Carrot, EB02-032 Iceburg)
// ---------------------------------------------------------------------------------------------

/**
 * Drive the look-reveal-play effect: at the reveal pick (candidates in the deck) take the first of
 * `take` (nothing when empty); at the play pick (candidates in the hand) play the first of `play`.
 * `order` decisions get their first listed answer.
 */
export function driveLookPlay(g: TestGame, take: CardId[], play: CardId[]): void {
  const reveal = [...take];
  const toPlay = [...play];
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.player !== 'p1') return;
    if (d.kind === 'order') {
      g.act(g.legal().find((a) => a.type === 'order')!);
      continue;
    }
    if (d.kind !== 'choose') return;
    const offered = choices(g);
    if (offered.length === 0) {
      if (canFinish(g)) chooseNone(g);
      else return;
      continue;
    }
    const inDeck = offered.every((x) => g.card(x).zone === 'deck');
    const inHandNow = offered.every((x) => g.card(x).zone === 'hand');
    if (!inDeck && !inHandNow) return;
    const want = (inDeck ? reveal : toPlay).shift();
    if (want === undefined) chooseNone(g);
    else choose(g, [offered.find((x) => g.card(x).card === want)!]);
  }
}

/**
 * With raw actions, walk a look-and-play effect whose reveal found nothing until the "play up to 1
 * ... in your hand" pick, and return that decision (null if it is never asked). Order decisions get
 * their first listed answer and empty picks are ended with `done`.
 */
export function walkToHandPick(g: TestGame) {
  for (let i = 0; i < 25; i++) {
    const d = decision(g);
    if (!d || d.player !== 'p1' || d.kind === 'main') return null;
    if (d.kind === 'choose' && /in hand/.test(d.prompt)) return d;
    if (d.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    else if (g.legal().some((a) => a.type === 'done')) act(g, { type: 'done' });
    else return null;
  }
  return null;
}

/** Shared tests for a "look at 7, reveal up to 1 [NAMED], then play up to 1 [NAMED]" [On Play]. */
export function describeLookPlay(cfg: {
  id: CardId;
  /** The named card (a Stage, cost 3, playable for free from hand). */
  named: CardId;
  /** Another Stage of a different name, which must never be offered. */
  decoy: CardId;
}): void {
  const { id, named, decoy } = cfg;
  const filler = 'OP02-060';
  const top = (): CardId[] => [filler, filler, named, filler, filler, filler, filler];
  const rest = (): CardId[] => [decoy, ...fill(filler, 8)];
  const start = (
    topCards: CardId[],
    o: {
      handExtra?: CardId[];
      active?: number;
      leader?: string | { card: string; don: number };
    } = {},
  ) => {
    const g = mine(o.leader ?? 'ST01-001', {
      hand: [id, ...(o.handExtra ?? [])],
      deck: [...topCards, ...rest()],
      costArea: { active: o.active ?? 3, rested: 0 },
    });
    playRaw(g, id);
    return g;
  };
  const stageOf = (g: TestGame) => g.zone('p1', 'stage').map((c) => c.card);
  const offeredCards = (g: TestGame) =>
    kind(g) === 'choose' ? choices(g).map((x) => g.card(x).card) : [];

  describe(`${id}: look at 7, reveal up to 1 [${named}], then play up to 1 [${named}] from hand`, () => {
    it('with 3 DON!! on the field: offers only the named card, adds it, and it can be played from hand', () => {
      const g = start(top());
      expect(offeredCards(g)).toEqual([named]);
      driveLookPlay(g, [named], [named]);
      expect(stageOf(g)).toEqual([named]);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(15);
    });

    it('the rest of the looked-at cards go to the bottom of the deck; the 8th card is now on top', () => {
      const g = start(top());
      driveLookPlay(g, [named], []);
      expect(deck(g)).toHaveLength(15);
      expect(deck(g)[0]).toBe(decoy);
      expect(tail(deck(g), 6)).toEqual(fill(filler, 6));
      expect(hand(g)).toEqual([named]);
    });

    it('with only 2 DON!! on the field nothing happens (no look, deck untouched)', () => {
      const g = start(top(), { active: 2 });
      expect(decision(g)?.kind).toBe('main');
      expect(deck(g)).toHaveLength(16);
      expect(hand(g)).toEqual([]);
    });

    it('DON!! given to my Leader count as on the field (2 in the cost area + 1 given = 3)', () => {
      const g = start(top(), { active: 2, leader: { card: 'ST01-001', don: 1 } });
      expect(offeredCards(g)).toEqual([named]);
    });

    it('"up to 1": revealing nothing puts all 7 looked-at cards at the bottom', () => {
      const g = start(top());
      driveLookPlay(g, [], []);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(16);
      expect(deck(g)[0]).toBe(decoy);
      expect(tail(deck(g), 7)).toEqual([...top()].sort());
    });

    it('only the top 7 are looked at: a named card in 8th place is not offered', () => {
      const g = start([...fill(filler, 7), named]);
      expect(offeredCards(g)).not.toContain(named);
      driveLookPlay(g, [], []);
      expect(hand(g)).toEqual([]);
      expect(deck(g)).toHaveLength(17);
      expect(deck(g)[0]).toBe(named);
    });

    it('a named card already in my hand can be played even if none is revealed', () => {
      const g = start(fill(filler, 7), { handExtra: [named] });
      driveLookPlay(g, [], [named]);
      expect(stageOf(g)).toEqual([named]);
      expect(hand(g)).toEqual([]);
    });

    it('"up to 1" on the play: the revealed card may stay in hand', () => {
      const g = start(top());
      driveLookPlay(g, [named], []);
      expect(stageOf(g)).toEqual([]);
      expect(hand(g)).toEqual([named]);
    });

    it('a card of another name is never offered, neither to reveal nor to play', () => {
      const g = start([decoy, ...fill(filler, 6)], { handExtra: [decoy] });
      expect(offeredCards(g)).not.toContain(decoy);
      driveLookPlay(g, [], []);
      expect(stageOf(g)).toEqual([]);
    });

    it('the "play up to 1" pick over the hand is asked (at max 0) even when no named card is in hand', () => {
      const g = start(fill(filler, 7));
      const d = walkToHandPick(g);
      expect(d).not.toBeNull();
      expect(d?.max).toBe(0);
      expect(g.legal().some((a) => a.type === 'done')).toBe(true);
    });

    it('reveals at most one even when two named cards are in the top 7', () => {
      const g = start([named, filler, named, ...fill(filler, 4)]);
      const sets = reachablePickSets(g);
      for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
      expect(sets.has(named)).toBe(true);
    });
  });
}

// ---------------------------------------------------------------------------------------------
// EB02-024 Sogeking's [On Play]: draw 2, place exactly 2 cards of the hand at the bottom, then
// return up to 1 Character with cost 1 or less. Prompts are told apart by what they ask.
// ---------------------------------------------------------------------------------------------

/**
 * Drive the [On Play] after `playRaw`: the "place 2" pick takes `place` (instances in hand) or the
 * first offered cards; the order decision takes the first listed order; the return pick takes
 * `target`, or nothing for `'none'`. Any other decision ends the drive.
 */
export function driveSogeking(
  g: TestGame,
  target: InstanceId | 'none',
  place: InstanceId[] = [],
): void {
  const want = [...place].sort();
  for (let i = 0; i < 12; i++) {
    const d = decision(g);
    if (!d || d.player !== 'p1') return;
    if (d.kind === 'order') {
      g.act(g.legal().find((a) => a.type === 'order')!);
    } else if (d.kind === 'choose' && /in hand/.test(d.prompt)) {
      const offered = choices(g);
      const next = want.shift() ?? offered[0]!;
      act(g, { type: 'pick', choice: next });
    } else if (d.kind === 'choose' && /return/.test(d.prompt)) {
      if (target === 'none') chooseNone(g);
      else choose(g, [target]);
    } else return;
  }
}

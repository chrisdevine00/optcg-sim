/**
 * PRB02-012 Nami (Character, cost 2, 2000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Straw Hat Crew"
 * type card other than [Nami] and add it to your hand. Then, place the rest at the bottom of your
 * deck in any order. [Trigger] Play this card."
 *
 * Rules: looking is limited to the top 5. The added card is revealed (CR 11-2-1). "Up to 1" may be
 * answered with nothing. "Other than [Nami]" excludes every card NAMED Nami. [Trigger] (CR 10-1-5):
 * when a Life card with [Trigger] is taken as damage, its owner may activate it instead of adding
 * it to the hand; "Play this card" puts it on the field and its [On Play] then activates.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMainOf,
  BLUE,
  declineTrigger,
  deck,
  hand,
  hasEvent,
  hitLeader,
  kind,
  LDP,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  settleOrders,
  SP,
  sorted,
  tail,
  theirs,
} from './kit-prb02sta.ts';

const NA = 'PRB02-012';
/** OP02-028 Usopp: Green, cost 3, 5000, {FILM}/{Straw Hat Crew}. Vanilla. */
const S1 = 'OP02-028';
/** OP02-039 Franky: Green, cost 5, 7000, {FILM}/{Straw Hat Crew}. Vanilla. */
const S2 = 'OP02-039';
/** OP07-099 Usopp: Yellow, cost 1, 2000, {Straw Hat Crew}/{Egghead} ([Trigger] only). */
const S3 = 'OP07-099';
/** OP10-013 Nami: Red, cost 5, 7000, {Straw Hat Crew}/{Punk Hazard}. Named Nami. */
const OTHER_NAMI = 'OP10-013';
const REST = Array.from({ length: 10 }, () => BLUE);

function play(top: string[]) {
  const g = mine(LDP.neutral, { hand: [NA], deck: [...top, ...REST] });
  playRaw(g, NA);
  return g;
}

describe('PRB02-012 Nami: [On Play] look 5, add up to 1 {Straw Hat Crew} other than [Nami]; [Trigger] play this card', () => {
  it('printed values: cost 2, 2000 power, Counter +1000', () => {
    const g = mine(LDP.neutral, { characters: [NA] });
    const i = at(g, 'p1', 'characters', NA);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([2, 2000, 1000]);
  });

  it('offers exactly the {Straw Hat Crew} cards among the top 5 (types may be several), never a card named [Nami]', () => {
    const g = play([S1, OTHER_NAMI, SP.mohji, S2, S3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S1, S2, S3].sort());
  });

  it('the chosen card is revealed and added to hand; the other 4 go to the bottom, the deck below them is next', () => {
    const g = play([SP.c1p3, S2, SP.c2p4, S1, SP.c3p5]);
    pickCards(g, [S2]);
    settleOrders(g);
    expect(atMainOf(g)).toBe(true);
    expect(hand(g)).toEqual([S2]);
    expect(hasEvent(g, 'CardRevealed', { card: S2 })).toBe(true);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g).slice(0, 10)).toEqual(REST);
    expect(tail(deck(g), 4)).toEqual([SP.c1p3, SP.c2p4, S1, SP.c3p5].sort());
  });

  it('"up to 1": choosing nothing adds nothing and all 5 cards go to the bottom', () => {
    const g = play([S1, S2, SP.c1p3, SP.c2p4, SP.c3p5]);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([S1, S2, SP.c1p3, SP.c2p4, SP.c3p5].sort());
  });

  it('adds at most 1 card even when several qualify', () => {
    const sets = reachablePickSets(play([S1, S2, S3, SP.c2p4, SP.c3p5]));
    expect(sets.has('')).toBe(true);
    expect(sets.has(S1)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a {Straw Hat Crew} card in 6th position is not offered', () => {
    const g = play([SP.c1p3, SP.c2p4, SP.c3p5, SP.c1p3, SP.c2p4, S1]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(S1);
  });

  it('with only [Nami]-named cards in the top 5 nothing can be added', () => {
    const g = play([OTHER_NAMI, SP.c1p3, SP.c2p4, SP.c3p5, SP.c1p3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([OTHER_NAMI, SP.c1p3, SP.c1p3, SP.c2p4, SP.c3p5].sort());
  });

  it('[Trigger]: taking damage and activating it plays Nami and her [On Play] then looks at 5', () => {
    const g = theirs(LDP.neutral, {
      life: [NA, SP.c1p3, SP.c1p3, SP.c1p3],
      deck: [S1, SP.c2p4, SP.c3p5, SP.c2p4, SP.c3p5, ...REST],
    });
    hitLeader(g);
    activateTrigger(g);
    expect(sorted(g, 'p1', 'characters')).toEqual([NA]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S1]);
    pickCards(g, [S1]);
    settleOrders(g);
    expect(hand(g)).toEqual([S1]);
  });

  it('[Trigger]: declining adds Nami to hand instead and nothing is looked at', () => {
    const g = theirs(LDP.neutral, { life: [NA, SP.c1p3, SP.c1p3, SP.c1p3], deck: [S1, ...REST] });
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([NA]);
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(deck(g)[0]).toBe(S1);
  });
});

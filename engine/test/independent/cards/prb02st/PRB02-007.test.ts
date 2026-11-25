/**
 * PRB02-007 Jinbe (Character, cost 4, 5000, Counter +1000, {Fish-Man}/{The Seven Warlords of the
 * Sea}/{The Sun Pirates}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {The Seven Warlords
 * of the Sea} type card other than [Jinbe] and add it to your hand. Then, place the rest at the
 * bottom of your deck in any order. [When Attacking] Place up to 1 Character with a cost of 1 or
 * less at the bottom of the owner's deck."
 *
 * Rules: looking is limited to the top 5 (CR 11-2). The added card is revealed (CR 11-2-1). "Up to
 * 1" may be answered with nothing. "Other than [Jinbe]" excludes every card NAMED Jinbe, whatever
 * its type. A placed Character goes to the bottom of ITS OWNER's deck.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chr,
  deck,
  hand,
  hasEvent,
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
  trash,
  pickInst,
  atMainOf,
  BLUE,
} from './kit-prb02sta.ts';

const JI = 'PRB02-007';
/** OP02-054 Gecko Moria: Blue, cost 4, 6000, {The Seven Warlords of the Sea}/{Thriller Bark Pirates}, [Trigger] only. */
const W1 = 'OP02-054';
/** OP02-055 Dracule Mihawk: Blue, cost 6, 8000, {The Seven Warlords of the Sea}, [Trigger] only. */
const W2 = 'OP02-055';
/** OP07-045 Jinbe: Blue, cost 4, 5000, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}: named Jinbe. */
const OTHER_JINBE = 'OP07-045';
const REST = Array.from({ length: 10 }, () => BLUE);

function play(top: string[]) {
  const g = mine(LDP.neutral, { hand: [JI], deck: [...top, ...REST] });
  playRaw(g, JI);
  return g;
}

describe('PRB02-007 Jinbe: [On Play] look 5, add up to 1 {The Seven Warlords of the Sea} other than [Jinbe]; [When Attacking] bottom-deck a cost 1 or less', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LDP.neutral, { characters: [JI] });
    const i = at(g, 'p1', 'characters', JI);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 5000, 1000]);
  });

  it('[On Play] offers exactly the {Warlord} cards among the top 5, never a card named [Jinbe] (even with the type)', () => {
    const g = play([W1, OTHER_JINBE, SP.mohji, W2, SP.c1p3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W1, W2].sort());
  });

  it('the chosen card is revealed and added to hand; the other 4 go to the bottom, the deck below them is next', () => {
    const g = play([SP.c1p3, W2, SP.c2p4, W1, SP.c3p5]);
    pickCards(g, [W2]);
    settleOrders(g);
    expect(atMainOf(g)).toBe(true);
    expect(hand(g)).toEqual([W2]);
    expect(hasEvent(g, 'CardRevealed', { card: W2 })).toBe(true);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g).slice(0, 10)).toEqual(REST);
    expect(tail(deck(g), 4)).toEqual([SP.c1p3, SP.c2p4, W1, SP.c3p5].sort());
  });

  it('"up to 1": choosing nothing adds nothing and all 5 cards go to the bottom', () => {
    const g = play([W1, W2, SP.c1p3, SP.c2p4, SP.c3p5]);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g).slice(0, 10)).toEqual(REST);
    expect(tail(deck(g), 5)).toEqual([W1, W2, SP.c1p3, SP.c2p4, SP.c3p5].sort());
  });

  it('adds at most 1 card even when two qualify', () => {
    const g = play([W1, W2, SP.c1p3, SP.c2p4, SP.c3p5]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(W1)).toBe(true);
    expect(sets.has(W2)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a {Warlord} in 6th position is not offered', () => {
    const g = play([SP.c1p3, SP.c2p4, SP.c3p5, SP.c1p3, SP.c2p4, W1]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(W1);
  });

  it('with no {Warlord} in the top 5 nothing is added and the 5 cards still go to the bottom', () => {
    const g = play([SP.c1p3, SP.c2p4, SP.c3p5, SP.c1p3, SP.c2p4]);
    if (kind(g) === 'choose') none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
    expect(tail(deck(g), 5)).toEqual([SP.c1p3, SP.c1p3, SP.c2p4, SP.c2p4, SP.c3p5].sort());
  });

  it('[When Attacking] offers Characters of BOTH players with cost 1 or less, not cost 2, not Leaders', () => {
    const g = mine(
      LDP.neutral,
      { characters: [JI, SP.c1p3, SP.c2p4] },
      { characters: [SP.mohji, SP.c2p4] },
    );
    attack(g, at(g, 'p1', 'characters', JI), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c1p3, SP.mohji].sort());
  });

  it("[When Attacking]: an opposing Character goes to the bottom of the OPPONENT's deck", () => {
    const g = mine(
      LDP.neutral,
      { characters: [JI] },
      { characters: [SP.mohji], deck: [SP.c2p4, SP.c3p5, SP.c4p6] },
    );
    attack(g, at(g, 'p1', 'characters', JI), g.leader('p2'));
    pickInst(g, [chr(g, 'p2', SP.mohji)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([]);
    expect(g.zone('p2', 'deck').map((c) => c.card)).toEqual([SP.c2p4, SP.c3p5, SP.c4p6, SP.mohji]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('[When Attacking]: my own Character goes to the bottom of MY deck (not to hand or trash)', () => {
    const g = mine(LDP.neutral, { characters: [JI, SP.c1p3], deck: [SP.c2p4, SP.c3p5] });
    attack(g, at(g, 'p1', 'characters', JI), g.leader('p2'));
    pickInst(g, [chr(g, 'p1', SP.c1p3)]);
    expect(deck(g)).toEqual([SP.c2p4, SP.c3p5, SP.c1p3]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
  });

  it('[When Attacking] "up to 1": choosing nothing moves nothing and the attack goes on', () => {
    const g = mine(LDP.neutral, { characters: [JI] }, { characters: [SP.mohji] });
    attack(g, at(g, 'p1', 'characters', JI), g.leader('p2'));
    need(g, 'choose', 'p1');
    none(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.mohji]);
    expect(kind(g)).toBe('block');
  });

  it('[When Attacking] with no Character of cost 1 or less on the field the attack just goes on', () => {
    const g = mine(LDP.neutral, { characters: [JI] }, { characters: [SP.c2p4] });
    attack(g, at(g, 'p1', 'characters', JI), g.leader('p2'));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('block');
  });
});

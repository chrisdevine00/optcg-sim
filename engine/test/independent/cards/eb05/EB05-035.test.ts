/**
 * EB05-035 Speed (Character, Purple, cost 6, 6000, Counter +1000, {Animal Kingdom Pirates}/{SMILE}).
 *
 * Card text: "[On Play] DON!! -1: Look at 5 cards from the top of your deck; reveal up to 2 {SMILE}
 * type cards and add them to your hand, then place the rest at the bottom of your deck in any
 * order. Then, play up to 2 {SMILE} type Character cards with 5000 power or less from your hand."
 *
 * Rules: CR 8-4-4-1/-2 ("up to" may choose 0; a search of a hidden area may whiff), RD 112 (an
 * [On Play] cost may be declined), CR 8-3-1-6 (DON!! -1), "play" by an effect pays no cost
 * (CR 2-7-2 is for playing from hand by the rules), CR 8-4-4-4.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  beginUse,
  CH,
  chars,
  chooseCards,
  chooseNone,
  choiceCards,
  deck,
  don,
  drive,
  hand,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  settleOrder,
  settleYes,
  STRIKE_FILL,
  tail,
  decline,
} from './kit-b.ts';

const ID = 'EB05-035';
const REST = (n = 10) => fill(BLUE, n);

function start(top: string[], handExtra: string[] = [], below: string[] = REST()) {
  const g = mine(LD.neutral, {
    hand: [ID, ...handExtra],
    deck: [...top, ...below],
    costArea: { active: 10, rested: 0 },
  });
  playCard(g, ID);
  beginUse(g);
  return g;
}

describe('EB05-035 Speed [On Play]: DON!! -1: look 5, add up to 2 {SMILE}, then play up to 2 {SMILE} Characters (<= 5000)', () => {
  it('happy path: both SMILE cards are added, both are played, the other 3 go to the bottom', () => {
    const top = [CH.solitaire, CH.dobon, CH.mohji, CH.mohji, CH.mohji];
    const g = start(top);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.dobon, CH.solitaire].sort());
    chooseCards(g, [CH.solitaire, CH.dobon]);
    settleOrder(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.dobon, CH.solitaire].sort());
    chooseCards(g, [CH.solitaire, CH.dobon]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([ID, CH.dobon, CH.solitaire].sort());
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15 - 5 + 3);
    expect(tail(deck(g), 3)).toEqual([CH.mohji, CH.mohji, CH.mohji]);
  });

  it('DON!! -1 is paid: one DON!! goes back to the DON!! deck', () => {
    const g = start([CH.solitaire, CH.mohji, CH.mohji, CH.mohji, CH.mohji]);
    expect(don(g).deck).toBe(1);
    expect(don(g).active + don(g).rested).toBe(9);
  });

  it('a card played by the effect costs no DON!!: the rested DON!! stay at the 6 paid for Speed', () => {
    const g = start([CH.solitaire, CH.dobon, CH.mohji, CH.mohji, CH.mohji]);
    chooseCards(g, [CH.solitaire, CH.dobon]);
    settleOrder(g);
    chooseCards(g, [CH.solitaire, CH.dobon]);
    settleYes(g, 'p1');
    // Speed's 6 are rested; the DON!! -1 took one of the 4 active ones.
    expect(don(g).rested).toBe(6);
    expect(don(g).active).toBe(3);
  });

  it('"up to 2": adding only one card is possible, and never more than two', () => {
    const g = start([CH.solitaire, CH.dobon, CH.ginrummy, CH.mohji, CH.mohji]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(CH.dobon)).toBe(true);
    expect(sets.has([CH.dobon, CH.solitaire].sort().join('+'))).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('adding nothing: all 5 looked-at cards go to the bottom and nothing is played', () => {
    const top = [CH.solitaire, CH.dobon, CH.mohji, CH.mohji, CH.mohji];
    const g = start(top);
    drive(g, 'p1', {});
    expect(hand(g)).toEqual([]);
    expect(chars(g)).toEqual([ID]);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('only the top 5 are looked at: a {SMILE} card in 6th place is not offered', () => {
    const g = start([CH.mohji, CH.mohji, CH.mohji, CH.mohji, CH.mohji], [], [CH.dobon, ...REST(9)]);
    drive(g, 'p1', {});
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(CH.dobon);
  });

  it('only {SMILE} cards are offered for the search (a non-SMILE Red card is not)', () => {
    const g = start([STRIKE_FILL, CH.dobon, CH.sai, CH.mohji, CH.mohji]);
    expect(choiceCards(g)).toEqual([CH.dobon]);
  });

  it('the play step is limited to power 5000 or less: a 7000 {SMILE} card is added but not played', () => {
    const g = start([CH.babanuki, CH.solitaire, CH.mohji, CH.mohji, CH.mohji]);
    chooseCards(g, [CH.babanuki, CH.solitaire]);
    settleOrder(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.solitaire]);
    chooseCards(g, [CH.solitaire]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([CH.babanuki]);
    expect(chars(g)).toEqual([ID, CH.solitaire].sort());
  });

  it('the play step also takes {SMILE} cards that were already in my hand, but at most 2', () => {
    const g = start(
      [CH.mohji, CH.mohji, CH.mohji, CH.mohji, CH.mohji],
      [CH.dobon, CH.dobon, CH.dobon],
    );
    chooseNone(g);
    settleOrder(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.dobon, CH.dobon, CH.dobon]);
    const sets = reachablePickSets(g);
    expect(sets.has(`${CH.dobon}+${CH.dobon}`)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
  });

  it('declining the DON!! -1 skips the whole effect: no look, no play', () => {
    const g = mine(LD.neutral, {
      hand: [ID, CH.dobon],
      deck: [CH.solitaire, ...REST(14)],
      costArea: { active: 10, rested: 0 },
    });
    playCard(g, ID);
    if (kind(g) === 'optional') decline(g);
    expect(hand(g)).toEqual([CH.dobon]);
    expect(deck(g)[0]).toBe(CH.solitaire);
    expect(don(g).deck).toBe(0);
    expect(chars(g)).toEqual([ID]);
  });
});

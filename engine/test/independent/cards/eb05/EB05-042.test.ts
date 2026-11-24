/**
 * EB05-042 Shinobu (Character, Black, cost 4, 5000, Counter +2000, {Land of Wano}).
 *
 * Card text: "[On Play] Draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: RD 112 (an [On Play] without a cost or "may" must be activated), CR 1-3-2 (as much as
 * possible), trashing is not a K.O. (RL-15), the trash is chosen from the whole hand.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  CH,
  chars,
  choose,
  drive,
  hand,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  trash,
} from './kit-b.ts';

const ID = 'EB05-042';
const DECK = [CH.marco, CH.sai, CH.thatch, ...fill(BLUE, 12)];

function go(handExtra: string[] = [], deck: string[] = DECK) {
  const g = mine(LD.neutral, { hand: [ID, ...handExtra], deck });
  playCard(g, ID);
  return g;
}

describe('EB05-042 Shinobu [On Play]: draw 2, trash 2 from hand', () => {
  it('draws the top 2 cards, then trashes 2 cards of my choice from the whole hand', () => {
    const g = go([CH.mohji]);
    expect(kind(g)).toBe('choose');
    // Exact-N picks list only the canonical-first candidates (API-GAPS-b), so read the reachable pairs.
    const pairs = [...reachablePickSets(g)].sort();
    expect(pairs).toEqual(
      [
        [CH.marco, CH.mohji],
        [CH.marco, CH.sai],
        [CH.mohji, CH.sai],
      ]
        .map((p) => p.sort().join('+'))
        .sort(),
    );
    choose(g, [g.find('p1', 'hand', CH.mohji), g.find('p1', 'hand', CH.marco)]);
    expect(hand(g)).toEqual([CH.sai]);
    expect(trash(g)).toEqual([CH.marco, CH.mohji].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(13);
  });

  it('the two cards just drawn may be the ones trashed', () => {
    const g = go([CH.mohji]);
    choose(g, [g.find('p1', 'hand', CH.marco), g.find('p1', 'hand', CH.sai)]);
    expect(hand(g)).toEqual([CH.mohji]);
    expect(trash(g)).toEqual([CH.marco, CH.sai].sort());
  });

  it('the cards drawn are the top two of the deck, in order (the third is left)', () => {
    const g = go([CH.mohji]);
    expect(reachablePickSets(g).has([CH.marco, CH.sai].sort().join('+'))).toBe(true);
    expect([...reachablePickSets(g)].join().includes(CH.thatch)).toBe(false);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(CH.thatch);
  });

  it('it is mandatory: no "use this?" question is asked', () => {
    const g = go();
    expect(kind(g)).not.toBe('optional');
  });

  it('with an empty hand otherwise, the 2 drawn cards are both trashed', () => {
    const g = go();
    drive(g, 'p1', {});
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toHaveLength(2);
  });

  it('the hand ends at its old size: 3 cards before, 3 after (+2 -2)', () => {
    const g = go([CH.mohji, CH.mohji, CH.mohji]);
    choose(g, [g.find('p1', 'hand', CH.marco), g.find('p1', 'hand', CH.sai)]);
    expect(hand(g)).toHaveLength(3);
  });

  it('exactly 2 are trashed, not more: the other cards stay in hand', () => {
    const g = go([CH.mohji, CH.komachiyo]);
    choose(g, [g.find('p1', 'hand', CH.mohji), g.find('p1', 'hand', CH.komachiyo)]);
    expect(trash(g)).toHaveLength(2);
    expect(hand(g)).toEqual([CH.marco, CH.sai].sort());
  });

  it('Shinobu stays on the field; only hand cards are trashed', () => {
    const g = go([CH.mohji]);
    choose(g, [g.find('p1', 'hand', CH.mohji), g.find('p1', 'hand', CH.sai)]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).not.toContain(ID);
  });
});

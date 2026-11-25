/** EB02-054 Sanji. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, pick, play, PURPLE } from './helpers.ts';
import { ids, mk, V } from './helpers-aeb2g2.ts';

const ID = 'EB02-054';
const start = (life: string[], handCards: string[] = [BLUE, PURPLE]) => {
  const g = mk({ hand: [ID, ...handCards], life, deck: [V.c6, V.c7, V.c5] });
  play(g, ID);
  return g;
};

describe('EB02-054 Sanji', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] with 2 Life (boundary) draws 2 cards and trashes 1 card from the hand', () => {
    const g = start([BLUE, BLUE]);
    expectDecision(g, 'choose', 'p1');
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE, V.c6, V.c7].sort());
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, V.c6, V.c7].sort());
    expect(ids(g, 'p1', 'trash')).toEqual([PURPLE]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c5]);
  });

  it('the trashed card may be one of the cards just drawn', () => {
    const g = start([BLUE]);
    pick(g, [g.find('p1', 'hand', V.c7)]);
    expect(ids(g, 'p1', 'trash')).toEqual([V.c7]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('with 0 Life the condition (2 or less) holds as well', () => {
    const g = start([]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('must not fire with 3 Life: nothing is drawn or trashed and no choice is asked', () => {
    const g = start([BLUE, BLUE, BLUE]);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE]);
    expect(ids(g, 'p1', 'deck')).toEqual([V.c6, V.c7, V.c5]);
  });
});

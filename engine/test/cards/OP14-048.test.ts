/** OP14-048 Shiryu. */
import { describe, expect, it } from 'vitest';
import { BLUE, hand, none, pick, play, trash, V } from './helpers.ts';
import { cardsOf } from './helpers-luffyace.ts';
import { FM_LEADER, mine } from './helpers-op14g2.ts';

const ID = 'OP14-048';

const start = (oppChars: string[] = [V.c5, V.c2]) =>
  mine(
    FM_LEADER,
    { hand: [ID, BLUE, V.c1, V.c2], costArea: { active: 8, rested: 0 } },
    { characters: oppChars },
  );

describe('OP14-048 Shiryu', () => {
  it('[On Play]: returns an opposing Character to its owner’s hand, then trashes your whole hand', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(cardsOf(g, 'p2', 'hand')).toContain(V.c5);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([BLUE, V.c1, V.c2].sort());
  });

  it('"Then" is not "if you do": returning nothing (up to 1) still trashes your hand', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toHaveLength(2);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(3);
  });

  it('with no opposing Character the hand is still trashed; nothing is asked', () => {
    const g = start([]);
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(3);
  });

  it('only your own hand is trashed, not the opponent’s (including the returned card)', () => {
    const g = mine(
      FM_LEADER,
      { hand: [ID, V.c1], costArea: { active: 8, rested: 0 } },
      {
        hand: [BLUE, BLUE],
        characters: [V.c5],
      },
    );
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsOf(g, 'p2', 'hand').sort()).toEqual([BLUE, BLUE, V.c5].sort());
    expect(trash(g, 'p2')).toEqual([]);
  });
});

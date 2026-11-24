/** ST30-006 Jinbe. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  trash,
} from './helpers.ts';
import {
  ACE6,
  ATMOS,
  donArea,
  EVENT,
  offeredPicks,
  P5000,
  P7000,
  SLASH_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST30-006';

const start = (h: string[]) =>
  game(
    { leader: SLASH_LEADER, hand: [ID, ...h], deck: [BLUE, BLUE, BLUE, BLUE], ...donArea(5) },
    { leader: PLAIN_BLUE },
  );

describe('ST30-006 Jinbe', () => {
  it('[On Play]: you may trash 1 Character card with 6000 power from your hand: draw 2 cards', () => {
    const g = start([ATMOS, P5000]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ATMOS)]);
    expect(trash(g, 'p1')).toEqual([ATMOS]);
    expect(hand(g, 'p1')).toEqual([P5000, BLUE, BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('declining the cost trashes nothing and draws nothing', () => {
    const g = start([ATMOS]);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([ATMOS]);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('a 5000 Character, a 7000 Character and an Event are not 6000-power Characters: the cost cannot be paid', () => {
    const g = start([P5000, P7000, EVENT]);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(3);
  });

  it('the cost takes exactly 1 card: with two candidates only one is trashed and 2 are drawn', () => {
    const g = start([ATMOS, ACE6]);
    play(g, ID);
    accept(g);
    expect(offeredPicks(g)).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', ACE6)]);
    expect(trash(g, 'p1')).toEqual([ACE6]);
    expect(hand(g, 'p1')).toEqual([ATMOS, BLUE, BLUE]);
  });

  it('draws exactly 2 (not 1 or 3)', () => {
    const g = start([ATMOS]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ATMOS)]);
    expect(g.zone('p1', 'deck')).toHaveLength(2); // 4 cards, 2 drawn
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});

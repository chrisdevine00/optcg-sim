/** OP16-066 Sengoku. */
import { describe, expect, it } from 'vitest';
import {
  addMost,
  BLUE,
  don,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { NAVY_LEADER, NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-066';
const start = (leader: string) =>
  game(
    { leader, hand: [ID, PURPLE, V.c1], costArea: { active: 5, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-066 Sengoku', () => {
  it('with a {Navy} Leader: adds 2 rested DON!!, draws 2, trashes 2', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    addMost(g);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', V.c1)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7, deck: 3 });
    expect(hand(g, 'p1')).toEqual([BLUE, BLUE]);
    expect(trash(g, 'p1').sort()).toEqual([PURPLE, V.c1].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('with another Leader type nothing happens (no DON!!, no draw, no trash)', () => {
    const g = start(NOT_NAVY);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5, deck: 5 });
    expect(hand(g, 'p1')).toEqual([PURPLE, V.c1]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('the cards drawn can be trashed again (2 of the 4 in hand are chosen)', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    addMost(g);
    pick(g, [g.find('p1', 'hand', BLUE, 0), g.find('p1', 'hand', BLUE, 1)]);
    expect(hand(g, 'p1').sort()).toEqual([PURPLE, V.c1].sort());
    expect(trash(g, 'p1')).toEqual([BLUE, BLUE]);
  });
});

/** OP17-086 Nami. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
} from './helpers.ts';
import { ELBAPH } from './helpers-sabo.ts';

describe('OP17-086 Nami', () => {
  const setup = (handCards: string[]) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: ['OP17-086', ...handCards],
        deck: [PURPLE, PURPLE, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: trash 1 {Elbaph} card from your hand to draw 2 (only {Elbaph} cards can pay)', () => {
    const g = setup([BLUE, ELBAPH]);
    play(g, 'OP17-086');
    accept(g);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', ELBAPH)]);
    expect(trash(g, 'p1')).toEqual([ELBAPH]);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE, PURPLE].sort());
  });

  it('[On Play]: the cost may be declined; no draw', () => {
    const g = setup([ELBAPH]);
    play(g, 'OP17-086');
    decline(g);
    expect(hand(g, 'p1')).toEqual([ELBAPH]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('[On Play]: with no {Elbaph} card in hand the cost cannot be paid', () => {
    const g = setup([BLUE]);
    play(g, 'OP17-086');
    expectDecision(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });
});

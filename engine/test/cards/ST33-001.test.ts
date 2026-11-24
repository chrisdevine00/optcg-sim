/** ST33-001 Koby. */
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
  PURPLE,
  trash,
} from './helpers.ts';
import { canAccept, NAVY_LEADER } from './helpers-stg2.ts';

const ID = 'ST33-001';
const start = (handCards: string[]) =>
  game(
    {
      leader: NAVY_LEADER,
      hand: [ID, ...handCards],
      deck: [PURPLE, BLUE],
      costArea: { active: 2, rested: 0 },
    },
    { leader: 'ST03-001' },
  );

describe('ST33-001 Koby', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: NAVY_LEADER, characters: [ID] }, { leader: 'ST03-001' });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] trash 1 card from your hand: draw 1 card (the top card, exactly one)', () => {
    const g = start([BLUE]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(trash(g, 'p1')).toEqual([BLUE]);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
    expectDecision(g, 'main', 'p1');
  });

  it('the cost may be declined: nothing is trashed or drawn', () => {
    const g = start([BLUE]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('with no card left in hand the cost cannot be paid and nothing is drawn', () => {
    const g = start([]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(false);
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('the trashed card is the one chosen, not the drawn one', () => {
    const g = start([BLUE, PURPLE]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(trash(g, 'p1')).toEqual([PURPLE]);
    expect(hand(g, 'p1').sort()).toEqual([BLUE, PURPLE].sort());
  });
});

/** OP17-068 Sasaki. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
} from './helpers.ts';

const ID = 'OP17-068';
const attack = (leader: string, handCards: string[]) => {
  const g = game(
    { leader, characters: [ID], hand: handCards, costArea: { active: 1, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP17-068 Sasaki', () => {
  it('[When Attacking] trash 2 cards: with an {Animal Kingdom Pirates} Leader, adds 2 rested DON!!', () => {
    const g = attack(PLAIN_PURPLE, [BLUE, PURPLE, BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', BLUE, 0)]);
    addMost(g);
    expect(trash(g, 'p1')).toHaveLength(2);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 2, deck: 7 });
  });

  it('with another Leader type the cards are still trashed but no DON!! is added', () => {
    const g = attack(PLAIN_BLUE, [BLUE, PURPLE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', BLUE)]);
    expect(trash(g, 'p1')).toHaveLength(2);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0 });
  });

  it('with fewer than 2 cards in hand the cost cannot be paid: no DON!! added', () => {
    const g = attack(PLAIN_PURPLE, [BLUE]);
    // The optional cost is not offered (or cannot be accepted): nothing is trashed or added.
    if (g.legal().some((a) => a.type === 'optional' && a.accept)) {
      expectDecision(g, 'optional');
      decline(g);
    }
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(don(g, 'p1').rested).toBe(0);
  });

  it('declining the optional cost trashes nothing and adds nothing', () => {
    const g = attack(PLAIN_PURPLE, [BLUE, BLUE]);
    decline(g);
    expect(hand(g, 'p1')).toHaveLength(2);
    expect(don(g, 'p1').rested).toBe(0);
  });
});

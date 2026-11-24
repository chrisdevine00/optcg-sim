/** OP16-053 Roronoa Zoro (Blue, cost 7). */
import { describe, expect, it } from 'vitest';
import { BLUE, PURPLE, game, hand } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER } from './helpers-op16g2.ts';

const ID = 'OP16-053';

describe('OP16-053 Roronoa Zoro', () => {
  const start = (cards: number) =>
    game(
      {
        leader: IMPEL_LEADER,
        characters: [ID],
        hand: Array.from({ length: cards }, () => PURPLE),
        deck: Array(6).fill(BLUE),
      },
      { leader: BLUE_LEADER },
    );
  const attack = (g: ReturnType<typeof start>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it('[When Attacking] with 6 or less cards in hand: draws 1', () => {
    const g = start(6);
    attack(g);
    expect(hand(g, 'p1')).toHaveLength(7);
    expect(hand(g, 'p1').filter((c) => c === BLUE)).toHaveLength(1);
  });

  it('with 7 cards in hand it does not draw', () => {
    const g = start(7);
    attack(g);
    expect(hand(g, 'p1')).toHaveLength(7);
    expect(hand(g, 'p1')).not.toContain(BLUE);
  });

  it('with an empty hand it draws 1', () => {
    const g = start(0);
    attack(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('draws exactly 1', () => {
    const g = start(3);
    attack(g);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });
});

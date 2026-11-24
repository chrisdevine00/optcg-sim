/** OP13-045 Haruta. */
import { describe, expect, it } from 'vitest';
import { hand } from './helpers.ts';
import { mk, V } from './helpers-op13g2.ts';

const ID = 'OP13-045';

const attack = (handSize: number) => {
  const g = mk({ characters: [ID], hand: Array.from({ length: handSize }, () => V.c1) });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};

describe('OP13-045 Haruta', () => {
  it('[When Attacking]: with 4 cards in hand (boundary), draws 1', () => {
    const g = attack(4);
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it('must not draw with 5 cards in hand', () => {
    const g = attack(5);
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('draws with an empty hand, once', () => {
    const g = attack(0);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it("does not draw on the opponent's attack", () => {
    const g = mk(
      { characters: [ID], hand: [V.c1] },
      { characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});

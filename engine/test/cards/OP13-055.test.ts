/** OP13-055 Rakuyo. */
import { describe, expect, it } from 'vitest';
import { mk, V, WB4, WB_ALLY } from './helpers-op13g2.ts';

const ID = 'OP13-055';

const attack = (handSize: number) => {
  const g = mk({
    characters: [ID, WB4, V.c2, WB_ALLY],
    hand: Array.from({ length: handSize }, () => V.c1),
  });
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
  return g;
};
const power = (g: ReturnType<typeof attack>, card: string) =>
  g.power(g.find('p1', 'characters', card));

describe('OP13-055 Rakuyo', () => {
  it('[When Attacking]: with 4 cards in hand (boundary), every {Whitebeard Pirates} Character gains +1000 power', () => {
    const g = attack(4);
    expect(power(g, ID)).toBe(5000);
    expect(power(g, WB4)).toBe(7000);
    expect(power(g, WB_ALLY)).toBe(8000); // a type that only includes the text counts
  });

  it('must not boost a Character without the type', () => {
    const g = attack(4);
    expect(power(g, V.c2)).toBe(4000);
  });

  it('must not fire with 5 cards in hand', () => {
    const g = attack(5);
    expect(power(g, ID)).toBe(4000);
    expect(power(g, WB4)).toBe(6000);
  });

  it('boosts only your Characters, and only for this turn', () => {
    const g = attack(0);
    expect(power(g, WB4)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});

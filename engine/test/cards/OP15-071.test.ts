/** OP15-071 Holly. */
import { describe, expect, it } from 'vitest';
import { game, V } from './helpers.ts';
import { ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-071 Holly', () => {
  const board = (turn: number, activePlayer: 'p1' | 'p2') =>
    game(
      { leader: ENEL, characters: ['OP15-071', 'OP15-061', V.c3], donDeck: 6 },
      { leader: PLAIN_BLUE },
      { turn, activePlayer },
    );

  it('Holly and your [Ohm] cards gain [Double Attack]; other Characters do not', () => {
    const g = board(3, 'p1');
    const kw = (c: string) => g.card(g.find('p1', 'characters', c)).keywords;
    expect(kw('OP15-071')).toContain('Double Attack');
    expect(kw('OP15-061')).toContain('Double Attack');
    expect(kw(V.c3)).not.toContain('Double Attack');
  });

  it('on your own turn the base powers are the printed ones (Holly 4000, Ohm 2000)', () => {
    const g = board(3, 'p1');
    expect(g.power(g.find('p1', 'characters', 'OP15-071'))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', 'OP15-061'))).toBe(2000);
  });

  it("[Opponent's Turn]: Holly's and your [Ohm] cards' base power become 6000", () => {
    const g = board(4, 'p2');
    expect(g.power(g.find('p1', 'characters', 'OP15-071'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', 'OP15-061'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
  });

  it("a given DON!! adds nothing on the opponent's turn but the new base power is a base: a modifier stacks on 6000", () => {
    const g = game(
      { leader: ENEL, characters: [{ card: 'OP15-071', don: 1 }], donDeck: 5 },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p1', 'characters', 'OP15-071'))).toBe(6000);
  });

  it('Holly without an [Ohm] still has Double Attack on herself', () => {
    const g = game({ leader: ENEL, characters: ['OP15-071'], donDeck: 6 }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', 'OP15-071')).keywords).toContain('Double Attack');
  });
});

/** OP15-069 Nola. QA-OP15 OP15-069. */
import { describe, expect, it } from 'vitest';
import { accept, don, expectDecision, game, KAIDO, pick, play, ROCKS, V } from './helpers.ts';

describe('OP15-069 Nola', () => {
  const bounce = (target: string) => {
    // p2 (Rocks) returns one of p1's Characters to hand with OP17-056 (an opponent's effect).
    const g = game(
      { leader: KAIDO, characters: ['OP15-069', V.c5, V.c6], costArea: { active: 1, rested: 0 } },
      { leader: ROCKS, hand: ['OP17-056'], costArea: { active: 5, rested: 0 } },
      { turn: 4, activePlayer: 'p2' },
    );
    play(g, 'OP17-056');
    accept(g); // the "you may" activation cost (CR 8-3-1-4)
    pick(g, [g.find('p1', 'characters', target)]);
    return g;
  };

  it('a 7000-or-less base power Character can stay by returning 1 DON!!', () => {
    const g = bounce(V.c5);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c5);
    expect(don(g, 'p1')).toMatchObject({ active: 0, deck: 10 });
  });

  it('an 8000 base power Character is not protected', () => {
    const g = bounce(V.c6);
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([V.c6]);
  });

  it('QA: it protects Nola itself', () => {
    const g = bounce('OP15-069');
    accept(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain('OP15-069');
  });
});

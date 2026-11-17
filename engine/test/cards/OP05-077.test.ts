/** OP05-077 Gamma Knife. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, game, KAIDO, payDon, pick, play, V } from './helpers.ts';
import { damageWithP2, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP05-077 Gamma Knife', () => {
  const start = () =>
    game(
      { leader: KAIDO, hand: ['OP05-077'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7, V.c3] },
    );

  it("[Main] DON!! -1: gives up to 1 of the opponent's Characters -5000 power during this turn", () => {
    const g = start();
    play(g, 'OP05-077');
    accept(g);
    payDon(g);
    const c7 = g.find('p2', 'characters', V.c7);
    pick(g, [c7]);
    expect(g.power(c7)).toBe(9000 - 5000);
    expect(don(g, 'p1').deck).toBe(8); // 7 + the 1 returned
  });

  it('the DON!! -1 may be declined: no power change and no DON!! returned', () => {
    const g = start();
    play(g, 'OP05-077');
    decline(g);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    expect(don(g, 'p1').deck).toBe(7);
  });

  it('with no opposing Character the effect resolves with no target', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP05-077'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP05-077');
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('[Trigger]: adds up to 1 DON!! card from the DON!! deck and sets it as active', () => {
    const g = damageWithP2('OP05-077', { donDeck: 10 });
    g.act({ type: 'trigger', activate: true });
    expect(don(g, 'p1')).toMatchObject({ deck: 9, active: 1, rested: 0 });
  });
});

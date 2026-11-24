/** EB05-034 Sugar. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';

const SUGAR = 'EB05-034';
const start = (active: number) =>
  game(
    { leader: PLAIN_BLUE, hand: [SUGAR], costArea: { active, rested: 0 }, donDeck: 10 - active },
    { leader: PLAIN_BLUE, characters: [V.c7, V.c1] },
  );

describe('EB05-034 Sugar', () => {
  it('[On Play] DON!! −2, then with 7 or more DON!! left on the field, an opposing Character gets −4000 power', () => {
    const g = start(9); // 9 on the field, Sugar rests 2, DON!! −2 leaves 7
    play(g, SUGAR);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(3);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(5000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('with only 6 DON!! left after paying the cost the DON!! is still returned but nobody loses power', () => {
    const g = start(8);
    play(g, SUGAR);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(4);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('declining the DON!! −2 does nothing (no DON!! returned, no power change)', () => {
    const g = start(9);
    play(g, SUGAR);
    decline(g);
    expect(don(g, 'p1').deck).toBe(1);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('the −4000 lasts only this turn', () => {
    const g = start(9);
    play(g, SUGAR);
    accept(g);
    payDon(g);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    g.act({ type: 'endTurn' });
    // p2's turn: no lingering modifier on its own Character after the turn passed
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });
});

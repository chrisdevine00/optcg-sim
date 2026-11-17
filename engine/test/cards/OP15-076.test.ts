/** OP15-076 Lightning Beast Kiten. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  hand,
  payDon,
  pick,
  play,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { counterStep, ENEL, PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP15-076 Lightning Beast Kiten', () => {
  const start = (leader: string) =>
    game(
      {
        leader,
        hand: ['OP15-076'],
        costArea: { active: 2, rested: 0 },
        donDeck: leader === ENEL ? 4 : 8,
      },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );

  it("[Main] DON!! -1: with an [Enel] Leader draws 1, then gives up to 1 of the opponent's Characters -1000 power", () => {
    const g = start(ENEL);
    play(g, 'OP15-076');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    const c3 = g.find('p2', 'characters', V.c3);
    pick(g, [c3]);
    expect(g.power(c3)).toBe(4000);
  });

  it('may be declined: nothing happens and no DON!! is returned', () => {
    const g = start(ENEL);
    play(g, 'OP15-076');
    decline(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('without an [Enel] Leader there is no draw and no power change', () => {
    const g = start(PLAIN_PURPLE);
    play(g, 'OP15-076');
    accept(g);
    payDon(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expectDecision(g, 'main', 'p1');
  });

  it('[Counter]: up to 1 of your [Enel] cards gains +2000 power during this battle', () => {
    const g = counterStep({ leader: ENEL, hand: ['OP15-076'], characters: [V.c3], donDeck: 6 });
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP15-076'), ability: 'counter' });
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });
});

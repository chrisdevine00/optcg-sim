/** OP17-067 Kurozumi Kanjuro. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  none,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { COST10 } from './helpers-op17g3.ts';

const ID = 'OP17-067';
const start = (mine: string[]) =>
  game(
    { leader: PLAIN_PURPLE, hand: [ID], characters: mine, costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c3] },
  );

describe('OP17-067 Kurozumi Kanjuro', () => {
  it('[On Play] DON!! −1: with a Character of cost 10 or more, rests up to 1 opposing Character', () => {
    const g = start([COST10]);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it('the DON!! is returned but nothing is rested without a Character of cost 10 or more', () => {
    const g = start([V.c7]);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('Kanjuro himself (cost 2) does not satisfy the condition', () => {
    const g = start([]);
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start([COST10]);
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('declining the DON!! −1 means nothing happens', () => {
    const g = start([COST10]);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });
});

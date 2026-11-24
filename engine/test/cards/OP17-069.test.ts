/** OP17-069 Jack. */
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

const ID = 'OP17-069';
const start = (leader: string) =>
  game(
    { leader, hand: [ID], costArea: { active: 10, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7] },
  );

describe('OP17-069 Jack', () => {
  it('has [Rush: Character]', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush: Character');
  });

  it('[On Play] DON!! −1: with an {Animal Kingdom Pirates} Leader, gives up to 1 Character −2000 power this turn', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(1);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(7000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('with another Leader type the DON!! is returned but there is no −2000', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(1);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('declining the DON!! −1 means nothing happens', () => {
    const g = start(PLAIN_PURPLE);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').deck).toBe(0);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });
});

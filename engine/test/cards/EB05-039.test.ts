/** EB05-039 Pink Hornet. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  expectDecision,
  game,
  passBlock,
  payDon,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { DONQ_LEADER, VINSMOKE_LEADER } from './helpers-eb05g2.ts';

const HORNET = 'EB05-039';
const start = (leader: string) =>
  game(
    { leader, hand: [HORNET], costArea: { active: 3, rested: 0 } },
    { leader: PLAIN_BLUE, characters: [V.c7] },
  );

describe('EB05-039 Pink Hornet', () => {
  it('[Main] DON!! −1 with a {The Vinsmoke Family} Leader: an opposing Character gets −4000 power this turn', () => {
    const g = start(VINSMOKE_LEADER);
    play(g, HORNET);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(5000);
  });

  it('without a {The Vinsmoke Family} Leader the DON!! is returned but there is no −4000', () => {
    const g = start(DONQ_LEADER);
    play(g, HORNET);
    accept(g);
    payDon(g);
    expect(don(g, 'p1').deck).toBe(8);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('declining the DON!! −1 means nothing happens', () => {
    const g = start(VINSMOKE_LEADER);
    play(g, HORNET);
    decline(g);
    expect(don(g, 'p1').deck).toBe(7);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('[Counter] DON!! −1: your Leader gains +4000 power during this battle', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [HORNET], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    const base = g.power(g.leader('p1'))!;
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', HORNET), ability: 'counter' });
    accept(g);
    payDon(g);
    expect(g.power(g.leader('p1'))).toBe(base + 4000);
    expect(don(g, 'p1').deck).toBe(9);
    expectDecision(g, 'counter');
  });
});

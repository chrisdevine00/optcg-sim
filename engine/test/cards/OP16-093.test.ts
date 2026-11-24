/** OP16-093 Bartholomew Kuma. */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';

const ID = 'OP16-093';

const start = (h: string[], rested = 1) =>
  game(
    {
      leader: PLAIN_BLUE,
      hand: [ID, ...h],
      deck: [V.c1, V.c2, V.c3],
      costArea: { active: 3, rested },
    },
    { leader: PLAIN_BLUE },
  );

describe('OP16-093 Bartholomew Kuma', () => {
  it('[On Play] draws 2, trashes 2 from hand, then gives up to 1 rested DON!! to the Leader', () => {
    const g = start([V.c5]);
    play(g, ID);
    // Hand: V.c5, V.c1, V.c2: trash exactly 2.
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c5), g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toHaveLength(2);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    // The DON!! target: Leader or the Character (Kuma herself).
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('the rested DON!! can go to one of your Characters instead', () => {
    const g = start([V.c5]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c5), g.find('p1', 'hand', V.c1)]);
    const kuma = g.find('p1', 'characters', ID);
    pick(g, [kuma]);
    expect(g.card(kuma).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(3); // 1 + 3 paid for Kuma = 4 rested, one of them was given
  });

  it('"up to 1": the DON!! may be left in the cost area; draw and trash still happened', () => {
    const g = start([V.c5], 0);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c5), g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expectDecision(g, 'main', 'p1');
  });

  it('only a rested DON!! is given: active DON!! stay in the cost area', () => {
    const g = start([V.c5]);
    play(g, ID);
    const before = don(g, 'p1');
    pick(g, [g.find('p1', 'hand', V.c5), g.find('p1', 'hand', V.c1)]);
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1').active).toBe(before.active);
  });
});

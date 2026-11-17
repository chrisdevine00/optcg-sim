/** OP08-115 The Earth Will Not Lose!: [Counter] +3000 and play [Upper Yard]; [Trigger] draw 2, trash 1. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { counterStep, damageWith, ids, UPPER_YARD } from './helpers-kalgara.ts';

const EARTH = 'OP08-115';

const run = (g: ReturnType<typeof counterStep>) =>
  g.act({ type: 'activate', card: g.find('p1', 'hand', EARTH), ability: 'counter' });

describe('OP08-115 The Earth Will Not Lose!', () => {
  it('[Counter] +3000 power during this battle, then plays [Upper Yard] from hand', () => {
    const g = counterStep({
      hand: [EARTH, UPPER_YARD],
      deck: [BLUE, BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 2, rested: 0 },
    });
    run(g);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'hand', UPPER_YARD)]);
    // The Stage's own [On Play] (look at 5, nothing to take) asks to take up to 1: take none.
    none(g);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([UPPER_YARD]);
    expect(hand(g, 'p1')).not.toContain(UPPER_YARD);
  });

  it('"up to 1": may play no [Upper Yard]', () => {
    const g = counterStep({
      hand: [EARTH, UPPER_YARD],
      costArea: { active: 2, rested: 0 },
    });
    run(g);
    pick(g, [g.leader('p1')]);
    none(g);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([UPPER_YARD]);
  });

  it('the +3000 can go to a Character', () => {
    const g = counterStep({
      hand: [EARTH],
      characters: [V.c1],
      costArea: { active: 2, rested: 0 },
    });
    run(g);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(6000);
  });

  it('M4b-06: without a {Shandian Warrior} Leader the "If" fails: no +3000 and, as "Then" is gated, no [Upper Yard] either (QA-OP14 OP14-111, QA-OP15 OP15-116)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [EARTH, UPPER_YARD], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'activate', card: g.find('p1', 'hand', EARTH), ability: 'counter' });
    expectDecision(g, 'counter', 'p1'); // nothing asked: neither step resolves
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(UPPER_YARD);
  });

  it('[Trigger] draws 2 cards and trashes 1 card from your hand', () => {
    const g = damageWith(EARTH, { deck: [V.c1, V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
    expect(ids(g.zone('p1', 'trash')).sort()).toEqual([EARTH, V.c1].sort());
  });
});

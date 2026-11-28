/** OP18-063 Kiwi & Mozu. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  don,
  expectDecision,
  option,
  pick,
  play,
  trash,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { mine, STAGE2, STAGE5, STAGE6 } from './helpers-op18-g3.ts';

const ID = 'OP18-063';
const start = (stage?: string, active = 5) =>
  mine({ hand: [ID], ...(stage ? { stage } : {}), costArea: { active, rested: 0 } }, {});
const canPay = (g: ReturnType<typeof start>) =>
  g.legal().some((a) => a.type === 'optional' && a.accept);

describe('OP18-063 Kiwi & Mozu', () => {
  it('[On Play] K.O. 1 of your Stages with a cost of 5 or less: add up to 1 DON!! as rested', () => {
    const g = start(STAGE5);
    play(g, ID);
    accept(g);
    if (candidates(g).length) pick(g, [g.find('p1', 'stage', STAGE5)]);
    addMost(g);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([STAGE5]);
    expect(don(g, 'p1').rested).toBe(3 + 1); // 3 for the play, 1 added rested
    expect(don(g, 'p1').deck).toBe(4);
  });

  it('a Stage with a cost of 6 cannot pay the cost: not offered, nothing happens', () => {
    const g = start(STAGE6);
    play(g, ID);
    expect(canPay(g)).toBe(false);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([STAGE6]);
    expect(don(g, 'p1').deck).toBe(5);
  });

  it('without a Stage the cost cannot be paid', () => {
    const g = start();
    play(g, ID);
    expect(canPay(g)).toBe(false);
  });

  it('may be declined: the Stage stays and no DON!! is added', () => {
    const g = start(STAGE2);
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([STAGE2]);
    expect(don(g, 'p1').deck).toBe(5);
  });

  it('"up to 1": may add no DON!! after the Stage was K.O.\'d', () => {
    const g = start(STAGE2);
    play(g, ID);
    accept(g);
    if (candidates(g).length) pick(g, [g.find('p1', 'stage', STAGE2)]);
    const d = expectDecision(g, 'choose');
    option(g, d.options!.at(-1)!.id);
    expect(g.zone('p1', 'stage')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(5);
  });
});

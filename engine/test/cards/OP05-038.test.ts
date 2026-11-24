/** OP05-038 Charlestone. Scripted from the card text; the [Counter] "Then, you may trash ... If you do". */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  hand,
  option,
  pick,
  setMost,
  trash,
  V,
} from './helpers.ts';
import { counterStep, damageWithP2, RGL } from './helpers-rgl-penel.ts';

const counter = (handCards: string[]) => {
  const g = counterStep({
    leader: RGL,
    hand: ['OP05-038', ...handCards],
    costArea: { active: 2, rested: 3 },
  });
  g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP05-038'), ability: 'counter' });
  pick(g, [g.leader('p1')]);
  return g;
};

describe('OP05-038 Charlestone', () => {
  it('[Counter]: +4000 power during this battle; trashing a card sets up to 3 DON!! active', () => {
    const g = counter([BLUE]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    setMost(g);
    expect(trash(g, 'p1')).toContain(BLUE);
    expect(don(g, 'p1').active).toBe(3);
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('"up to 3": a count is asked, 2 sets two (OP14-R2)', () => {
    const g = counter([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3 });
  });

  it('declining the trash gives the power only: no DON!! is set active ("If you do")', () => {
    const g = counter([BLUE]);
    decline(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(don(g, 'p1').active).toBe(0);
  });

  it('with an empty hand nothing can be trashed, so no DON!! is set active, and the +4000 still applies (CR 4-10-2)', () => {
    const g = counter([]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(don(g, 'p1').active).toBe(0);
  });

  it("[Trigger]: rests up to 1 of the opponent's Leader or Character with a cost of 3 or less", () => {
    const g = damageWithP2('OP05-038', {}, [V.c7, V.c3, V.c4]);
    g.act({ type: 'trigger', activate: true });
    const offered = g.legal().filter((a) => a.type === 'pick');
    // The cost-3 Character only (the 7- and 4-cost ones are too expensive; the Leader has no cost).
    expect(offered).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('[Trigger] with no legal target does nothing', () => {
    const g = damageWithP2('OP05-038', {}, [V.c7]);
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'hand').map((c) => c.card)).not.toContain('OP05-038');
  });
});

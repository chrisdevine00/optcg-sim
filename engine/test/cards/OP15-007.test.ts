/** OP15-007 Gin. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, play } from './helpers.ts';
import { EB, EB_EVENT, EB_LEADER, mk, PLAIN3, RED_LEADER } from './helpers-op15g1.ts';

const ID = 'OP15-007';

describe('OP15-007 Gin', () => {
  const start = (leader: string) =>
    mk({ leader, hand: [ID, EB.c5, EB.c6, PLAIN3, EB_EVENT, EB.c1] });

  it('[On Play]: with an {East Blue} Leader, plays up to 1 Character with a cost of 5 or less from hand', () => {
    const g = start(EB_LEADER);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', EB.c5)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, EB.c5]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).not.toContain(EB.c5);
  });

  it('boundary: a cost-6 Character and an Event are not candidates; any type of cost 5 or less is', () => {
    const g = start(EB_LEADER);
    play(g, ID);
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(choices).toContain(g.find('p1', 'hand', PLAIN3));
    expect(choices).toContain(g.find('p1', 'hand', EB.c1));
    expect(choices).toContain(g.find('p1', 'hand', EB.c5));
    expect(choices).not.toContain(g.find('p1', 'hand', EB.c6));
    expect(choices).not.toContain(g.find('p1', 'hand', EB_EVENT));
  });

  it('the played Character is free (no DON!! spent beyond the 6 for Gin)', () => {
    const g = start(EB_LEADER);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', EB.c5)]);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').active).toBe(4);
  });

  it('"up to 1": may play nothing', () => {
    const g = start(EB_LEADER);
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('must not fire without an {East Blue} Leader', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});

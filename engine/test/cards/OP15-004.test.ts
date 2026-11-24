/** OP15-004 Sea Cat. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { mk, RED_LEADER, shrinkLeader } from './helpers-op15g1.ts';

const ID = 'OP15-004';

describe('OP15-004 Sea Cat', () => {
  const start = (shrink: number, don = 0) => {
    const g = mk(
      {
        leader: { card: RED_LEADER, don },
        hand: [ID],
        characters: [V.c2],
        costArea: { active: 10 - don, rested: 0 },
      },
      { characters: [V.c4, V.c1] },
    );
    if (shrink) shrinkLeader(g, 'p1', shrink);
    return g;
  };

  it('[On Play]: with a Leader at 0 power, up to 1 opposing Character gets -3000 this turn', () => {
    const g = start(5000);
    expect(g.power(g.leader('p1'))).toBe(0);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('only opposing Characters are candidates (not your own, not a Leader)', () => {
    const g = start(5000);
    play(g, ID);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2);
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : ''))).not.toContain(
      g.find('p1', 'characters', V.c2),
    );
  });

  it('boundary: a Leader at 1000 power does not fire, at 0 or below does', () => {
    const one = start(4000);
    expect(one.power(one.leader('p1'))).toBe(1000);
    play(one, ID);
    expectDecision(one, 'main', 'p1');
    expect(one.power(one.find('p2', 'characters', V.c4))).toBe(6000);

    const neg = start(6000);
    expect(neg.power(neg.leader('p1'))).toBe(-1000);
    play(neg, ID);
    expectDecision(neg, 'choose', 'p1');
  });

  it('reads current power: a DON!! given to the Leader counts (6000 - 6000 = 0)', () => {
    const g = start(6000, 1);
    expect(g.power(g.leader('p1'))).toBe(0);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const h = start(5000, 1);
    expect(h.power(h.leader('p1'))).toBe(1000);
    play(h, ID);
    expectDecision(h, 'main', 'p1');
  });

  it('must not fire with an untouched Leader, and "up to 1" may target nothing', () => {
    const g = start(0);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(6000);
    const h = start(5000);
    play(h, ID);
    none(h);
    expect(h.power(h.find('p2', 'characters', V.c4))).toBe(6000);
  });
});

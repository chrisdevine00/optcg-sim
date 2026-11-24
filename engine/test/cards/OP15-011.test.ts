/** OP15-011 Pearl. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { expectDecision, none, pick, V } from './helpers.ts';
import { EB_LEADER, mk, RED_LEADER } from './helpers-op15g1.ts';

const ID = 'OP15-011';

describe('OP15-011 Pearl', () => {
  const field = (leader: string, theirTurn: boolean) => {
    const g = mk(
      { leader, characters: [ID] },
      {},
      theirTurn ? { turn: 4, activePlayer: 'p2' } : {},
    );
    return { g, pearl: g.find('p1', 'characters', ID) };
  };

  it("[Opponent's Turn]: with an {East Blue} Leader it gains [Blocker] and +2000 power", () => {
    const { g, pearl } = field(EB_LEADER, true);
    expect(g.card(pearl).keywords).toContain('Blocker');
    expect(g.power(pearl)).toBe(6000);
  });

  it('must not apply on your own turn (4000, no [Blocker])', () => {
    const { g, pearl } = field(EB_LEADER, false);
    expect(g.card(pearl).keywords).not.toContain('Blocker');
    expect(g.power(pearl)).toBe(4000);
  });

  it("must not apply on the opponent's turn without an {East Blue} Leader", () => {
    const { g, pearl } = field(RED_LEADER, true);
    expect(g.card(pearl).keywords).not.toContain('Blocker');
    expect(g.power(pearl)).toBe(4000);
  });

  const koPearl = (leader: string) => {
    const g = mk(
      { leader, characters: [ID] },
      { characters: [V.c4, V.c5, V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    return g;
  };

  it('[On K.O.]: with an {East Blue} Leader, K.O.s up to 1 opposing Character with 6000 base power or less', () => {
    const g = koPearl(EB_LEADER);
    expectDecision(g, 'choose', 'p1');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2); // 7000 base is not a candidate
    pick(g, [g.find('p2', 'characters', V.c4)]);
    const left = g.zone('p2', 'characters').map((c) => c.card);
    expect(left).toEqual([V.c5, V.c3]);
  });

  it('[On K.O.]: boundary on BASE power (a 5000 Character with +2000 given is still a target) and "up to 1"', () => {
    const g = mk(
      { leader: EB_LEADER, characters: [ID] },
      { characters: [{ card: V.c3, don: 2 }, V.c5], costArea: { active: 8, rested: 0 } },
      { turn: 4, activePlayer: 'p2' },
    );
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(7000);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c5]);

    const h = koPearl(EB_LEADER);
    none(h);
    expect(h.zone('p2', 'characters')).toHaveLength(3);
  });

  it('[On K.O.]: must not fire without an {East Blue} Leader', () => {
    const g = koPearl(RED_LEADER);
    expectDecision(g, 'main', 'p2');
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });
});

/** ST21-001 Monkey.D.Luffy (Leader). */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { BLUE, dec, expectDecision, option, pick } from './helpers.ts';
import { ST21_LEADER, activateAb, canActivate, mk, offered } from './helpers-st1821.ts';

const ID = ST21_LEADER;

const start = (don = 1, rested = 3) =>
  mk({
    leader: { card: ID, don },
    characters: [BLUE, 'ST01-008'],
    costArea: { active: 3, rested },
  });

describe('ST21-001 Monkey.D.Luffy (Leader)', () => {
  it('[DON!! x1] [Activate: Main]: gives up to 2 rested DON!! (a count is asked) to 1 of your Characters', () => {
    const g = start();
    const leader = g.leader('p1');
    expect(canActivate(g, leader, 'activate')).toBe(true);
    activateAb(g, leader, 'activate');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.id)).toEqual(['2', '1', '0']);
    option(g, '2');
    // The Leader is not a candidate: only the Characters.
    expect(offered(g)).toHaveLength(2);
    expect(offered(g)).not.toContain(leader);
    pick(g, [g.find('p1', 'characters', BLUE)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 3 });
    expect(g.card(g.find('p1', 'characters', BLUE)).don).toBe(2);
  });

  it('"up to 2": 1 may be given (target asked next), 0 gives nothing', () => {
    const g = start();
    activateAb(g, g.leader('p1'), 'activate');
    option(g, '1');
    pick(g, [g.find('p1', 'characters', 'ST01-008')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 2, given: 2 });
    const h = start();
    activateAb(h, h.leader('p1'), 'activate');
    option(h, '0');
    expect(queries.don(h.state, 'p1')).toMatchObject({ rested: 3, given: 1 });
  });

  it('with only 1 rested DON!! no count is asked', () => {
    const g = start(1, 1);
    activateAb(g, g.leader('p1'), 'activate');
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options).toBeUndefined();
    pick(g, [g.find('p1', 'characters', BLUE)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 0, given: 2 });
  });

  it('boundary: with no DON!! given to the Leader the Activate is not offered', () => {
    const g = start(0);
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
  });

  it('[Once Per Turn]: not offered a second time', () => {
    const g = start();
    activateAb(g, g.leader('p1'), 'activate');
    option(g, '1');
    pick(g, [g.find('p1', 'characters', BLUE)]);
    expect(dec(g)?.kind).toBe('main');
    expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
  });
});

/** EB03-014 Kuina. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, option, pick } from './helpers.ts';
import { activate, mk, ODEN_L, offeredAb, STRIKE_L } from './helpers-eb03g1.ts';

const ID = 'EB03-014';
const start = (leader: string, rested: number, active = 2) =>
  mk({ leader, characters: [ID], costArea: { active, rested } });

describe('EB03-014 Kuina', () => {
  it('[Activate: Main] rests itself, then gives up to 2 rested DON!! to your <Slash> Leader', () => {
    const g = start(ODEN_L, 3);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['2', '1', '0']);
    addMost(g);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, active: 2 });
  });

  it('"up to 2": 1 or none can be chosen', () => {
    const g = start(ODEN_L, 3);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    option(g, '1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = start(ODEN_L, 3);
    activate(h, h.find('p1', 'characters', ID), 'give-don');
    option(h, '0');
    expect(h.card(h.leader('p1')).don).toBe(0);
    expect(don(h, 'p1')).toMatchObject({ rested: 3 });
  });

  it('only 1 rested DON!!: no count is asked, the Leader is the only target (up to 1)', () => {
    const g = start(ODEN_L, 1);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('must not give to a Leader without the <Slash> attribute (the cost is still paid)', () => {
    const g = start(STRIKE_L, 3);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('never gives to a Character, and is not offered when Kuina is rested', () => {
    const g = mk({
      leader: ODEN_L,
      characters: [{ card: ID, rested: true }],
      costArea: { active: 2, rested: 2 },
    });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });
});

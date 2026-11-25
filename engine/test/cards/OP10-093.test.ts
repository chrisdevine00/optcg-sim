/** OP10-093 Saint Homing. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB4,
  canActivate,
  canPick,
  expectDecision,
  idsOf,
  mk,
  none,
  pick,
  trash,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-093';
const start = (p1: object = {}) => mk({ characters: [ID, BB4, V.c1], ...p1 });

describe('OP10-093 Saint Homing', () => {
  it("trash this Character: a black Character gets +3 cost until the end of your opponent's next turn", () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', BB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // purple
    pick(g, [g.find('p1', 'characters', BB4)]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([BB4, V.c1]);
    expect(g.card(g.find('p1', 'characters', BB4)).cost).toBe(7);
  });

  it("lasts through your opponent's next turn and ends with it", () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'characters', BB4)]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', BB4)).cost).toBe(7);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', BB4)).cost).toBe(4);
  });

  it('"up to 1": may choose nothing, this Character is still trashed', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', BB4)).cost).toBe(4);
  });

  it('only your own Characters are offered', () => {
    const g = start();
    const g2 = mk({ characters: [ID] }, { characters: [BB4] });
    activate(g2, g2.find('p1', 'characters', ID), 'activate');
    expect(canPick(g2, g2.find('p2', 'characters', BB4))).toBe(false);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });

  it('with no black Character the cost is paid and nothing else happens', () => {
    const g = mk({ characters: [ID, V.c1] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', V.c1)).cost).toBe(1);
  });
});

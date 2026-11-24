/** OP14-046 Koala. */
import { describe, expect, it } from 'vitest';
import { pick, V } from './helpers.ts';
import {
  activate,
  canPick,
  FM3,
  FM_LEADER,
  mine,
  MER3,
  OTHER_LEADER,
  names,
} from './helpers-op14g2.ts';

const ID = 'OP14-046';

const start = (leader = FM_LEADER) => mine(leader, { characters: [ID, FM3, MER3, V.c2] });

describe('OP14-046 Koala', () => {
  it('[Activate: Main] trash this Character: a {Fish-Man} Character gains +2000 this turn', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'boost');
    expect(names(g, 'p1', 'trash')).toEqual([ID]); // the cost
    pick(g, [g.find('p1', 'characters', FM3)]);
    expect(g.power(g.find('p1', 'characters', FM3))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', MER3))).toBe(5000);
  });

  it('a {Merfolk} Character or a {Fish-Man} Leader may be the target; other Characters may not', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'boost');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', MER3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('the boost lasts until the end of the turn only', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'boost');
    pick(g, [g.find('p1', 'characters', FM3)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', FM3))).toBe(5000);
  });

  it('with no {Fish-Man} or {Merfolk} Leader or Character left, the cost is still paid and nothing is boosted', () => {
    const g = mine(OTHER_LEADER, { characters: [ID, V.c2] });
    activate(g, g.find('p1', 'characters', ID), 'boost');
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
  });
});

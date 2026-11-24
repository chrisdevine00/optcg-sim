/** OP12-063 Vinsmoke Reiju. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { EVENT, EVENT2, mine, rep } from './helpers-op12g2.ts';

const ID = 'OP12-063';

describe('OP12-063 Vinsmoke Reiju', () => {
  const view = (trash: string[]) => {
    const g = mine({ characters: [ID], trash });
    return g.card(g.find('p1', 'characters', ID));
  };

  it('with 4 Events in your trash she gains +2000 power and +5 cost (5000 -> 7000, 4 -> 9)', () => {
    const c = view([EVENT, EVENT2, EVENT, EVENT2]);
    expect(c.power).toBe(7000);
    expect(c.cost).toBe(9);
  });

  it('boundary: 3 Events give nothing, even beside many other cards', () => {
    const c = view([EVENT, EVENT2, EVENT, ...rep(6, V.c1)]);
    expect(c.power).toBe(5000);
    expect(c.cost).toBe(4);
  });

  it('more than 4 Events change nothing further', () => {
    const c = view(rep(7, EVENT));
    expect(c.power).toBe(7000);
    expect(c.cost).toBe(9);
  });

  it('always has [Blocker] (printed), with or without the Events', () => {
    expect(view([]).keywords).toContain('Blocker');
    expect(view(rep(4, EVENT)).keywords).toContain('Blocker');
  });
});

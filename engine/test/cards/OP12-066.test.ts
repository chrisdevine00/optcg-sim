/** OP12-066 Carne. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { EVENT, EVENT2, mine, rep } from './helpers-op12g2.ts';

const ID = 'OP12-066';

describe('OP12-066 Carne', () => {
  const view = (trash: string[]) => {
    const g = mine({ characters: [ID], trash });
    return g.card(g.find('p1', 'characters', ID));
  };

  it('with 4 or more Events in your trash he gains [Blocker]', () => {
    expect(view([EVENT, EVENT2, EVENT, EVENT2]).keywords).toContain('Blocker');
    expect(view(rep(6, EVENT)).keywords).toContain('Blocker');
  });

  it('boundary: 3 Events do not, and other cards do not count', () => {
    expect(view(rep(3, EVENT)).keywords).not.toContain('Blocker');
    expect(view([EVENT, EVENT, EVENT, ...rep(5, V.c1)]).keywords).not.toContain('Blocker');
  });

  it('with no Events at all he has no [Blocker] and keeps his own 1000 power', () => {
    const c = view([]);
    expect(c.keywords).not.toContain('Blocker');
    expect(c.power).toBe(1000);
  });
});

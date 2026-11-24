/** OP12-012 Buggy. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, V } from './helpers.ts';
import { at, choices, mk, ROGER_A, ROGER_B } from './helpers-op12g1.ts';

const ID = 'OP12-012';

describe('OP12-012 Buggy', () => {
  const start = (chars: string[]) => mk({ hand: [ID], characters: chars });

  it('[On Play]: up to 1 other Character with a type including "Roger Pirates" gains [Blocker] until the end of the opponent\'s next End Phase', () => {
    const g = start([ROGER_A, V.c3]);
    play(g, ID);
    // The vanilla and Buggy itself are not offered.
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', ROGER_A)]);
    pick(g, [at(g, 'p1', 'characters', ROGER_A)]);
    const target = at(g, 'p1', 'characters', ROGER_A);
    expect(g.card(target).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    // Still there during the opponent's turn, gone once it ends.
    expect(g.card(target).keywords).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(g.card(target).keywords).not.toContain('Blocker');
  });

  it('"other than [Buggy]": another [Buggy] is not a target', () => {
    const g = start([ID, ROGER_B]);
    play(g, ID, 0);
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', ROGER_B)]);
  });

  it('with no eligible Character nothing is asked', () => {
    const g = start([V.c3]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('"up to 1": may be skipped', () => {
    const g = start([ROGER_A]);
    play(g, ID);
    none(g);
    expect(g.card(at(g, 'p1', 'characters', ROGER_A)).keywords).not.toContain('Blocker');
  });
});

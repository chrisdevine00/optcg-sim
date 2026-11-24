/** OP12-007 Shanks (cost 2). */
import { describe, expect, it } from 'vitest';
import { none, pick, play, V } from './helpers.ts';
import { at, choices, mk, ROGER_A, ROGER_B } from './helpers-op12g1.ts';

const ID = 'OP12-007';

describe('OP12-007 Shanks', () => {
  const start = (chars: string[]) => mk({ hand: [ID], characters: chars });

  it('[On Play]: up to 1 other Character with a type including "Roger Pirates" gains [Rush] (type is a substring: {Former Roger Pirates} counts)', () => {
    const g = start([ROGER_A, V.c3]);
    play(g, ID);
    // Only the Roger Pirates one is offered: not the vanilla, not the Shanks just played.
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', ROGER_A)]);
    pick(g, [at(g, 'p1', 'characters', ROGER_A)]);
    expect(g.card(at(g, 'p1', 'characters', ROGER_A)).keywords).toContain('Rush');
    expect(g.card(at(g, 'p1', 'characters', V.c3)).keywords).not.toContain('Rush');
  });

  it('"other than [Shanks]": another [Shanks] is not a target, even with the type', () => {
    const g = start([ID, ROGER_B]);
    play(g, ID, 0);
    expect(choices(g)).toEqual([at(g, 'p1', 'characters', ROGER_B)]);
  });

  it('with no eligible Character nothing is asked', () => {
    const g = start([V.c3]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('"up to 1": the target may be skipped', () => {
    const g = start([ROGER_A]);
    play(g, ID);
    none(g);
    expect(g.card(at(g, 'p1', 'characters', ROGER_A)).keywords).not.toContain('Rush');
  });

  it('[Rush] lasts this turn only', () => {
    const g = start([ROGER_A]);
    play(g, ID);
    pick(g, [at(g, 'p1', 'characters', ROGER_A)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(at(g, 'p1', 'characters', ROGER_A)).keywords).not.toContain('Rush');
  });

  it("the opponent's Roger Pirates Characters are not targets", () => {
    const g = mk({ hand: [ID] }, { characters: [ROGER_A] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});

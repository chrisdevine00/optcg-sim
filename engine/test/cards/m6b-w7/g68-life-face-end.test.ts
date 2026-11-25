/**
 * M6b wave 7, G68: `turnLifeFaceUp` / `turnLifeFaceDown` with an end, `{ n: 1, from: 'top' | 'bottom'
 * | 'topOrBottom' }` (ST36-005 Eustass "Captain" Kid, "turn 1 card from the top or bottom of your
 * Life cards face-down"). The card turned must be in the opposite face state (M6b-Q59); with
 * `topOrBottom` the player picks among the ends that can be paid (a public choice, no card read),
 * and is not asked when only one can be. Planted on vanilla cards; each test fails with the gap
 * reverted.
 */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import type { Cost } from '@optcg/cards';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, main, offered, run } from './../m6b-w1/probe.ts';

type L = string | { card: string; faceUp: boolean };
const UP = (card: string): L => ({ card, faceUp: true });

const mk = (cost: Cost, life: L[]) => {
  const g = game({ leader: PLAIN_PURPLE, characters: [BLUE], life }, { leader: PLAIN_BLUE });
  g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }], [cost])]);
  return g;
};
const faces = (g: ReturnType<typeof mk>) => g.zone('p1', 'life').map((c) => c.faceUp);
const down = (from: 'top' | 'bottom' | 'topOrBottom'): Cost => ({
  turnLifeFaceDown: { n: 1, from },
});
const up = (from: 'top' | 'bottom' | 'topOrBottom'): Cost => ({ turnLifeFaceUp: { n: 1, from } });

describe('G68 turn a Life card at an end face-up or face-down', () => {
  it('validates the shapes and refuses the nonsense', () => {
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        cost: [down('bottom')],
        effect: [],
      }),
    ).toEqual([]);
    const bad = (cost: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', cost: [cost], effect: [] });
    expect(bad({ turnLifeFaceDown: { n: 2, from: 'top' } })).not.toEqual([]);
    expect(bad({ turnLifeFaceUp: { n: 1, from: 'middle' } })).not.toEqual([]);
    expect(bad({ turnLifeFaceUp: { n: 1 } })).not.toEqual([]);
    expect(bad({ turnLifeFaceUp: { n: 1, from: 'top', extra: 1 } })).not.toEqual([]);
  });

  it('bottom: turns the bottom face-up card face-down, hidden from both players under a fresh handle', () => {
    const g = mk(down('bottom'), [UP(V.c2), V.c3, UP(V.c4)]);
    const before = project(g.state, 'p2').zones.p1.life[2]!;
    expect(before.card).toBe(V.c4);
    run(g);
    expect(faces(g)).toEqual([true, false, false]);
    for (const viewer of ['p1', 'p2'] as const) {
      const after = project(g.state, viewer).zones.p1.life[2]!;
      expect(after.card).toBeNull();
      expect(after.handle).not.toBe(before.handle);
    }
    expect(JSON.stringify(project(g.state, 'p2'))).not.toContain(V.c4);
    expect(g.eventsOfType('LifeTurnedFaceDown')[0]).toMatchObject({ player: 'p1', count: 1 });
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('bottom: the top card does not pay it (M6b-Q59: the bottom card must be face-up)', () => {
    expect(offered(mk(down('bottom'), [UP(V.c2), V.c3, V.c4]))).toBe(false);
    expect(offered(mk(down('top'), [V.c2, V.c3, UP(V.c4)]))).toBe(false);
    expect(offered(mk(down('top'), [UP(V.c2), V.c3, V.c4]))).toBe(true);
    expect(offered(mk(down('bottom'), []))).toBe(false);
  });

  it('topOrBottom, both ends face-up: the player chooses the end, the other end is untouched', () => {
    const g = mk(down('topOrBottom'), [UP(V.c2), V.c3, UP(V.c4)]);
    run(g);
    const d = dec(g)!;
    expect(d.kind).toBe('choose');
    expect(JSON.stringify(d)).toContain('top');
    g.act({ type: 'pick', choice: { option: 'bottom' } });
    expect(faces(g)).toEqual([true, false, false]);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('topOrBottom, one payable end: it is used without asking; none: not offered', () => {
    const g = mk(down('topOrBottom'), [V.c2, V.c3, UP(V.c4)]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(faces(g)).toEqual([false, false, false]);
    expect(offered(mk(down('topOrBottom'), [V.c2, UP(V.c3), V.c4]))).toBe(false);
  });

  it('a single Life card is one end: no choice is asked', () => {
    const g = mk(down('topOrBottom'), [UP(V.c2)]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(faces(g)).toEqual([false]);
  });

  it('face-up mirrors it: only a face-down end can be turned, and its card becomes public', () => {
    const g = mk(up('topOrBottom'), [UP(V.c2), V.c3, V.c4]);
    expect(project(g.state, 'p2').zones.p1.life[2]!.card).toBeNull();
    run(g);
    // The top is face-up already: only the bottom end is payable, so nothing is asked.
    expect(dec(g)?.kind).toBe('main');
    expect(faces(g)).toEqual([true, false, true]);
    expect(project(g.state, 'p2').zones.p1.life[2]!.card).toBe(V.c4);
    expect(offered(mk(up('topOrBottom'), [UP(V.c2), V.c3, UP(V.c4)]))).toBe(false);
    expect(offered(mk(up('top'), [UP(V.c2), V.c3, V.c4]))).toBe(false);
    expect(offered(mk(up('bottom'), [UP(V.c2), V.c3, V.c4]))).toBe(true);
  });
});

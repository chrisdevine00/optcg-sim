/** OP09-087 Charlotte Pudding. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, handIds, mk, pick, play, times, V } from './helpers-a09g3.ts';

const ID = 'OP09-087';
const oppHand = (n: number) => [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7].slice(0, n);
const start = (n: number) => mk({ hand: [ID] }, { hand: oppHand(n) }, undefined, 2);

describe('OP09-087 Charlotte Pudding', () => {
  it('[On Play] with 5 cards in their hand (boundary), the opponent chooses and trashes 1', () => {
    const g = start(5);
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p2');
    expect(d.max).toBe(1);
    pick(g, [g.find('p2', 'hand', V.c3)]);
    expect(handIds(g, 'p2')).toHaveLength(4);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c3]);
  });

  it('works with more than 5 cards', () => {
    const g = start(7);
    play(g, ID);
    pick(g, [g.find('p2', 'hand', V.c7)]);
    expect(handIds(g, 'p2')).toHaveLength(6);
  });

  it('must not fire with 4 cards in their hand', () => {
    const g = start(4);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(handIds(g, 'p2')).toHaveLength(4);
    expect(g.zone('p2', 'trash')).toHaveLength(0);
  });

  it('must not make the player trash from their own hand', () => {
    const g = mk({ hand: [ID, ...times(6, V.c1)] }, { hand: oppHand(5) }, undefined, 2);
    play(g, ID);
    pick(g, [g.find('p2', 'hand', V.c1)]);
    expect(handIds(g, 'p1')).toHaveLength(6);
  });
});

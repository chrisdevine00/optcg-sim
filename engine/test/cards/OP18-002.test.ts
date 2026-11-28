/** OP18-002 Igaram. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, hand, pick, play, trash } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { ALA2, ALA5, mk, V } from './helpers-op18-g1.ts';

const ID = 'OP18-002';

describe('OP18-002 Igaram', () => {
  it('[On Play] trashing an {Alabasta} card from the hand draws 2', () => {
    const g = mk({ hand: [ID, ALA2, V.c1] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', ALA2)]);
    expect(trash(g, 'p1')).toEqual([ALA2]);
    expect(hand(g, 'p1')).toHaveLength(3); // V.c1 + 2 drawn
    expect(hand(g, 'p1')).toContain(V.c1);
  });

  it('only {Alabasta} cards can be trashed for the cost', () => {
    const g = mk({ hand: [ID, ALA2, ALA5, V.c1] });
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', ALA2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ALA5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
  });

  it('declining the cost trashes and draws nothing', () => {
    const g = mk({ hand: [ID, ALA2] });
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([ALA2]);
  });

  it('with no {Alabasta} card in hand the cost cannot be paid: nothing is trashed or drawn', () => {
    const g = mk({ hand: [ID, V.c1] });
    play(g, ID);
    // The prompt is not gated on the hidden hand (runbook d.4), but accepting is not legal.
    expect(dec(g)?.kind).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });
});

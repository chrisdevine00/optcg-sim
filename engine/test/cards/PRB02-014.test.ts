/** PRB02-014 Sabo. */
import { describe, expect, it } from 'vitest';
import { play, times, V } from './helpers.ts';
import { mk } from './helpers-prbst.ts';

const ID = 'PRB02-014';

describe('PRB02-014 Sabo', () => {
  const start = (trashCount: number, costArea = { active: 3, rested: 0 }) =>
    mk({ hand: [ID], trash: times(trashCount, V.c1), costArea });
  const cost = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'hand', ID)).cost;
  const playable = (g: ReturnType<typeof start>) =>
    g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' });

  it('in hand: with 15 cards in the trash it costs 3 less (boundary) and can be played with 3 DON!!', () => {
    const g = start(15);
    expect(cost(g)).toBe(3);
    expect(playable(g)).toBe(true);
    play(g, ID);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('must not fire: with 14 cards in the trash it costs the printed 6 and 3 DON!! is not enough', () => {
    const g = start(14);
    expect(cost(g)).toBe(6);
    expect(playable(g)).toBe(false);
  });

  it('with 20 cards the reduction is still 3 (not cumulative)', () => {
    const g = start(20);
    expect(cost(g)).toBe(3);
  });

  it('has [Blocker] (printed) on the field, at its printed cost', () => {
    const g = mk({ characters: [ID], trash: times(15, V.c1) });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    // The reduction applies "in your hand" only.
    expect(c.cost).toBe(6);
  });

  it('the reduction ends when the trash drops below 15 (a different count recomputes)', () => {
    const g = start(15, { active: 6, rested: 0 });
    expect(cost(g)).toBe(3);
    const h = start(14, { active: 6, rested: 0 });
    expect(cost(h)).toBe(6);
    expect(playable(h)).toBe(true);
  });
});

/** ST18-002 O-Nami. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { mk } from './helpers-st1821.ts';

const ID = 'ST18-002';

/** p1 holds O-Nami (cost 4), `V.c1` and `V.c2`, with `active` DON!! in the cost area. */
const start = (active: number, handCards: string[] = [ID, V.c1, V.c2]) =>
  mk({ hand: handCards, costArea: { active, rested: 0 }, deck: [V.c3, V.c4, V.c5, BLUE] });

describe('ST18-002 O-Nami', () => {
  it('has [Blocker]', () => {
    const g = start(8);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] with 8 DON!!: trashes 1 card from hand (chosen), then draws 2', () => {
    const g = start(8);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c3, V.c4]);
  });

  it('boundary: 7 DON!! does nothing (no trash, no draw)', () => {
    const g = start(7);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('with an empty hand the trash is skipped and the 2 cards are still drawn', () => {
    const g = start(8, [ID]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([V.c3, V.c4]);
  });

  it('the trash is mandatory: it cannot be declined with a card in hand', () => {
    const g = start(8);
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.min).toBe(1);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });
});

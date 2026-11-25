/** OP09-048 Dracule Mihawk. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { mk } from './helpers-a09g2.ts';

const ID = 'OP09-048';

describe('OP09-048 Dracule Mihawk', () => {
  it('has [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: draws 2 cards, then trashes 1 card from hand', () => {
    const g = mk({ hand: [ID, V.c1], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2, V.c3]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c2, V.c3]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('a just-drawn card may be the one trashed', () => {
    const g = mk({ hand: [ID], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(trash(g, 'p1')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('exactly 1 card is trashed (not "up to"): no more, no fewer', () => {
    const g = mk({ hand: [ID, V.c1], deck: [V.c2, V.c3, V.c4] });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)])).toThrow(
      /can be picked now/,
    );
    expect(g.isLegal({ type: 'done', player: 'p1' })).toBe(false);
  });

  it('is not played from the hand by anyone else: with no [On Play] trigger nothing is drawn', () => {
    const g = mk({ characters: [ID], hand: [V.c1], deck: [V.c2, V.c3, V.c4] });
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(dec(g)?.kind).toBe('main');
  });
});

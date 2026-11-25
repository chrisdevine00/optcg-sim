/** OP09-034 Perona. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { canPick, MIHAWK, mk, settle, TB4, WB4 } from './helpers-a09g2.ts';

const ID = 'OP09-034';
const top5 = [V.c1, MIHAWK, TB4, WB4, V.c2];

describe('OP09-034 Perona', () => {
  it('[On Play]: adds a [Dracule Mihawk] to your hand, the other 4 go to the bottom, then trash 1', () => {
    const g = mk({ hand: [ID, V.c3], deck: [...top5, V.c4, V.c5] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', MIHAWK)]);
    expect(hand(g, 'p1')).toEqual([V.c3, MIHAWK]);
    settle(g);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(6);
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]);
    expect(deck.slice(2).sort()).toEqual([V.c1, TB4, WB4, V.c2].sort());
    expectDecision(g, 'choose', 'p1'); // the trash
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([MIHAWK]);
    expect(trash(g, 'p1')).toEqual([V.c3]);
  });

  it('only [Dracule Mihawk] and {Thriller Bark Pirates} cards are selectable', () => {
    const g = mk({ hand: [ID], deck: [...top5, V.c4] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', MIHAWK))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', TB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', WB4))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
  });

  it('"up to 1": two matching cards cannot both be taken', () => {
    const g = mk({ hand: [ID], deck: top5 });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'deck', MIHAWK), g.find('p1', 'deck', TB4)])).toThrow(
      /can be picked now/,
    );
  });

  it('taking nothing still trashes 1 card from your hand (not "if you do")', () => {
    const g = mk({ hand: [ID, V.c3], deck: [...top5, V.c4] });
    play(g, ID);
    none(g);
    settle(g);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(trash(g, 'p1')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the card just added may be the one trashed', () => {
    const g = mk({ hand: [ID], deck: [...top5, V.c4] });
    play(g, ID);
    pick(g, [g.find('p1', 'deck', TB4)]);
    settle(g);
    pick(g, [g.find('p1', 'hand', TB4)]);
    expect(trash(g, 'p1')).toEqual([TB4]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('looks only at the top 5: a Mihawk in 6th place is not offered, and an empty hand trashes nothing', () => {
    const g = mk({ hand: [ID], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, MIHAWK] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false); // asked at max 0: nothing to take
    none(g);
    settle(g);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([]);
  });
});

/** OP10-006 Caesar Clown. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, SMILEY, settle } from './helpers-a10g1.ts';

const ID = 'OP10-006';
const deck5 = [V.c1, SMILEY, V.c2, V.c3, V.c4];

describe('OP10-006 Caesar Clown', () => {
  it('[On Play]: reveals [Smiley] to your hand, the rest go to the bottom, then plays up to 1 [Smiley] from your hand', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c5, V.c6] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', SMILEY)]);
    expect(hand(g, 'p1')).toEqual([SMILEY]);
    settle(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', SMILEY)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, SMILEY]);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(6);
    expect(deck.slice(0, 2)).toEqual([V.c5, V.c6]);
  });

  it('only [Smiley] is selectable among the top 5', () => {
    const g = mk({ hand: [ID], deck: deck5 });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', SMILEY))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
  });

  it('with no [Smiley] in the top 5, a [Smiley] already in hand can still be played ("Then" is not conditional)', () => {
    const g = mk({ hand: [ID, SMILEY], deck: [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6] });
    play(g, ID);
    // The "up to 1" take is asked at max 0 (nothing to take, and the prompt does not depend on the
    // hand): answer it, then the play from hand is offered.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    settle(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', SMILEY)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, SMILEY]);
  });

  it('"up to 1": may add nothing and may play nothing', () => {
    const g = mk({ hand: [ID], deck: [...deck5, V.c5] });
    play(g, ID);
    none(g);
    settle(g);
    if (g.legal().some((a) => a.type === 'done')) none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('plays only [Smiley] from the hand: another card in hand is not a candidate', () => {
    const g = mk({ hand: [ID, SMILEY, V.c1], deck: deck5 });
    play(g, ID);
    none(g); // add nothing
    settle(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', SMILEY))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
  });
});

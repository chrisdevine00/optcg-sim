/** OP09-046 Crocodile. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { BW5, canPick, CG5, CG6, CGFBW5, FBW4, FBW5, ids, mk } from './helpers-a09g2.ts';

const ID = 'OP09-046';
const H = [ID, CG5, CG6, CGFBW5, BW5, FBW5, FBW4, V.c3];

describe('OP09-046 Crocodile', () => {
  it('[On Play]: plays a {Cross Guild} or "Baroque Works" Character with cost 5 or less from hand', () => {
    const g = mk({ hand: H });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', CG5))).toBe(true); // Cross Guild, cost 5 (boundary)
    expect(canPick(g, g.find('p1', 'hand', BW5))).toBe(true); // Baroque Works
    expect(canPick(g, g.find('p1', 'hand', FBW5))).toBe(true); // Former Baroque Works (includes)
    expect(canPick(g, g.find('p1', 'hand', FBW4))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', CGFBW5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', CG6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // neither type
    pick(g, [g.find('p1', 'hand', CG5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, CG5]);
    expect(g.card(g.find('p1', 'characters', CG5)).rested).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(6);
  });

  it('"up to 1": a second card cannot be played', () => {
    const g = mk({ hand: H });
    play(g, ID);
    expect(() => pick(g, [g.find('p1', 'hand', CG5), g.find('p1', 'hand', BW5)])).toThrow(
      /can be picked now/,
    );
    expect(ids(g, 'p1', 'characters')).toEqual([ID, CG5]);
  });

  it('"up to 1": may play nothing', () => {
    const g = mk({ hand: H });
    play(g, ID);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(7);
  });

  it('with no eligible card in hand it plays nothing', () => {
    const g = mk({ hand: [ID, CG6, V.c3] });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    if (dec(g)?.kind === 'choose') none(g);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });
});

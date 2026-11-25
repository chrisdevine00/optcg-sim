/** EB02-027 Vista. */
import { describe, expect, it } from 'vitest';
import {
  boost,
  C1,
  canPick,
  cardsOf,
  expectDecision,
  hand,
  mk,
  none,
  pick,
  V,
  ZERO,
} from './helpers-aeb2g1.ts';
import { play } from './helpers.ts';

const ID = 'EB02-027';
const start = (p2chars: string[]) =>
  mk(
    { hand: [ID], costArea: { active: 4, rested: 0 } },
    { characters: p2chars, deck: [V.c2, V.c3] },
  );

describe('EB02-027 Vista', () => {
  it("[On Play]: places an opposing Character with 1000 power or less at the bottom of its owner's deck", () => {
    const g = start([ZERO, V.c3]);
    boost(g, g.find('p2', 'characters', ZERO), 1000); // 0 + 1000 = 1000: boundary
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', ZERO))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // 5000
    pick(g, [g.find('p2', 'characters', ZERO)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(ZERO);
    expect(hand(g, 'p2')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('1001 power is not offered; power is the current power', () => {
    const g = start([ZERO]);
    boost(g, g.find('p2', 'characters', ZERO), 1001);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });

  it('a buff makes a higher base power qualify (current power, a lowered 3000 is 1000)', () => {
    const g = start([C1]);
    boost(g, g.find('p2', 'characters', C1), -2000);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', C1))).toBe(true);
    pick(g, [g.find('p2', 'characters', C1)]);
    expect(cardsOf(g, 'p2', 'deck').at(-1)).toBe(C1);
  });

  it('"up to 1": may be declined; only the opponent\'s Characters are offered, not their Leader', () => {
    const g = mk(
      { hand: [ID], characters: [ZERO], costArea: { active: 4, rested: 0 } },
      { characters: [ZERO] },
    );
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', ZERO))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([ZERO]);
  });
});

/** OP10-024 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, NAVY, rested } from './helpers-a10g1.ts';

const ID = 'OP10-024';
type Chars = NonNullable<PlayerSpec['characters']>;
const mine = (chars: Chars, p2chars: Chars) =>
  mk({ hand: [ID], characters: chars }, { characters: p2chars });
const two = [rested(V.c1), rested(NAVY.c1)];

describe('OP10-024 Edward.Newgate', () => {
  it('[On Play]: with 2 rested Characters, rests an opponent Character (cost 5 or less), then K.O.s a rested one (cost 3 or less)', () => {
    const g = mine(two, [V.c5, rested(V.c3)]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c3]);
  });

  it("the K.O. is chosen after the rest: a Character just rested (cost 3) can be K.O.'d", () => {
    const g = mine(two, [V.c3]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
  });

  it('boundaries: rest cost 5 yes / 6 no; K.O. rested cost 3 yes / 4 no', () => {
    const g = mine(two, [V.c5, V.c6, rested(V.c3), rested(V.c4)]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    none(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // active, and cost 5
  });

  it('"up to 1": the rest may be declined and the K.O. still happens', () => {
    const g = mine(two, [V.c5, rested(V.c3)]);
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('must not do either with only 1 rested Character (Edward himself is not rested)', () => {
    const g = mine([rested(V.c1)], [V.c5, rested(V.c3)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c3]);
  });

  it("the opponent's rested Characters and a rested Leader do not count toward the 2", () => {
    const g = mine([rested(V.c1)], [rested(V.c5), rested(V.c3)]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c3]);
  });
});

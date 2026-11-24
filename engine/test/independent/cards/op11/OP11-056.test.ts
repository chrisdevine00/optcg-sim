/**
 * OP11-056 Brook (Blue Character, cost 3, 4000, Counter +1000, {Straw Hat Crew}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Place up to 1 Character with a base cost of 1 at the bottom of the
 * owner's deck."
 *
 * Rules: "up to 1" may be none. Either player's Characters qualify (no "your" or "opponent's");
 * base cost is the printed cost, so cost 1 exactly. The card goes to the bottom of its OWNER's
 * deck. Brook herself (cost 3) is never a candidate.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  C11,
  chars,
  deck,
  kind,
  L11,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playCard,
  settleNoCandidates,
  theirs,
  trash,
} from './kit-op11b.ts';

const BROOK = 'OP11-056';

function play(p1chars: string[], p2chars: string[]) {
  const g = mine(L11.mono, { hand: [BROOK], characters: p1chars }, { characters: p2chars });
  playCard(g, BROOK);
  return g;
}

describe('OP11-056 Brook: [On Play] place up to 1 Character with base cost 1 at the bottom of the owner deck', () => {
  it('offers exactly the Characters of base cost 1, on both sides', () => {
    const g = play([C11.c1, C11.c2], [C11.shc1, C11.c3, C11.c4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c1, C11.shc1].sort());
  });

  it("an opponent's cost-1 Character goes to the bottom of the OPPONENT's deck", () => {
    const g = play([], [C11.shc1]);
    pickInst(g, [at(g, 'p2', 'characters', C11.shc1)]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(deck(g, 'p2')).toHaveLength(16);
    expect(deck(g, 'p2')[15]).toBe(C11.shc1);
    expect(deck(g, 'p1')).toHaveLength(15);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('my own cost-1 Character may be chosen and goes to the bottom of my deck', () => {
    const g = play([C11.c1], [C11.shc1]);
    pickInst(g, [at(g, 'p1', 'characters', C11.c1)]);
    expect(chars(g)).toEqual([BROOK]);
    expect(deck(g)).toHaveLength(16);
    expect(deck(g)[15]).toBe(C11.c1);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
  });

  it('"up to 1": may choose nothing; nothing moves', () => {
    const g = play([C11.c1], [C11.shc1]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g).sort()).toEqual([BROOK, C11.c1].sort());
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
  });

  it('only 1 is placed even when several qualify', () => {
    const g = play([C11.c1], [C11.shc1, C11.merfolk1]);
    pickInst(g, [at(g, 'p2', 'characters', C11.merfolk1)]);
    expect(chars(g, 'p2')).toEqual([C11.shc1]);
    expect(chars(g).sort()).toEqual([BROOK, C11.c1].sort());
    expect(kind(g)).toBe('main');
  });

  it('with no cost-1 Character on the field nothing happens and Brook stays', () => {
    const g = play([C11.c2], [C11.c3]);
    settleNoCandidates(g);
    expect(chars(g).sort()).toEqual([BROOK, C11.c2].sort());
    expect(chars(g, 'p2')).toEqual([C11.c3]);
  });

  it('Brook herself (cost 3) is not a candidate and a cost-2 Character is not either', () => {
    const g = play([C11.c2, C11.c1], []);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c1]);
  });

  it('has [Blocker] and blocks an attack on my Leader', () => {
    const g = theirs(L11.mono, { characters: [BROOK] }, { characters: [C11.c3] });
    expect(g.card(at(g, 'p1', 'characters', BROOK)).keywords).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', C11.c3), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BROOK)]);
    g.act({ type: 'block', blocker: at(g, 'p1', 'characters', BROOK) });
    expect(g.life('p1')).toBe(4);
  });

  it('a rested opposing cost-1 Character is a candidate too', () => {
    const g = mine(L11.mono, { hand: [BROOK] }, { characters: [{ card: C11.shc1, rested: true }] });
    playCard(g, BROOK);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.shc1]);
    pickInst(g, [at(g, 'p2', 'characters', C11.shc1)]);
    expect(deck(g, 'p2')[15]).toBe(C11.shc1);
  });
});

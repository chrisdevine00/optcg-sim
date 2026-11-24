/**
 * OP11-065 Charlotte Anana (Purple Character, cost 1, 1000, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "If you have a purple {Big Mom Pirates} type Character other than [Charlotte Anana], this
 * Character gains [Blocker]."
 *
 * Rules: continuous; the other Character must be purple (colour), of the {Big Mom Pirates} type, a
 * Character on my field, and not named [Charlotte Anana] (so a second Anana, and ST07-002 Charlotte
 * Anana, do not count). Rested Characters count. Re-evaluated at every moment (CR 8-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  C11,
  E11,
  kind,
  L11,
  mine,
  opponentKOs,
  theirs,
} from './kit-op11b.ts';

const ANANA = 'OP11-065';

function board(chars: (string | { card: string; rested?: boolean })[], p2chars: string[] = []) {
  return mine(L11.bmp, { characters: [ANANA, ...chars] }, { characters: p2chars });
}

function hasBlocker(g: ReturnType<typeof board>): boolean {
  return g.card(at(g, 'p1', 'characters', ANANA)).keywords.includes('Blocker');
}

describe('OP11-065 Charlotte Anana: with another purple {Big Mom Pirates} Character, gains [Blocker]', () => {
  it('gains [Blocker] with a purple {Big Mom Pirates} Character (Decuplets)', () => {
    expect(hasBlocker(board([C11.bmpP5]))).toBe(true);
  });

  it('has no [Blocker] when alone', () => {
    expect(hasBlocker(board([]))).toBe(false);
  });

  it('a yellow {Big Mom Pirates} Character does not count (colour)', () => {
    expect(hasBlocker(board([C11.bmpY2]))).toBe(false);
  });

  it('a purple Character of another type does not count', () => {
    expect(hasBlocker(board([C11.purple1]))).toBe(false);
  });

  it('a second [Charlotte Anana] (purple, {Big Mom Pirates}) does not count: neither gains [Blocker]', () => {
    const g = board([ANANA]);
    expect(g.card(at(g, 'p1', 'characters', ANANA, 0)).keywords).not.toContain('Blocker');
    expect(g.card(at(g, 'p1', 'characters', ANANA, 1)).keywords).not.toContain('Blocker');
  });

  it('the yellow ST07-002 Charlotte Anana (same name) does not count either', () => {
    expect(hasBlocker(board([C11.anana]))).toBe(false);
  });

  it('a purple {Big Mom Pirates} Character on the opponent field does not count', () => {
    expect(hasBlocker(board([], [C11.bmpP5]))).toBe(false);
  });

  it('a rested purple {Big Mom Pirates} Character counts', () => {
    expect(hasBlocker(board([{ card: C11.bmpP7, rested: true }]))).toBe(true);
  });

  it('the keyword is lost when the other Character leaves, and it can block while it has it', () => {
    const g = theirs(
      L11.bmp,
      { characters: [ANANA, C11.bmpP5] },
      { characters: [C11.c3], hand: [E11.lightning] },
    );
    const anana = at(g, 'p1', 'characters', ANANA);
    expect(g.card(anana).keywords).toContain('Blocker');
    opponentKOs(g, at(g, 'p1', 'characters', C11.bmpP5));
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ANANA]);
    expect(g.card(anana).keywords).not.toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', C11.c3), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([]);
  });
});

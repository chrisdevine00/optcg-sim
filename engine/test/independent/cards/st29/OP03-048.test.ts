/**
 * OP03-048 Nojiko (Character, Blue, cost 2, 0 power, Counter +1000, {East Blue}).
 *
 * Card text: "[On Play] If your Leader is [Nami], return up to 1 of your opponent's Characters with a
 * cost of 5 or less to the owner's hand."
 *
 * Rules: [On Play] (CR 10-2-2); the "If" looks at MY Leader's name (any card named Nami); "up to 1"
 * lets the player choose nothing; only opposing Characters of cost 5 or less qualify; the card goes
 * to its OWNER's hand.
 */
import { describe, expect, it } from 'vitest';
import {
  C29,
  hand,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
} from './kit-st29a.ts';

const ID = 'OP03-048';
const NAMI_P = 'P-117'; // P-117 Nami: Blue Leader, another card named [Nami]

/** p1's Main Phase with Nojiko in hand; the opponent has these Characters. */
function main(leader: string, p2chars: string[], mineChars: string[] = []) {
  return mine(leader, { hand: [ID], characters: mineChars }, { characters: p2chars });
}

describe('OP03-048 Nojiko [On Play]: with a [Nami] Leader, return up to 1 opposing Character with cost 5 or less', () => {
  it('printed values: cost 2, 0 power, Counter +1000', () => {
    const g = main(L29.nami, []);
    const n = inst(g, 'p1', 'hand', ID);
    expect(g.card(n).cost).toBe(2);
    expect(g.power(n)).toBe(0);
    expect(g.card(n).counter).toBe(1000);
  });

  it('with OP03-040 Nami as Leader it offers exactly the opposing Characters of cost 5 or less (6 and 7 are out)', () => {
    const g = main(L29.nami, [C29.c1, C29.c3, C29.c5, C29.c6, C29.c7]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.c3, C29.c5].sort());
  });

  it("returns the chosen Character to its owner's (p2's) hand", () => {
    const g = main(L29.nami, [C29.c5, C29.c1]);
    playRaw(g, ID);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c5)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(hand(g, 'p2')).toEqual([C29.c5]);
    expect(ids29(g, 'p2', 'trash')).toEqual([]);
    expect(isMain(g, 'p1')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('another card named [Nami] as Leader (P-117) works too', () => {
    const g = main(NAMI_P, [C29.c2]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', C29.c2)]);
    expect(hand(g, 'p2')).toEqual([C29.c2]);
  });

  it('with a Leader not named Nami nothing is asked and nothing is returned', () => {
    const g = main(L29.croc, [C29.c1]);
    playRaw(g, ID);
    expect(kind(g)).toBe('main');
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it("the opponent's Nami Leader does not count: my Leader must be Nami", () => {
    const g = mine(L29.croc, { hand: [ID] }, { characters: [C29.c1] }, L29.nami);
    playRaw(g, ID);
    expect(kind(g)).toBe('main');
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
  });

  it('"up to 1": choosing nothing returns nothing', () => {
    const g = main(L29.nami, [C29.c1]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('my own Characters are never offered, and only 1 card is returned', () => {
    const g = main(L29.nami, [C29.c2, C29.c3], [C29.c1]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2, C29.c3].sort());
    pickInst(g, [inst(g, 'p2', 'characters', C29.c2)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c3]);
    expect(ids29(g, 'p1', 'characters')).toEqual([C29.c1, ID].sort());
  });

  it('with only Characters of cost 6 or more nothing can be returned', () => {
    const g = main(L29.nami, [C29.c6, C29.c7]);
    playRaw(g, ID);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c6, C29.c7].sort());
  });
});

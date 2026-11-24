/**
 * OP14-050 Chew (Character, Blue, cost 1, 3000, {Fish-Man}/{The Sun Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Fish-Man} type, draw 1 card."
 *
 * Rules: CR 2-4-3 (a {Type} reference is an exact type), CR 8-3-3 (no effect after a failed "if"),
 * CR 3-1-2-1 (a condition about "your Leader" reads the Leader, not the Characters).
 */
import { describe, expect, it } from 'vitest';
import { atMain, BLUE, C14, deck, don, hand, L14, mine, put } from './kit-op14b.ts';

const CHEW = 'OP14-050';

function start(leader: string, p1extra: string[] = []) {
  return mine(leader, {
    hand: [CHEW],
    deck: [C14.kingdew, C14.thatch, BLUE, BLUE],
    characters: p1extra,
  });
}

describe('OP14-050 Chew: [On Play] if your Leader has {Fish-Man}, draw 1', () => {
  it('a {Fish-Man} Leader (OP03-022 Arlong): draws exactly 1 card from the top', () => {
    const g = start(L14.fish);
    put(g, CHEW);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.kingdew]);
    expect(deck(g)).toHaveLength(3);
  });

  it('a Leader with {Fish-Man} among several types (OP14-040 Jinbe): draws', () => {
    const g = start(L14.jinbe);
    put(g, CHEW);
    expect(hand(g)).toEqual([C14.kingdew]);
  });

  it('another Fish-Man Leader (OP11-021 Jinbe, {Fish-Man}/{Straw Hat Crew}): draws', () => {
    const g = start(L14.jinbe2);
    put(g, CHEW);
    expect(hand(g)).toEqual([C14.kingdew]);
  });

  it('a Leader without {Fish-Man} (a {Straw Hat Crew} Leader): draws nothing', () => {
    const g = start(L14.luffy);
    put(g, CHEW);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(4);
  });

  it('a {Merfolk} Leader is not a {Fish-Man} Leader: draws nothing', () => {
    const g = start(L14.merfolk);
    put(g, CHEW);
    expect(hand(g)).toEqual([]);
  });

  it('Chew is itself a {Fish-Man}, but the condition reads the Leader: with a non-Fish-Man Leader and a Fish-Man Character on the field nothing is drawn', () => {
    const g = start(L14.luffy, [C14.namule]);
    put(g, CHEW);
    expect(hand(g)).toEqual([]);
  });

  it("the opponent's Leader is not read: my non-Fish-Man Leader against a {Fish-Man} Leader draws nothing", () => {
    const g = mine(L14.luffy, { hand: [CHEW], deck: [C14.kingdew, BLUE, BLUE] }, {}, L14.fish);
    put(g, CHEW);
    expect(hand(g)).toEqual([]);
  });

  it('a {Fish-Man} Leader with an opposing non-Fish-Man Leader still draws (only my Leader counts)', () => {
    const g = mine(L14.fish, { hand: [CHEW], deck: [C14.kingdew, BLUE, BLUE] }, {}, L14.luffy);
    put(g, CHEW);
    expect(hand(g)).toEqual([C14.kingdew]);
  });

  it('the Chew itself comes into play and costs its 1 DON!!', () => {
    const g = start(L14.fish);
    put(g, CHEW);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CHEW]);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });
});

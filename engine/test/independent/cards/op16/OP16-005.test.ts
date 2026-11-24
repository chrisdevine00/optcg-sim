/**
 * OP16-005 Thatch (Character, Red, cost 8, 8000, Counter +1000, {Whitebeard Pirates}, Slash, [Blocker]).
 *
 * Card text: "If you have a Character with 8000 power or more and a type including "Whitebeard Pirates"
 * give this card in your hand -3 cost. [Blocker]"
 *
 * Rules: CR 8-1-3-3 (permanent effects in hand change the card's cost), CR 3-1-6 / RL-12 (the card
 * that enters the field is new: the reduction is gone), CR 2-7-2 (play cost paid from active DON!!),
 * CR 10-1-3 ([Blocker]). "A type including" counts {Whitebeard Pirates Allies}.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  blockers,
  canPlayCard,
  costOf,
  don,
  kw,
  mine,
  OL,
  OV,
  playCard,
  theirs,
  attack,
  passBlock,
} from './kit-op16a.ts';

const THATCH = 'OP16-005';

/** p1's Main Phase with Thatch in hand; `chars` on p1's field, `p2chars` on p2's. */
function board(
  chars: (string | { card: string; don?: number })[] = [],
  p2chars: string[] = [],
  active = 10,
) {
  return mine(
    OL.luffy,
    {
      hand: [THATCH],
      characters: chars,
      costArea: {
        active,
        rested:
          10 - active - chars.reduce((n, c) => n + (typeof c === 'string' ? 0 : (c.don ?? 0)), 0),
      },
    },
    { characters: p2chars },
  );
}
const handCost = (g: ReturnType<typeof board>) => costOf(g, g.find('p1', 'hand', THATCH));

describe('OP16-005 Thatch: -3 cost in hand with an 8000+ {Whitebeard Pirates} Character', () => {
  it('without any Character it costs its printed 8', () => {
    expect(handCost(board())).toBe(8);
  });

  it('with a {Whitebeard Pirates} Character with exactly 8000 power it costs 5', () => {
    expect(handCost(board([OV.thatch]))).toBe(5);
  });

  it('boundary: a {Whitebeard Pirates} Character with 7000 power does not reduce it', () => {
    expect(handCost(board([OV.kingdew5]))).toBe(8);
  });

  it('"or more": a {Whitebeard Pirates Allies} Character with 9000 power (type including) reduces it', () => {
    expect(handCost(board([OV.oars9]))).toBe(5);
    expect(handCost(board([OV.ramba]))).toBe(5);
  });

  it('a Character with 8000+ power but no Whitebeard type (Franky 8000, Accino 10000) does not', () => {
    expect(handCost(board([OV.franky8]))).toBe(8);
    expect(handCost(board([OV.accino10]))).toBe(8);
  });

  it("only my Characters count: an opponent's 8000 {Whitebeard Pirates} Character does not", () => {
    expect(handCost(board([], [OV.thatch]))).toBe(8);
  });

  it('the power is the current power: a 7000 {Whitebeard Pirates} Character with 1 DON!! given (8000) counts', () => {
    expect(handCost(board([{ card: OV.kingdew5, don: 1 }], [], 9))).toBe(5);
  });

  it('the reduction is only a reduction of 3, whatever the number of qualifying Characters', () => {
    expect(handCost(board([OV.thatch, OV.ramba]))).toBe(5);
  });

  it('with the reduction it can be played with exactly 5 active DON!!; without, 5 is not enough', () => {
    const reduced = board([OV.thatch], [], 5);
    expect(canPlayCard(reduced, reduced.find('p1', 'hand', THATCH))).toBe(true);
    const plain = board([], [], 5);
    expect(canPlayCard(plain, plain.find('p1', 'hand', THATCH))).toBe(false);
    const short = board([OV.thatch], [], 4);
    expect(canPlayCard(short, short.find('p1', 'hand', THATCH))).toBe(false);
  });

  it('paying the reduced cost rests exactly 5 DON!!', () => {
    const g = board([OV.thatch], [], 10);
    playCard(g, THATCH);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([OV.thatch, THATCH].sort());
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
  });

  it('on the field the card has its printed cost of 8 (the reduction applies in hand only)', () => {
    const g = board([OV.thatch]);
    playCard(g, THATCH);
    expect(costOf(g, at(g, 'p1', 'characters', THATCH))).toBe(8);
  });

  it('it has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(OL.luffy, { characters: [THATCH] }, { characters: [OV.hajrudin6] });
    expect(kw(g, at(g, 'p1', 'characters', THATCH))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', OV.hajrudin6), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', THATCH)]);
    passBlock(g);
  });
});

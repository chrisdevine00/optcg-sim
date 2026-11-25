/**
 * OP10-104 Caribou (Character, Yellow, cost 4, 5000, Counter +1000, Special, {Caribou Pirates}/{Supernovas}).
 *
 * Card text: "[DON!! x1] If your Leader has the "Supernovas" type and your opponent has 3 or more Life
 * cards, this Character cannot be K.O.'d in battle."
 *
 * Rules: [DON!! xX] is a condition met by X or more DON!! given to the card (CR 8-3-2-3); given DON!!
 * stay on a card through the opponent's turn; "cannot be K.O.'d in battle" does not stop a K.O. by an
 * effect (RL-14); the Leader type is read on my Leader (Caribou's own type does not count); the Life
 * count is the opponent's. The data quotes the type, which the card data treats as an exact type.
 * Scenery: ST01-001 Luffy ({Supernovas} Leader), ST03-001 Crocodile (not), OP02-007 Thatch (8000).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  fill,
  KINGDOM_COME,
  LD_LF,
  noDefence,
  opponentKingdomCome,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const CARIBOU = 'OP10-104';
const { thatch, mohji, marco } = VAN_LF;

/** p2 (8000 Thatch) attacks a rested Caribou holding `don` DON!!; p2 has `oppLife` Life cards. */
function hit(o: { leader?: string; don?: number; oppLife?: number; myLife?: number }) {
  const g = theirs(
    o.leader ?? LD_LF.luffy,
    {
      characters: [{ card: CARIBOU, rested: true, don: o.don ?? 1 }],
      ...(o.myLife !== undefined ? { life: fill(marco, o.myLife) } : {}),
    },
    { characters: [thatch], life: fill(mohji, o.oppLife ?? 3), hand: [KINGDOM_COME] },
  );
  attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', CARIBOU));
  noDefence(g);
  return g;
}

describe('OP10-104 Caribou', () => {
  it('printed values: cost 4, 5000 power (given DON!! add only on my turn), Counter +1000', () => {
    const g = theirs(LD_LF.luffy, { characters: [CARIBOU] });
    const c = at(g, 'p1', 'characters', CARIBOU);
    expect(g.card(c).cost).toBe(4);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('all conditions met (1 DON!!, {Supernovas} Leader, opponent at 3 Life): he survives a battle he loses', () => {
    const g = hit({});
    expect(chars(g)).toEqual([CARIBOU]);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: the opponent at 3 Life is enough; 4 and 5 Life are too', () => {
    expect(chars(hit({ oppLife: 3 }))).toEqual([CARIBOU]);
    expect(chars(hit({ oppLife: 4 }))).toEqual([CARIBOU]);
    expect(chars(hit({ oppLife: 5 }))).toEqual([CARIBOU]);
  });

  it("boundary: the opponent at 2 Life is not enough, he is K.O.'d", () => {
    const g = hit({ oppLife: 2 });
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([CARIBOU]);
  });

  it('the opponent at 0 Life is not enough either', () => {
    const g = hit({ oppLife: 0 });
    expect(chars(g)).toEqual([]);
  });

  it("[DON!! x1]: with no DON!! given he is K.O.'d", () => {
    const g = hit({ don: 0 });
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([CARIBOU]);
  });

  it('[DON!! x1] means 1 or more: 2 given DON!! work too', () => {
    const g = hit({ don: 2 });
    expect(chars(g)).toEqual([CARIBOU]);
  });

  it("a Leader without the {Supernovas} type: he is K.O.'d (his own {Supernovas} type does not count)", () => {
    const g = hit({ leader: LD_LF.croc });
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([CARIBOU]);
  });

  it("the Life count is the opponent's: my own Life (1) does not matter, with the opponent at 3 he survives", () => {
    const g = hit({ myLife: 1, oppLife: 3 });
    expect(chars(g)).toEqual([CARIBOU]);
  });

  it("the Life count is the opponent's: my own Life (5) does not help when the opponent is at 2", () => {
    const g = hit({ myLife: 5, oppLife: 2 });
    expect(chars(g)).toEqual([]);
  });

  it("only battle is covered: with every condition met an opponent's K.O. effect still K.O.s him", () => {
    const g = theirs(
      LD_LF.luffy,
      { characters: [{ card: CARIBOU, don: 1 }] },
      { life: fill(mohji, 3), hand: [KINGDOM_COME] },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', CARIBOU));
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([CARIBOU]);
  });
});

/**
 * OP16-018 Rockstar (Character, Red, cost 1, 2000, Counter +2000, {Red-Haired Pirates}, Slash).
 *
 * Card text: "[Once Per Turn] If your {Red-Haired Pirates} type Character would be K.O.'d, you may trash
 * 1 Character card with 6000 power or more from your hand instead."
 *
 * Rules: CR 8-1-3-4 (replacement effects, optional when worded "may"; an impossible replacement
 * cannot be applied, RL-31), CR 10-2-13 ([Once Per Turn]), CR 8-3-1 (costs). Rockstar is itself a
 * {Red-Haired Pirates} Character. Scenery: OP09-006 Howling Gab (Red, 7000, {Red-Haired Pirates}),
 * P-023 Yasopp (Red, 8000, {Red-Haired Pirates}), OP09-077 Gum-Gum Lightning (K.O. up to 1 with 6000
 * power or less, an event of the opponent).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  attack,
  BLUE,
  charIds,
  decider,
  decision,
  decline,
  hand,
  kind,
  need,
  noDefence,
  OL,
  OV,
  offered,
  offeredIds,
  opponentKOs,
  payHand,
  RED,
  SC2,
  side,
  theirs,
  theirTurn,
  myTurn,
  trash,
  unusable,
  fill,
} from './kit-op16a.ts';

const ROCKSTAR = 'OP16-018';
const GAB = SC2.gabRed; // OP09-006: 7000 {Red-Haired Pirates}
const YASOPP = SC2.yasopp; // P-023: 8000 {Red-Haired Pirates}

/** p2's turn: p2's `attacker` (10000) attacks my rested Character `target`; I have `chars` and `inHand`. */
function koInBattle(target: string, inHand: string[], chars: string[] = []) {
  const g = theirTurn(
    side(OL.luffy, BLUE, {
      characters: [ROCKSTAR, { card: target, rested: true }, ...chars],
      hand: inHand,
      life: fill(BLUE, 4),
    }),
    side(OL.luffy, RED, { characters: [OV.accino10] }),
  );
  attack(g, at(g, 'p2', 'characters', OV.accino10), at(g, 'p1', 'characters', target));
  noDefence(g);
  return g;
}

describe('OP16-018 Rockstar: replacement, trash a 6000+ Character card from hand instead of a Red-Haired Pirates K.O.', () => {
  it("offers the replacement to me when my {Red-Haired Pirates} Character would be K.O.'d in battle", () => {
    const g = koInBattle(GAB, [OV.thatch]);
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('optional');
    expect(decision(g)?.purpose).toBe('replacement');
  });

  it("accepting: the hand card is trashed, the Character is not K.O.'d and stays on the field", () => {
    const g = koInBattle(GAB, [OV.thatch]);
    accept(g);
    payHand(g, [OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([GAB, ROCKSTAR].sort());
    expect(trash(g)).toEqual([OV.thatch]);
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });

  it("declining: the Character is K.O.'d and the hand card stays", () => {
    const g = koInBattle(GAB, [OV.thatch]);
    decline(g);
    expect(charIds(g, 'p1')).toEqual([ROCKSTAR]);
    expect(trash(g)).toEqual([GAB]);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it('boundary: a Character card with 6000 power pays; one with 5000 does not', () => {
    const g = koInBattle(GAB, [OV.hajrudin6, OV.marco5]);
    accept(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.hajrudin6]);
    payHand(g, [OV.hajrudin6]);
    expect(trash(g)).toEqual([OV.hajrudin6]);
    expect(charIds(g, 'p1')).toEqual([GAB, ROCKSTAR].sort());
  });

  it('"or more": 7000, 8000 and 10000 Character cards are all offered', () => {
    const g = koInBattle(GAB, [OV.kingdew5, OV.thatch, OV.accino10, OV.sai4]);
    accept(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.accino10, OV.kingdew5, OV.thatch].sort());
  });

  it('with only a 5000-power Character in hand the replacement cannot be applied: the K.O. happens', () => {
    const g = koInBattle(GAB, [OV.marco5]);
    unusable(g, 'p1');
    expect(charIds(g, 'p1')).toEqual([ROCKSTAR]);
    expect(trash(g)).toEqual([GAB]);
    expect(hand(g)).toEqual([OV.marco5]);
  });

  it('with an empty hand the K.O. happens', () => {
    const g = koInBattle(GAB, []);
    unusable(g, 'p1');
    expect(trash(g)).toEqual([GAB]);
  });

  it("Rockstar itself is a {Red-Haired Pirates} Character: it is covered when it would be K.O.'d", () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, { characters: [{ card: ROCKSTAR, rested: true }], hand: [OV.thatch] }),
      side(OL.luffy, RED, { characters: [OV.accino10] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.accino10), at(g, 'p1', 'characters', ROCKSTAR));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payHand(g, [OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([ROCKSTAR]);
    expect(trash(g)).toEqual([OV.thatch]);
  });

  it('a Character without the {Red-Haired Pirates} type is not covered', () => {
    const g = koInBattle(OV.sai4, [OV.thatch]);
    expect(offered(g, 'p1')).toBe(false);
    expect(trash(g)).toEqual([OV.sai4]);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it("it also covers a K.O. by an opponent's effect", () => {
    const g = theirs(
      OL.luffy,
      { characters: [ROCKSTAR, SC2.rockstar], hand: [OV.thatch], life: fill(BLUE, 4) },
      { hand: [SC2.lightning], characters: [OV.kingdew5] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', SC2.rockstar));
    expect(decision(g)?.purpose).toBe('replacement');
    accept(g);
    payHand(g, [OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([ROCKSTAR, SC2.rockstar].sort());
  });

  it('[Once Per Turn]: the second K.O. of the turn is not replaced', () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, {
        characters: [ROCKSTAR, { card: GAB, rested: true }, { card: YASOPP, rested: true }],
        hand: [OV.thatch, OV.ramba],
        life: fill(BLUE, 4),
      }),
      side(OL.luffy, RED, { characters: [OV.accino10, OV.shiki10] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.accino10), at(g, 'p1', 'characters', GAB));
    noDefence(g);
    accept(g);
    payHand(g, [OV.thatch]);
    attack(g, at(g, 'p2', 'characters', OV.shiki10), at(g, 'p1', 'characters', YASOPP));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(charIds(g, 'p1')).toEqual([GAB, ROCKSTAR].sort());
    expect(trash(g)).toEqual([OV.thatch, YASOPP].sort());
  });

  it('declining does not spend the [Once Per Turn]: a later K.O. the same turn is offered again', () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, {
        characters: [ROCKSTAR, { card: GAB, rested: true }, { card: YASOPP, rested: true }],
        hand: [OV.thatch],
        life: fill(BLUE, 4),
      }),
      side(OL.luffy, RED, { characters: [OV.accino10, OV.shiki10] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.accino10), at(g, 'p1', 'characters', GAB));
    noDefence(g);
    decline(g);
    attack(g, at(g, 'p2', 'characters', OV.shiki10), at(g, 'p1', 'characters', YASOPP));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(true);
  });

  it("must not: my Rockstar does not protect the opponent's {Red-Haired Pirates} Character (nobody is asked)", () => {
    const g = myTurn(
      side(OL.luffy, BLUE, { characters: [ROCKSTAR, OV.accino10], hand: [OV.thatch] }),
      side(OL.luffy, RED, { characters: [{ card: GAB, rested: true }] }),
    );
    attack(g, at(g, 'p1', 'characters', OV.accino10), at(g, 'p2', 'characters', GAB));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(trash(g, 'p2')).toEqual([GAB]);
    expect(hand(g)).toEqual([OV.thatch]);
  });
});

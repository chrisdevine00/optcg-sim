/**
 * OP16-014 Marco (Character, Red, cost 6, 8000, no Counter, {Whitebeard Pirates}, Special).
 *
 * Card text: "If one of your Characters would be removed from the field by your opponent's effect, you
 * may K.O. this character instead.
 * [On K.O.] You may trash 1 Character card with 8000 power from your hand: Play this Character card
 * from your trash."
 *
 * Rules: CR 8-1-3-4 (replacement effects; optional when worded "may"), RL-31 (the other Character is
 * saved and the replacing Character is still K.O.'d; an impossible replacement cannot be applied),
 * CR 10-2-17 ([On K.O.]), CR 8-3-1 (costs). Scenery: OP09-077 Gum-Gum Lightning is the opponent's
 * K.O. effect (up to 1 Character with 6000 power or less).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  at,
  attack,
  charIds,
  decider,
  decision,
  decline,
  fill,
  hand,
  kind,
  mine,
  need,
  noDefence,
  offered,
  offeredIds,
  OL,
  OV,
  opponentKOs,
  payCost,
  payHand,
  SC2,
  side,
  skipUnusable,
  theirs,
  theirTurn,
  trash,
  unusable,
  BLUE,
  RED,
  restedChar,
} from './kit-op16a.ts';

const MARCO = 'OP16-014';
const LIGHTNING = SC2.lightning;
const KOMACHIYO = OV.komachiyo3;

/** p2's turn: p2 holds Lightning; p1 has Marco, a 3000 Komachiyo and `inHand`. */
function board(inHand: string[] = [], extra: string[] = [KOMACHIYO]) {
  return theirs(
    OL.luffy,
    { hand: inHand, characters: [MARCO, ...extra], life: fill(BLUE, 4) },
    { hand: [LIGHTNING], characters: [OV.kingdew5] },
  );
}
/** p2 K.O.s my Komachiyo with Lightning; stops at the first prompt the K.O. causes. */
function koKomachiyo(inHand: string[] = []) {
  const g = board(inHand);
  opponentKOs(g, g.find('p1', 'characters', KOMACHIYO));
  return g;
}

describe('OP16-014 Marco: replacement, K.O. this Character instead of another one removed by an opponent\'s effect', () => {
  it('offers the replacement to me when the opponent\'s effect would K.O. another Character', () => {
    const g = koKomachiyo();
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('optional');
    expect(decision(g)?.purpose).toBe('replacement');
  });

  it('accepting: Marco is K.O.\'d (trashed) and the other Character stays on the field', () => {
    const g = koKomachiyo();
    accept(g);
    skipUnusable(g, 'p1');
    expect(charIds(g, 'p1')).toEqual([KOMACHIYO]);
    expect(trash(g)).toEqual([MARCO]);
  });

  it('declining: the other Character is K.O.\'d as usual and Marco stays', () => {
    const g = koKomachiyo();
    decline(g);
    expect(charIds(g, 'p1')).toEqual([MARCO]);
    expect(trash(g)).toEqual([KOMACHIYO]);
  });

  it('not offered when the other Character is K.O.\'d in battle (only an opponent\'s EFFECT triggers it)', () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, { characters: [MARCO, { card: KOMACHIYO, rested: true }] }),
      side(OL.luffy, RED, { characters: [OV.kingdew5] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.kingdew5), at(g, 'p1', 'characters', KOMACHIYO));
    noDefence(g);
    expect(offered(g, 'p1')).toBe(false);
    expect(charIds(g, 'p1')).toEqual([MARCO]);
    expect(trash(g)).toEqual([KOMACHIYO]);
  });

  it('the replacing Marco is still K.O.\'d: its [On K.O.] is offered and, with an 8000-power Character in hand, brings it back', () => {
    const g = koKomachiyo([OV.thatch]);
    accept(g);
    need(g, 'optional', 'p1');
    accept(g);
    payCost(g, [OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([MARCO, KOMACHIYO].sort());
    expect(trash(g)).toEqual([OV.thatch]);
    expect(hand(g)).toEqual([]);
    expect(restedChar(g, 'p1', MARCO)).toBe(false);
  });

  it('declining the [On K.O.] leaves Marco in the trash and the card in hand', () => {
    const g = koKomachiyo([OV.thatch]);
    accept(g);
    decline(g);
    expect(charIds(g, 'p1')).toEqual([KOMACHIYO]);
    expect(trash(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([OV.thatch]);
  });

  it('boundary: the cost needs exactly 8000 power; 7000 and 9000 Characters in hand cannot pay it', () => {
    const g = koKomachiyo([OV.kingdew5, OV.oars9]);
    accept(g);
    unusable(g, 'p1');
    expect(charIds(g, 'p1')).toEqual([KOMACHIYO]);
    expect(trash(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([OV.kingdew5, OV.oars9].sort());
  });

  it('the cost offers only 8000-power Characters from hand', () => {
    const g = koKomachiyo([OV.thatch, OV.ramba, OV.kingdew5]);
    accept(g);
    accept(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.thatch, OV.ramba].sort());
    payHand(g, [OV.ramba]);
    expect(trash(g)).toEqual([OV.ramba]);
    expect(charIds(g, 'p1')).toEqual([MARCO, KOMACHIYO].sort());
  });

  it('a Marco K.O.\'d in battle (no replacement involved) also uses [On K.O.] to come back', () => {
    const g = theirTurn(
      side(OL.luffy, BLUE, { characters: [{ card: MARCO, rested: true }], hand: [OV.thatch] }),
      side(OL.luffy, RED, { characters: [OV.accino10] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.accino10), at(g, 'p1', 'characters', MARCO));
    noDefence(g);
    need(g, 'optional', 'p1');
    accept(g);
    payCost(g, [OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([MARCO]);
    expect(trash(g)).toEqual([OV.thatch]);
  });

  it('works for either player: when p1\'s effect would K.O. p2\'s Character, p2 (the controller of Marco) is asked, not p1', () => {
    const g = mine(
      OL.luffy,
      { hand: [LIGHTNING] },
      { characters: [MARCO, KOMACHIYO] },
    );
    opponentKOs(g, g.find('p2', 'characters', KOMACHIYO));
    expect(offered(g, 'p2')).toBe(true);
    expect(decider(g)).toBe('p2');
  });
});

/**
 * OP17-015 Marco (Character, Red, cost 5, 6000, Counter +1000, {Whitebeard Pirates}, Special).
 *
 * Card text: "If one of your Characters would be removed from the field by your opponent's effect, you
 * may K.O. this Character instead.
 * [On K.O.] You may trash 1 card with a type including "Whitebeard Pirates" from your hand: Play this
 * Character card from your trash."
 *
 * Rules: CR 8-1-3-4 (replacement effects; optional when worded "may"), RL-31 (QA-OP17 OP17-015: the
 * other Character is saved and the replacing Character is still K.O.'d; an impossible replacement
 * cannot be applied), CR 10-2-17 ([On K.O.]), CR 8-3-1-3/-4 (costs), "a type including". Scenery:
 * OP09-077 Gum-Gum Lightning, the opponent's K.O. effect (up to 1 Character with 6000 power or less).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  attack,
  BLUE,
  charsOf,
  decider,
  decision,
  decline,
  expectMain,
  hand,
  isRested,
  kind,
  LD,
  noDefence,
  offered,
  opponentKOs,
  payWith,
  SC2,
  skipUnusable,
  theirs,
  trash,
  VAN,
  WB,
} from './kit-op17a.ts';

const MARCO = 'OP17-015';
const LIGHTNING = SC2.lightning;

/** p2's turn: p2 holds Lightning; p1 has Marco, a 3000 Komachiyo and `inHand`. */
function board(inHand: string[] = [], extra: string[] = [SC2.komachiyo]) {
  return theirs(
    LD.luffy,
    { hand: inHand, characters: [MARCO, ...extra], life: fill(BLUE, 4) },
    { hand: [LIGHTNING], characters: [WB.kingdew] },
  );
}
/** p2 K.O.s my Komachiyo with Lightning; stops at the replacement question. */
function koKomachiyo(inHand: string[] = []) {
  const g = board(inHand);
  opponentKOs(g, g.find('p1', 'characters', SC2.komachiyo));
  return g;
}

describe('OP17-015 Marco: replacement, K.O. this Character instead of another Character removed by the opponent’s effect', () => {
  it('offers the replacement to me when the opponent’s effect would K.O. another Character', () => {
    const g = koKomachiyo();
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('optional');
    expect(decision(g)?.purpose).toBe('replacement');
  });

  it('accepting: Marco is K.O.’d (trashed) and Komachiyo stays on the field', () => {
    const g = koKomachiyo();
    accept(g);
    skipUnusable(g, 'p1');
    expect(charsOf(g, 'p1')).toEqual([SC2.komachiyo]);
    expect(trash(g)).toEqual([MARCO]);
  });

  it('declining: Komachiyo is K.O.’d as usual and Marco stays', () => {
    const g = koKomachiyo();
    decline(g);
    expect(charsOf(g, 'p1')).toEqual([MARCO]);
    expect(trash(g)).toEqual([SC2.komachiyo]);
  });

  it('the replacing Marco is still K.O.’d: its [On K.O.] is offered and, with a Whitebeard Pirates card in hand, can bring it back', () => {
    const g = koKomachiyo([WB.doma]);
    accept(g);
    expect(kind(g)).toBe('optional');
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [g.find('p1', 'hand', WB.doma)]);
    expect(charsOf(g, 'p1')).toEqual([MARCO, SC2.komachiyo].sort());
    expect(trash(g)).toEqual([WB.doma]);
    expect(hand(g)).toEqual([]);
    expect(isRested(g, 'p1', MARCO)).toBe(false);
  });

  it('declining the [On K.O.] leaves Marco in the trash and the card in hand', () => {
    const g = koKomachiyo([WB.doma]);
    accept(g);
    decline(g);
    expect(charsOf(g, 'p1')).toEqual([SC2.komachiyo]);
    expect(trash(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([WB.doma]);
  });

  it('CR 8-3-1-3: the cost needs a type including "Whitebeard Pirates": with only a Mohji in hand it cannot be paid', () => {
    const g = koKomachiyo([VAN.mohji]);
    accept(g);
    skipUnusable(g, 'p1');
    expect(charsOf(g, 'p1')).toEqual([SC2.komachiyo]);
    expect(trash(g)).toEqual([MARCO]);
    expect(hand(g)).toEqual([VAN.mohji]);
  });

  it('"a type including": a {Former Whitebeard Pirates} card pays the cost', () => {
    const g = koKomachiyo([WB.formerMarco]);
    accept(g);
    accept(g);
    payWith(g, [g.find('p1', 'hand', WB.formerMarco)]);
    expect(charsOf(g, 'p1')).toEqual([MARCO, SC2.komachiyo].sort());
    expect(trash(g)).toEqual([WB.formerMarco]);
  });

  it('only the opponent’s EFFECT: a Character K.O.’d in battle gets no replacement offer', () => {
    const g = theirs(
      LD.luffy,
      { characters: [MARCO, { card: SC2.komachiyo, rested: true }], life: fill(BLUE, 4) },
      { characters: [WB.kingdew] },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', SC2.komachiyo));
    noDefence(g);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([MARCO]);
    expect(trash(g)).toEqual([SC2.komachiyo]);
  });

  it('QA-OP17 OP17-015: when Marco himself is the Character K.O.’d by the effect he is K.O.’d whatever is answered (see API-GAPS-a.md)', () => {
    const g = board([], []);
    opponentKOs(g, g.find('p1', 'characters', MARCO));
    // Replacing Marco’s K.O. by "K.O. this Character" changes nothing; the engine may or may not ask.
    if (kind(g) === 'optional' && decision(g)?.purpose === 'replacement') decline(g);
    skipUnusable(g, 'p1');
    expect(charsOf(g, 'p1')).toEqual([]);
    expect(trash(g)).toEqual([MARCO]);
  });
});

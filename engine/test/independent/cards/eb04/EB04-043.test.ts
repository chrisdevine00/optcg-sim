/**
 * EB04-043 Kaku (Character, Black, cost 3, 4000, Counter +2000, {CP0}/{Egghead}).
 *
 * Card text: "[Once Per Turn] If your black Character with a base cost of 5 or less would be K.O.'d by
 * your opponent's effect, you may place 3 cards from your trash at the bottom of your deck in any
 * order instead.
 * [On Play] Trash 2 cards from the top of your deck."
 *
 * Rules: a replacement effect (CR 10-6) applies to the K.O. by an opposing effect only, not to a
 * battle K.O. Kaku is a black Character with base cost 3 and protects himself. Once per turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chars,
  deck,
  endTurn,
  fill,
  kind,
  LB,
  mine,
  need,
  no,
  opponentKOs,
  passBlock,
  passCounter,
  pickInOrder,
  playRaw,
  settleOrders,
  tail,
  theirs,
  trash,
  yes,
  atMain,
  opponentKingdomCome,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-043';
const LIGHTNING = 'OP09-077';
/** OP02-097 Komille: Black, cost 1, 3000, {Navy}. */
const KOMILLE = 'OP02-097';
/** OP02-107 Doberman: Black, cost 2, 4000, {Navy}. */
const DOBERMAN = 'OP02-107';
/** EB03-040 Kalifa: Black, cost 5, 6000, {CP9}. */
const KALIFA = 'EB03-040';
/** OP11-093 Bogard: Black, cost 6, 7000, {Navy}. */
const BOGARD = 'OP11-093';
const SAI = 'OP01-012'; // Red, cost 2, 4000
const HAJ = 'OP01-018';
const KINGDEW = 'OP02-006';
const THATCH = 'OP02-007';
const MARCO = 'OP01-023';
const TRASH5 = [SAI, HAJ, KINGDEW, THATCH, MARCO];

/** p2's turn; p1 has `own` Characters and `trashed` cards in trash; p2 holds `p2hand`. */
function defend(
  own: (string | { card: string; rested: boolean })[],
  trashed: string[],
  p2hand: string[],
): TestGame {
  return theirs(
    LB.navy,
    { characters: own, trash: trashed, deck: fill(BLUE, 10), life: fill(BLUE, 4) },
    { hand: p2hand, characters: [HAJ] },
  );
}

/** Accept Kaku's replacement and pay with these three trashed cards (by instance, first-listed order). */
function replaceWith(g: TestGame, cards: string[]): void {
  yes(g, 'p1');
  const insts = cards.map((c) => g.find('p1', 'trash', c));
  pickInOrder(g, insts);
  settleOrders(g, 'p1');
}

describe('EB04-043 Kaku: [On Play] trash 2 cards from the top of your deck', () => {
  it('trashes exactly the top 2 cards', () => {
    const g = mine(LB.navy, { hand: [ID], deck: [SAI, HAJ, KINGDEW, ...fill(BLUE, 7)] });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SAI, HAJ].sort());
    expect(deck(g)).toHaveLength(8);
    expect(deck(g)[0]).toBe(KINGDEW);
  });
});

describe('EB04-043 Kaku: [Once Per Turn] replaces the K.O. of a black Character with base cost 5 or less by an opposing effect', () => {
  it('Kaku protects himself: the 3 chosen trash cards go to the bottom of the deck and he stays', () => {
    const g = defend([ID], TRASH5, [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    replaceWith(g, [SAI, HAJ, MARCO]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([KINGDEW, THATCH].sort());
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 3)).toEqual([SAI, HAJ, MARCO].sort());
  });

  it('protects another black Character with base cost 5 or less', () => {
    const g = defend([ID, KOMILLE], TRASH5, [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', KOMILLE));
    need(g, 'optional', 'p1');
    replaceWith(g, [SAI, HAJ, MARCO]);
    expect(chars(g)).toEqual([ID, KOMILLE].sort());
  });

  it('boundary: a black Character with base cost exactly 5 is protected', () => {
    const g = defend([ID, KALIFA], TRASH5, [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', KALIFA));
    need(g, 'optional', 'p1');
    replaceWith(g, [SAI, HAJ, MARCO]);
    expect(chars(g)).toEqual([ID, KALIFA].sort());
  });

  it('boundary: a black Character with base cost 6 is not protected', () => {
    const g = defend([ID, BOGARD], TRASH5, ['EB01-059']);
    opponentKingdomCome(g, at(g, 'p1', 'characters', BOGARD));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toContain(BOGARD);
  });

  it('a Character that is not black is not protected', () => {
    const g = defend([ID, SAI], TRASH5, [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', SAI));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ID]);
  });

  it('a K.O. in battle is not replaced', () => {
    const g = defend([ID, { card: KOMILLE, rested: true }], TRASH5, []);
    attack(g, at(g, 'p2', 'characters', HAJ), at(g, 'p1', 'characters', KOMILLE));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toContain(KOMILLE);
  });

  it('declining: the Character is K.O.d and the trash is untouched', () => {
    const g = defend([ID, KOMILLE], TRASH5, [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', KOMILLE));
    no(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toContain(KOMILLE);
    expect(trash(g)).toHaveLength(6);
  });

  it('with fewer than 3 cards in the trash the replacement cannot be used and the K.O. happens', () => {
    const g = defend([ID, KOMILLE], [SAI, HAJ], [LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', KOMILLE));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(chars(g)).toEqual([ID]);
  });

  it('[Once Per Turn]: a second K.O. attempt in the same turn is not replaced', () => {
    const g = defend([ID, KOMILLE, DOBERMAN], [...TRASH5, KALIFA, BOGARD], [LIGHTNING, LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', KOMILLE));
    need(g, 'optional', 'p1');
    replaceWith(g, [SAI, HAJ, MARCO]);
    expect(atMain(g, 'p2')).toBe(true);
    opponentKOs(g, at(g, 'p1', 'characters', DOBERMAN));
    expect(kind(g)).not.toBe('optional');
    expect(chars(g)).toEqual([ID, KOMILLE].sort());
  });

  it('[Once Per Turn] is per turn: it can be used again on the opponent next turn', () => {
    const g = defend([ID, KOMILLE, DOBERMAN], [...TRASH5, KALIFA, BOGARD], [LIGHTNING, LIGHTNING]);
    opponentKOs(g, at(g, 'p1', 'characters', KOMILLE));
    need(g, 'optional', 'p1');
    replaceWith(g, [SAI, HAJ, MARCO]);
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    opponentKOs(g, at(g, 'p1', 'characters', DOBERMAN));
    need(g, 'optional', 'p1');
    expect(chars(g)).toEqual([ID, KOMILLE, DOBERMAN].sort());
  });
});

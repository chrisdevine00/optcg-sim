/**
 * OP11-001 Koby (Leader, Red/Black, 5000, 4 Life, {Navy}/{SWORD}).
 *
 * Card text: "Your "SWORD" type Characters can attack Characters on the turn in which they are played.
 * [Once Per Turn] If your "Navy" type Character with 7000 base power or less would be removed from
 * the field by your opponent's effect, you may place 3 cards from your trash at the bottom of your
 * deck in any order instead."
 *
 * Rules: a Character cannot attack on the turn it is played (CR 3-7-4) unless an effect says so;
 * "can attack Characters" lifts that for Character targets only, and only rested Characters are
 * attackable (CR 7-1-1-2, RL-17). A replacement ("instead", CR 8-1-3-4) applies only to the event it
 * names: removal by the OPPONENT's effect, not a battle K.O. or an own effect. It is optional
 * ("you may"), once per turn, and its cost (3 cards) must be payable in full (CR 8-3-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  canHit,
  chr,
  deck,
  fill,
  at,
  ids,
  KC,
  kind,
  mine,
  N11,
  need,
  no,
  onField,
  opponentKingdomCome,
  opponentKOs,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  settleOrders,
  takeMost,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op11a.ts';

const KOBY = 'OP11-001';
/** Cards for the trash: distinct so the bottom of the deck can be read. */
const T4 = ['OP01-023', 'OP01-012', 'OP01-010', 'OP02-006'];

function theirTurnGame(chars: string[], trashCards: string[] = T4) {
  return theirs(
    KOBY,
    { characters: chars, trash: trashCards, deck: fill(N11.dadan, 12) },
    { hand: [KC, KC] },
  );
}

describe('OP11-001 Koby: SWORD Characters attack Characters the turn they are played', () => {
  it('printed values: 5000 power, 4 Life', () => {
    const g = mine(KOBY, {}, {});
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.life('p1')).toBe(4);
  });

  it('a SWORD Character played this turn can attack a rested opposing Character', () => {
    const g = mine(
      KOBY,
      { characters: [{ card: N11.sword6, playedThisTurn: true }] },
      { characters: [{ card: N11.marco, rested: true }] },
    );
    const s = chr(g, 'p1', N11.sword6);
    expect(canHit(g, s, chr(g, 'p2', N11.marco))).toBe(true);
  });

  it('a SWORD Character played this turn still cannot attack the Leader', () => {
    const g = mine(
      KOBY,
      { characters: [{ card: N11.sword6, playedThisTurn: true }] },
      { characters: [{ card: N11.marco, rested: true }] },
    );
    const s = chr(g, 'p1', N11.sword6);
    expect(canHit(g, s, g.leader('p2'))).toBe(false);
  });

  it('only rested Characters: an active opposing Character is not a legal target', () => {
    const g = mine(
      KOBY,
      { characters: [{ card: N11.sword6, playedThisTurn: true }] },
      { characters: [N11.marco] },
    );
    const s = chr(g, 'p1', N11.sword6);
    expect(canHit(g, s, chr(g, 'p2', N11.marco))).toBe(false);
  });

  it('a non-SWORD Navy Character played this turn cannot attack at all', () => {
    const g = mine(
      KOBY,
      { characters: [{ card: N11.navy4, playedThisTurn: true }] },
      { characters: [{ card: N11.marco, rested: true }] },
    );
    const s = chr(g, 'p1', N11.navy4);
    expect(canHit(g, s, chr(g, 'p2', N11.marco))).toBe(false);
    expect(canHit(g, s, g.leader('p2'))).toBe(false);
  });
});

describe('OP11-001 Koby: [Once Per Turn] replacement of removal by the opponent’s effect', () => {
  it('is offered for a Navy Character with 7000 base power (boundary), accepted: it stays, 3 trash cards go to the deck bottom', () => {
    const g = theirTurnGame([N11.navy5]);
    const target = chr(g, 'p1', N11.navy5);
    opponentKingdomCome(g, target);
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    pickInst(
      g,
      T4.slice(0, 3).map((c) => at(g, 'p1', 'trash', c)),
    );
    settleOrders(g, 'p1');
    expect(onField(g, 'p1', target)).toBe(true);
    expect(trash(g)).toContain('OP02-006');
    expect(trash(g)).not.toContain('OP01-023');
    expect(deck(g)).toHaveLength(15);
    expect(deck(g).slice(-3).sort()).toEqual(T4.slice(0, 3).sort());
  });

  it('may be declined: the Navy Character is K.O.’d and the trash is untouched', () => {
    const g = theirTurnGame([N11.navy3]);
    opponentKingdomCome(g, chr(g, 'p1', N11.navy3));
    need(g, 'optional', 'p1');
    no(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toHaveLength(5);
  });

  it('is not offered above 7000 base power (8000)', () => {
    const g = theirTurnGame([N11.navy6]);
    opponentKingdomCome(g, chr(g, 'p1', N11.navy6));
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toHaveLength(5);
  });

  it('"base power" is read, not current power: an 8000 Navy Character lowered to 4000 is still not offered', () => {
    const g = theirs(
      KOBY,
      { characters: [N11.navy6], trash: T4, deck: fill(N11.dadan, 12) },
      { hand: ['OP11-018'] },
    );
    playRaw(g, 'OP11-018');
    pickInst(g, [chr(g, 'p1', N11.navy6)]);
    need(g, 'choose', 'p2');
    pickInst(g, [chr(g, 'p1', N11.navy6)]);
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('is not offered for a non-Navy Character', () => {
    const g = theirTurnGame([N11.fish3]);
    opponentKingdomCome(g, chr(g, 'p1', N11.fish3));
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('cannot be used with fewer than 3 cards in the trash: the Character is K.O.’d', () => {
    const g = theirTurnGame([N11.navy3], T4.slice(0, 2));
    opponentKingdomCome(g, chr(g, 'p1', N11.navy3));
    unusable(g, 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    // Kingdom Come K.O.s first, then nothing was placed under the deck.
    expect(deck(g)).toHaveLength(12);
  });

  it('[Once Per Turn]: a second Navy Character K.O.\u2019d by an opponent\u2019s effect the same turn is not replaced', () => {
    const g = theirs(
      KOBY,
      { characters: [N11.navy3, N11.navy4], trash: T4, deck: fill(N11.dadan, 12) },
      { hand: ['OP09-077', KC] },
    );
    opponentKOs(g, chr(g, 'p1', N11.navy4));
    yes(g);
    pickInst(
      g,
      T4.slice(0, 3).map((c) => at(g, 'p1', 'trash', c)),
    );
    settleOrders(g, 'p1');
    takeMost(g);
    expect(ids(g, 'p1', 'characters')).toEqual([N11.navy3, N11.navy4].sort());
    opponentKingdomCome(g, chr(g, 'p1', N11.navy3));
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([N11.navy4]);
  });

  it('[Once Per Turn] with the cost payable twice: a big trash does not let a second Navy Character be replaced', () => {
    const big = [...T4, 'OP02-007', 'OP01-026', 'OP01-030', 'OP02-009', 'OP02-010'];
    const g = theirs(
      KOBY,
      { characters: [N11.navy3, N11.navy4], trash: big, deck: fill(N11.dadan, 12) },
      { hand: ['OP09-077', KC] },
    );
    opponentKOs(g, chr(g, 'p1', N11.navy4));
    yes(g);
    pickInst(
      g,
      T4.slice(0, 3).map((c) => at(g, 'p1', 'trash', c)),
    );
    settleOrders(g, 'p1');
    takeMost(g);
    expect(trash(g).length).toBeGreaterThanOrEqual(6);
    opponentKingdomCome(g, chr(g, 'p1', N11.navy3));
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([N11.navy4]);
  });

  it('a battle K.O. is not replaced', () => {
    const g = theirs(
      KOBY,
      { characters: [{ card: N11.navy3, rested: true }], trash: T4 },
      { characters: ['OP02-007'] },
    );
    attack(g, chr(g, 'p2', 'OP02-007'), chr(g, 'p1', N11.navy3));
    passBlock(g);
    passCounter(g);
    expect(kind(g)).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toHaveLength(5);
  });
});

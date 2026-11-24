/**
 * OP13-046 Vista (Character, Blue, cost 6, 8000, [Double Attack], {Whitebeard Pirates}).
 *
 * Card text: "[Double Attack]
 * [Once Per Turn] If this Character would be K.O.'d or would be removed from the field by your
 * opponent's effect, you may trash 1 card with a type including "Whitebeard Pirates" from your hand
 * instead."
 *
 * Rules: replacement effects (CR 10-1), [Double Attack] (CR 10-1-?: 2 damage), CR 7-1-4 (an
 * attacker wins a power tie). Open question M6b-Q6 (does one Once Per Turn cover both the K.O. and
 * the removal half): asserted only what both readings share, namely that a SECOND K.O. in the same
 * turn is not replaced. Not tested: removal by an opponent's effect that is not a K.O. (no cheap
 * scripted scenery card moves a cost-6 Character without negating it first; see API-GAPS-a.md).
 * Type probes: {Whitebeard Pirates Allies} (Whitey Bay), {Former Whitebeard Pirates} (Marco) and
 * {Whitebeard Pirates} (Thatch) all include the phrase; {Buggy Pirates} (Mohji) does not.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  canUse,
  cardIds,
  chr,
  endTurn,
  fill,
  hand,
  kind,
  need,
  no,
  offeredIds,
  opponentKingdomCome,
  passBlock,
  pickInst,
  takeDamage,
  theirsW,
  trash,
  unusable,
  W4,
  yes,
  mine,
} from './kit-w4a.ts';

const VISTA = 'OP13-046';
const KC = 'EB01-059';

/** p2's turn: Vista on my field, `hand` in my hand; p2 holds `kc` Kingdom Come cards. */
function ko(
  handCards: string[],
  kc = 1,
  vista: string | { card: string; rested?: boolean } = VISTA,
) {
  return theirsW(
    { characters: [vista], hand: handCards },
    { hand: fill(KC, kc), characters: [W4.oars] },
  );
}

/** p2 plays Kingdom Come on Vista; stops at the first decision it causes. */
function koVista(g: ReturnType<typeof ko>) {
  opponentKingdomCome(g, chr(g, 'p1', VISTA));
}

describe('OP13-046 Vista: [Double Attack]', () => {
  it('printed values: cost 6, 8000 power, [Double Attack]', () => {
    const g = mine('ST01-001', { characters: [VISTA] }, {});
    const c = g.card(chr(g, 'p1', VISTA));
    expect(c.cost).toBe(6);
    expect(c.power).toBe(8000);
    expect(c.keywords).toContain('Double Attack');
  });

  it('an unblocked hit on the Leader deals 2 damage', () => {
    const g = mine('ST01-001', { characters: [VISTA] }, {});
    attack(g, chr(g, 'p1', VISTA), g.leader('p2'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p2')).toBe(2);
  });
});

describe("OP13-046 Vista: instead of being K.O.'d, trash a {Whitebeard Pirates} card", () => {
  it("K.O. by the opponent's effect with the replacement accepted: Vista stays and the chosen card is trashed", () => {
    const g = ko([W4.thatch, W4.mohjiBlue]);
    koVista(g);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.thatch)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VISTA]);
    expect(trash(g, 'p1')).toEqual([W4.thatch]);
    expect(hand(g)).toEqual([W4.mohjiBlue]);
  });

  it('declining: Vista is K.O.d and the hand is untouched', () => {
    const g = ko([W4.thatch]);
    koVista(g);
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([VISTA]);
    expect(hand(g)).toEqual([W4.thatch]);
  });

  it('the hand pick offers exactly the cards whose type includes "Whitebeard Pirates" (Allies and Former count)', () => {
    const g = ko([W4.thatch, W4.whiteyBay, W4.marco, W4.mohjiBlue, W4.sai]);
    koVista(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.marco, W4.thatch, W4.whiteyBay].sort());
  });

  it('with no such card in hand the replacement cannot be paid: Vista is K.O.d', () => {
    const g = ko([W4.mohjiBlue, W4.sai]);
    koVista(g);
    // Either no question is asked, or "use" is offered with accept unavailable.
    if (kind(g) === 'optional') expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toContain(VISTA);
    expect(hand(g)).toEqual([W4.mohjiBlue, W4.sai].sort());
  });

  it('with an empty hand Vista is K.O.d', () => {
    const g = ko([]);
    koVista(g);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('exactly 1 card is trashed even with several candidates', () => {
    const g = ko([W4.thatch, W4.whiteyBay, W4.marco]);
    koVista(g);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.thatch)]);
    expect(hand(g)).toEqual([W4.marco, W4.whiteyBay].sort());
    expect(trash(g, 'p1')).toEqual([W4.thatch]);
  });

  it('a K.O. in battle is replaced too (a rested Vista attacked by a 9000 Character)', () => {
    const g = ko([W4.thatch], 1, { card: VISTA, rested: true });
    attack(g, chr(g, 'p2', W4.oars), chr(g, 'p1', VISTA));
    passBlock(g);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.thatch)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VISTA]);
    expect(trash(g, 'p1')).toEqual([W4.thatch]);
  });

  it('Once Per Turn: after the first replacement a second K.O. in the same turn is not replaced', () => {
    const g = ko([W4.thatch, W4.whiteyBay, W4.marco], 1, { card: VISTA, rested: true });
    attack(g, chr(g, 'p2', W4.oars), chr(g, 'p1', VISTA));
    passBlock(g);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.thatch)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VISTA]);
    expect(atMain(g, 'p2')).toBe(true);
    // Second K.O. the same turn, by Kingdom Come.
    koVista(g);
    if (kind(g) === 'optional') expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toContain(VISTA);
    expect(hand(g)).toEqual([W4.marco, W4.whiteyBay].sort());
  });

  it('the use renews: the next turn a K.O. can be replaced again', () => {
    const g = ko([W4.thatch, W4.whiteyBay], 2);
    koVista(g);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.thatch)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VISTA]);
    expect(atMain(g, 'p2')).toBe(true);
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    opponentKingdomCome(g, chr(g, 'p1', VISTA));
    need(g, 'optional', 'p1');
    expect(canUse(g)).toBe(true);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.whiteyBay)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([VISTA]);
  });

  it('a card with a Whitebeard type on the field is not enough: the cost is paid from the hand only', () => {
    const g = theirsW(
      { characters: [VISTA, W4.kingdew], hand: [W4.mohjiBlue] },
      { hand: [KC], characters: [W4.oars] },
    );
    koVista(g);
    if (kind(g) === 'optional') expect(canUse(g)).toBe(false);
    unusable(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([W4.kingdew]);
  });
});

/**
 * OP15-003 Alvida (Character, Red, cost 5, 6000, Counter +1000, {East Blue}/{Alvida Pirates}).
 *
 * Card text: "If this Character would be K.O.'d, you may trash 1 Character card with a power of 6000
 * or less from your hand instead. [Activate: Main] [Once Per Turn] You may give 1 of your
 * opponent's rested DON!! cards to 1 of your opponent's Characters: Give up to 1 rested DON!! card
 * to its owner's Leader or 1 of their Characters."
 *
 * M6b-Q24 (whose DON!! is given) is open; see describeGiveCost in kit-w3.ts. Rules: a replacement
 * effect ("instead") applies only if its owner chooses to (CR 8-1-3-4-1); the cost is paid from
 * the hidden hand, so it is offered even when unpayable, with accept illegal (DECISIONS
 * 2026-10-29); "power of 6000 or less" includes 6000; being returned to hand is not a K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  cardIds,
  chars,
  describeGiveCost,
  hand,
  need,
  no,
  offeredIds,
  passBlock,
  payDonStrict,
  pickInst,
  theirs,
  trash,
  unusable,
  W3C,
  W3L,
  yes,
} from './kit-w3.ts';

const ALVIDA = 'OP15-003';

describeGiveCost(ALVIDA);

/** p2's turn: Alvida (rested, so it can be attacked) and `inHand` for p1; p2 attacks it with Thatch (8000). */
function ko(inHand: string[]) {
  const g = theirs(
    W3L.kid,
    { characters: [{ card: ALVIDA, rested: true }], hand: inHand },
    { characters: [W3C.thatch] },
  );
  attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', ALVIDA));
  passBlock(g);
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP15-003 Alvida: replacement, trash a Character with power 6000 or less instead of the K.O.', () => {
  it('yes: the chosen Character is trashed and Alvida stays on the field', () => {
    const g = ko([W3C.sai, W3C.hajrudin]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickInst(g, [g.find('p1', 'hand', W3C.sai)]);
    expect(trash(g)).toEqual([W3C.sai]);
    expect(chars(g)).toEqual([ALVIDA]);
    expect(hand(g)).toEqual([W3C.hajrudin]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('boundary: power 4000 and exactly 6000 are offered, 7000 is not, and an Event is not', () => {
    const g = ko([W3C.sai, W3C.hajrudin, W3C.kingdew, W3C.bounce]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W3C.sai, W3C.hajrudin].sort());
  });

  it("no: Alvida is K.O.'d as usual and the hand is untouched", () => {
    const g = ko([W3C.sai]);
    no(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ALVIDA]);
    expect(hand(g)).toEqual([W3C.sai]);
  });

  it("with no eligible card (7000 power Character, Event) it cannot be applied and Alvida is K.O.'d", () => {
    const g = ko([W3C.kingdew, W3C.bounce]);
    unusable(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ALVIDA]);
    expect(hand(g)).toEqual([W3C.bounce, W3C.kingdew].sort());
  });

  it("also replaces a K.O. by the opponent's effect", () => {
    const g = theirs(W3L.kid, { characters: [ALVIDA], hand: [W3C.sai] }, { hand: ['OP09-077'] });
    // OP09-077 Gum-Gum Lightning (cost 2): "DON!! -2: K.O. up to 1 of your opponent's Characters with 6000 power or less".
    act(g, { type: 'playCard', card: g.find('p2', 'hand', 'OP09-077') });
    yes(g, 'p2');
    payDonStrict(g, 2);
    pickInst(g, [g.find('p1', 'characters', ALVIDA)]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    pickInst(g, [g.find('p1', 'hand', W3C.sai)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ALVIDA]);
    expect(trash(g)).toEqual([W3C.sai]);
  });

  it('being returned to the hand is not a K.O.: no replacement is offered', () => {
    const g = theirs(
      W3L.kid,
      { characters: [ALVIDA], hand: [W3C.sai] },
      { hand: [W3C.bounce], costArea: { active: 10, rested: 0 } },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.bounce) });
    // The Event's "you may rest 5 DON!!" cost, then its target.
    yes(g, 'p2');
    pickInst(g, [g.find('p1', 'characters', ALVIDA)]);
    expect(hand(g)).toEqual([ALVIDA, W3C.sai].sort());
    expect(trash(g)).toEqual([]);
  });
});

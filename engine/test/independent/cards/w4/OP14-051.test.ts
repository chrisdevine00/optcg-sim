/**
 * OP14-051 Hatchan (Character, Blue, cost 1, 3000, {Fish-Man}/{The Sun Pirates}).
 *
 * Card text: "[DON!! x2] [On K.O.] Draw 1 card."
 *
 * Rules: CR 8-3-2-3 (a [DON!! xX] condition is a state check, more than X still works, and with an
 * activation timing it must hold at that moment), RL-13 (DON!! given stay through the opponent's
 * turn), CR 6-5-5-4 (a K.O.'d card's given DON!! go to the cost area rested), CR 6-5-5-2 (given DON!!
 * add power on their owner's turn only). Open question M6b-Q53 (the DON!! count is last-known
 * information): every test K.O.s Hatchan while it holds the DON!!, so the readings agree.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  chr,
  deck,
  donW,
  hand,
  kind,
  mine,
  opponentKingdomCome,
  passBlock,
  passCounter,
  theirsW,
  trash,
  W4,
  cardIds,
} from './kit-w4a.ts';

const HATCHAN = 'OP14-051';
const KC = 'EB01-059';

/** p2's turn: p1's rested Hatchan with `don` DON!! given; p2's Oars (9000) attacks it. */
function battleKo(don: number) {
  const g = theirsW(
    { characters: [{ card: HATCHAN, rested: true, don }] },
    { characters: [W4.oars] },
  );
  const before = { hand: hand(g).length, deck: deck(g).length };
  attack(g, chr(g, 'p2', W4.oars), chr(g, 'p1', HATCHAN));
  passBlock(g);
  if (kind(g) === 'counter') g.act({ type: 'endCounter' });
  return { g, before };
}

describe('OP14-051 Hatchan: [DON!! x2] [On K.O.] draw 1', () => {
  it('printed values: cost 1, 3000 power', () => {
    const g = mine('ST01-001', { hand: [HATCHAN] }, {});
    const c = g.card(at(g, 'p1', 'hand', HATCHAN));
    expect(c.cost).toBe(1);
    expect(c.power).toBe(3000);
  });

  it("K.O.d in battle on the opponent's turn with 2 DON!! given: I draw 1 card", () => {
    const { g, before } = battleKo(2);
    expect(trash(g, 'p1')).toEqual([HATCHAN]);
    expect(hand(g)).toHaveLength(before.hand + 1);
    expect(deck(g)).toHaveLength(before.deck - 1);
  });

  it('boundary: with only 1 DON!! given nothing is drawn', () => {
    const { g, before } = battleKo(1);
    expect(trash(g, 'p1')).toEqual([HATCHAN]);
    expect(hand(g)).toHaveLength(before.hand);
    expect(deck(g)).toHaveLength(before.deck);
  });

  it('with no DON!! given nothing is drawn', () => {
    const { g, before } = battleKo(0);
    expect(trash(g, 'p1')).toEqual([HATCHAN]);
    expect(hand(g)).toHaveLength(before.hand);
  });

  it('more than 2 DON!! still works (3 given) and still draws exactly 1', () => {
    const { g, before } = battleKo(3);
    expect(hand(g)).toHaveLength(before.hand + 1);
    expect(deck(g)).toHaveLength(before.deck - 1);
  });

  it('K.O.d by an opposing effect (Kingdom Come) with 2 DON!! given: I draw 1', () => {
    const g = theirsW(
      { characters: [{ card: HATCHAN, don: 2 }] },
      { hand: [KC], characters: [W4.oars] },
    );
    const before = hand(g).length;
    opponentKingdomCome(g, chr(g, 'p1', HATCHAN));
    expect(trash(g, 'p1')).toContain(HATCHAN);
    expect(hand(g)).toHaveLength(before + 1);
  });

  it('K.O.d by an opposing effect with 1 DON!! given: nothing is drawn', () => {
    const g = theirsW(
      { characters: [{ card: HATCHAN, don: 1 }] },
      { hand: [KC], characters: [W4.oars] },
    );
    const before = hand(g).length;
    opponentKingdomCome(g, chr(g, 'p1', HATCHAN));
    expect(trash(g, 'p1')).toContain(HATCHAN);
    expect(hand(g)).toHaveLength(before);
  });

  it('an attacker that loses the battle is not K.O.d (5000 with 2 DON!! against a rested 7000): nothing is drawn', () => {
    const g = mine(
      'ST01-001',
      { characters: [{ card: HATCHAN, don: 2 }], costArea: { active: 8, rested: 0 } },
      { characters: [{ card: W4.kingdew, rested: true }] },
    );
    const before = { hand: hand(g).length, deck: deck(g).length };
    expect(g.power(chr(g, 'p1', HATCHAN))).toBe(5000);
    attack(g, chr(g, 'p1', HATCHAN), chr(g, 'p2', W4.kingdew));
    passBlock(g);
    passCounter(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([HATCHAN]);
    expect(hand(g)).toHaveLength(before.hand);
    expect(deck(g)).toHaveLength(before.deck);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('an opposing Hatchan K.O.d by my attack makes ITS owner draw, not me', () => {
    const g = mine(
      'ST01-001',
      { characters: [W4.oars] },
      { characters: [{ card: HATCHAN, rested: true, don: 2 }] },
    );
    const mineBefore = hand(g, 'p1').length;
    const theirBefore = hand(g, 'p2').length;
    attack(g, chr(g, 'p1', W4.oars), chr(g, 'p2', HATCHAN));
    passBlock(g);
    passCounter(g);
    expect(trash(g, 'p2')).toEqual([HATCHAN]);
    expect(hand(g, 'p2')).toHaveLength(theirBefore + 1);
    expect(hand(g, 'p1')).toHaveLength(mineBefore);
  });

  it("the K.O.d Hatchan's DON!! return to its owner's cost area rested", () => {
    const { g } = battleKo(2);
    expect(donW(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
  });

  it('the draw is not optional: no yes/no question is asked', () => {
    const { g } = battleKo(2);
    expect(kind(g)).not.toBe('optional');
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('a Hatchan that survives (a weaker attacker) draws nothing', () => {
    const g = theirsW(
      { characters: [{ card: HATCHAN, rested: true, don: 2 }] },
      { characters: [W4.cobra] },
    );
    const before = hand(g).length;
    attack(g, chr(g, 'p2', W4.cobra), chr(g, 'p1', HATCHAN));
    passBlock(g);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([HATCHAN]);
    expect(hand(g)).toHaveLength(before);
  });
});

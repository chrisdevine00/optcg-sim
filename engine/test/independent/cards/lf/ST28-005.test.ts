/**
 * ST28-005 Yamato (Character, Yellow, cost 1, 0 power, Counter +1000, {Land of Wano}).
 *
 * Card text:
 *   [DON!! x2] [Your Turn] This Character gains +3000 power.
 *   [On Play] Look at 5 cards from the top of your deck; reveal up to 1 "Land of Wano" type card
 *   with a cost of 2 or more and add it to your hand. Then, place the rest at the bottom of your
 *   deck in any order.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  deck,
  hand,
  mine,
  minus,
  need,
  none,
  offeredIds,
  pickCards,
  settleOrders,
  tail,
  theirs,
} from '../op17/kit-op17b.ts';
import { hasEvent, kind } from '../kit.ts';
import { act } from '../../helpers.ts';
import { inst, LC, playRaw, SCL } from './kit-lfc.ts';

const YAMATO = 'ST28-005';
const IZO = 'ST28-002'; // Wano, cost 2
const DOJI = 'ST28-001'; // Wano, cost 3
const KIN = 'ST28-003'; // Wano, cost 4

function look(top: string[], beyond: string = SCL.c6) {
  const g = mine(LC.plain, {
    hand: [YAMATO],
    deck: [...top, beyond, ...Array.from({ length: 8 }, () => BLUE)],
    costArea: { active: 1, rested: 0 },
  });
  playRaw(g, YAMATO);
  return g;
}

describe('ST28-005 Yamato: [DON!! x2][Your Turn] +3000 power; [On Play] look at 5, add a "Land of Wano" card of cost 2 or more', () => {
  it('with 2 DON!! given on my turn it has 5000 power (0 printed, +2000 from the DON!!, +3000 from the effect)', () => {
    const g = mine(
      LC.plain,
      { characters: [{ card: YAMATO, don: 2 }], costArea: { active: 4, rested: 0 } },
      {},
    );
    expect(g.power(inst(g, 'p1', 'characters', YAMATO))).toBe(5000);
  });

  it('boundary: with 1 DON!! it has only that DON!! +1000 (no +3000); with none 0', () => {
    for (const don of [0, 1]) {
      const g = mine(
        LC.plain,
        { characters: [{ card: YAMATO, don }], costArea: { active: 4, rested: 0 } },
        {},
      );
      expect(g.power(inst(g, 'p1', 'characters', YAMATO))).toBe(don * 1000);
    }
  });

  it('with 3 DON!! it has 6000 (3000 from the DON!!, +3000 once, not per DON!!)', () => {
    const g = mine(
      LC.plain,
      { characters: [{ card: YAMATO, don: 3 }], costArea: { active: 4, rested: 0 } },
      {},
    );
    expect(g.power(inst(g, 'p1', 'characters', YAMATO))).toBe(6000);
  });

  it('[Your Turn] only: on the opponent turn with 2 DON!! it has 0 power', () => {
    const g = theirs(LC.plain, { characters: [{ card: YAMATO, don: 2 }] }, {});
    expect(g.power(inst(g, 'p1', 'characters', YAMATO))).toBe(0);
  });

  it('[On Play] offers exactly the "Land of Wano" cards of cost 2 or more in the top 5 (Characters and Events); cost 1 ones are not offered', () => {
    const top = [SCL.wano1, IZO, SCL.c3, SCL.wanoEvent2, DOJI];
    const g = look(top);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([IZO, SCL.wanoEvent2, DOJI].sort());
    pickCards(g, [DOJI]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([DOJI]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(SCL.c6);
    expect(tail(deck(g), 4)).toEqual(minus(top, [DOJI]).sort());
  });

  it('boundary: a Land of Wano card with cost exactly 2 is offered; Yamato herself (cost 1) is not', () => {
    const g = look([IZO, YAMATO, SCL.wano1, SCL.c3, SCL.c2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([IZO]);
    pickCards(g, [IZO]);
    settleOrders(g);
    expect(hand(g)).toEqual([IZO]);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const top = [IZO, DOJI, KIN, SCL.c3, SCL.c2];
    const g = look(top);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(SCL.c6);
    expect(tail(deck(g), 5)).toEqual([...top].sort());
  });

  it('takes at most one card even when three qualify', () => {
    const g = look([IZO, DOJI, KIN, SCL.c3, SCL.c2]);
    need(g, 'choose', 'p1');
    pickCards(g, [KIN]);
    settleOrders(g);
    expect(hand(g)).toEqual([KIN]);
  });

  it('only the top 5 are looked at: a qualifying card in position 6 is not offered', () => {
    const g = look([SCL.c2, SCL.c3, SCL.c2, SCL.c3, SCL.c2], DOJI);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(DOJI);
  });

  it('the chosen card is revealed; the others are not', () => {
    const g = look([IZO, DOJI, SCL.c3, SCL.c2, SCL.c4]);
    pickCards(g, [IZO]);
    settleOrders(g);
    expect(hasEvent(g, 'CardRevealed', { card: IZO })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: DOJI })).toBe(false);
  });
});

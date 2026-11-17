/**
 * OP15-061 Ohm (Character, Purple, cost 1, 2000, Counter +1000, {Sky Island}/{Vassals}).
 *
 * Card text:
 *   "[On Play] DON!! −1: Draw 1 card.
 *    [When Attacking] If you have 6 or less DON!! cards on your field, give up to 1 of your
 *    opponent's Characters −1000 power during this turn."
 *
 * Rules: CR 8-3-1-6 (DON!! −1 is optional "may return"; given DON!! count as "on your field",
 * RL-24 / QA-OP01 OP01-091); CR 8-3-1-4; CR 8-4-4-1 ("up to"); CR 7-1-1 ([When Attacking]
 * activates on the attack declaration); CR 4-10-1 (a failed "if" ends the effect).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { donOf, kind, myTurn, offered } from '../kit.ts';
import { C, drive, fieldDon, FILLER, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = C.ohm;

describe('OP15-061 Ohm: [On Play] DON!! −1 → draw 1', () => {
  function game() {
    return myTurn(
      side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }),
      side(C.luffy, FILLER),
    );
  }

  it('happy path: returns 1 DON!! and draws 1', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(14);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 8, active: 2, rested: 0 });
  });

  it('CR 8-3-1-4: declining DON!! −1 draws nothing and returns nothing', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 7, active: 2, rested: 1 });
  });

  it('CR 8-3-1-6: with a single DON!! (rested to play Ohm) it can still be returned to pay DON!! −1', () => {
    const g = myTurn(
      side(C.shanks, FILLER, { hand: [ID], costArea: { active: 1, rested: 0 } }),
      side(C.luffy, FILLER),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', { don: 'costRested' });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(donOf(g, 'p1')).toMatchObject({ deck: 10, active: 0, rested: 0 });
  });
});

describe('OP15-061 Ohm: [When Attacking] 6 or less DON!! on your field → opponent Character −1000', () => {
  function attacking(costActive: number, ohmDon = 0) {
    return myTurn(
      side(C.shanks, FILLER, {
        characters: [{ card: ID, don: ohmDon }],
        costArea: { active: costActive, rested: 0 },
      }),
      side(C.luffy, FILLER, { characters: [V.kingdew, V.sunny] }),
    );
  }

  it('with exactly 6 DON!! on the field (boundary): the chosen Character gets −1000 for the turn', () => {
    const g = attacking(6);
    const t = g.find('p2', 'characters', V.kingdew);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(6000);
  });

  it('with 7 DON!! on the field nothing happens', () => {
    const g = attacking(7);
    const t = g.find('p2', 'characters', V.kingdew);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(7000);
  });

  it('given DON!! count as "on your field": 5 in the cost area + 2 given = 7 → nothing', () => {
    const g = attacking(5, 2);
    expect(fieldDon(g, 'p1')).toBe(7);
    const t = g.find('p2', 'characters', V.kingdew);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(7000);
  });

  it('given DON!! count: 4 in the cost area + 2 given = 6 → works', () => {
    const g = attacking(4, 2);
    const t = g.find('p2', 'characters', V.kingdew);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', { targets: [t] });
    expect(g.power(t)).toBe(6000);
  });

  it('only opponent Characters are offered', () => {
    const g = attacking(3);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual(sorted([V.kingdew, V.sunny]));
  });

  it('"up to 1": may choose none', () => {
    const g = attacking(3);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', { targets: [] });
    expect(g.power(g.find('p2', 'characters', V.kingdew))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', V.sunny))).toBe(3000);
  });

  it('only 1 Character is affected even with several in play', () => {
    const g = attacking(3);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    drive(g, 'p1', {
      targets: [g.find('p2', 'characters', V.kingdew), g.find('p2', 'characters', V.sunny)],
    });
    const total =
      g.power(g.find('p2', 'characters', V.kingdew))! +
      g.power(g.find('p2', 'characters', V.sunny))!;
    expect(total).toBe(9000);
  });

  it('is an attack trigger only: playing Ohm does not give −1000 to anyone', () => {
    const g = myTurn(
      side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', { accept: false });
    expect(g.power(g.find('p2', 'characters', V.kingdew))).toBe(7000);
    expect(offered(g, 'p1')).toBe(false);
  });
});

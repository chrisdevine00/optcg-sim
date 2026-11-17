/**
 * OP15-071 Holly (Character, Purple, cost 3, 4000, Counter +1000, {Animal}/{Sky Island}).
 *
 * Card text:
 *   "All of your [Ohm] cards and this Character gain [Double Attack].
 *    [Opponent's Turn] All of your [Ohm] cards' base power and this Character's base power
 *    become 6000."
 *
 * Rules: CR 10-1-2-1 ([Double Attack] = 2 damage to a Leader); CR 8-1-3-3 (permanent effects);
 * CR 8-3-2-5 ([Opponent's Turn] condition); "base power becomes" replaces printed power, DON!!
 * give +1000 only on their owner's turn (CR 6-5-5-2); CR 7-1-4-1 (attacker wins ties).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, noDefence, passBlock } from '../../helpers.ts';
import { myTurn, theirTurn } from '../kit.ts';
import { C, drive, FILLER, side, V } from './kit-c.ts';

const ID = 'OP15-071';

describe('OP15-071 Holly: Double Attack for this Character and all [Ohm] cards', () => {
  function attacking(chars: NonNullable<Partial<PlayerSpec>['characters']>) {
    return myTurn(
      side(C.shanks, FILLER, { characters: chars, costArea: { active: 3, rested: 0 } }),
      side(C.luffy, FILLER),
    );
  }

  it('Holly (4000 + 1 DON!! = 5000) deals 2 damage to the Leader', () => {
    const g = attacking([{ card: ID, don: 1 }]);
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('an [Ohm] on the field also has Double Attack (2 damage)', () => {
    const g = attacking([ID, { card: C.ohm, don: 3 }]);
    attack(g, g.find('p1', 'characters', C.ohm), g.leader('p2'));
    drive(g, 'p1', {});
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });

  it('another Character without the name [Ohm] does not gain it (1 damage)', () => {
    const g = attacking([ID, { card: V.marco, don: 0 }]);
    attack(g, g.find('p1', 'characters', V.marco), g.leader('p2'));
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('Ohm without Holly on the field has no Double Attack (1 damage)', () => {
    const g = attacking([{ card: C.ohm, don: 3 }]);
    attack(g, g.find('p1', 'characters', C.ohm), g.leader('p2'));
    drive(g, 'p1', {});
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });

  it('Holly alone, with 1 given DON!!, shows the keyword', () => {
    const g = attacking([{ card: ID, don: 1 }]);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
    act(g, { type: 'endTurn' });
  });
});

describe("OP15-071 Holly: [Opponent's Turn] base power of [Ohm] cards and Holly becomes 6000", () => {
  function defending() {
    return theirTurn(
      side(C.shanks, FILLER, { characters: [ID, C.ohm, V.marco] }),
      side(C.luffy, FILLER),
    );
  }

  it("on the opponent's turn Holly (printed 4000) and Ohm (printed 2000) are 6000; a non-Ohm is unchanged", () => {
    const g = defending();
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', C.ohm))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.marco))).toBe(5000);
  });

  it('on my own turn they keep their printed power', () => {
    const g = myTurn(side(C.shanks, FILLER, { characters: [ID, C.ohm] }), side(C.luffy, FILLER));
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', C.ohm))).toBe(2000);
  });

  it('a 6000 Holly beats a 5000 attacker when she blocks nothing: attacker 5000 vs rested Holly 6000 loses', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [{ card: ID, rested: true }] }),
      side(C.luffy, FILLER, { characters: [V.marco] }),
    );
    const holly = g.find('p1', 'characters', ID);
    attack(g, g.find('p2', 'characters', V.marco), holly);
    noDefence(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('a 6000 attacker ties 6000 Holly and K.O.s her (attacker wins ties)', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [{ card: ID, rested: true }] }),
      side(C.luffy, FILLER, { characters: [V.hajrudin] }),
    );
    attack(g, g.find('p2', 'characters', V.hajrudin), g.find('p1', 'characters', ID));
    noDefence(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('modifiers apply on top of the 6000 base: a +1000 Character Counter makes a rested Holly 7000 and she survives a 6000 attacker', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { hand: [V.marco], characters: [{ card: ID, rested: true }] }),
      side(C.luffy, FILLER, { characters: [V.hajrudin] }),
    );
    const holly = g.find('p1', 'characters', ID);
    attack(g, g.find('p2', 'characters', V.hajrudin), holly);
    passBlock(g);
    act(g, { type: 'counter', card: g.find('p1', 'hand', V.marco), target: holly });
    expect(g.power(holly)).toBe(7000);
    act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});

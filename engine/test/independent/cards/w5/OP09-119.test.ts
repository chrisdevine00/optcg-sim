/**
 * OP09-119 Monkey.D.Luffy (Character, Purple, cost 9, 10000, Strike, {Straw Hat Crew}).
 *
 * Card text: "[On Play] You may return 1 or more DON!! cards from your field to your DON!! deck: Draw 1
 * card and this Character gains [Rush] during this turn."
 *
 * Rules: CR 8-3-1 (optional activation cost), CR 8-3-1-6 (DON!! return; given DON!! qualify),
 * CR 10-1-1 ([Rush]: may attack on the turn it is played), CR 6-6-1-3 ("during this turn" ends in the
 * End Phase), CR 3-7-4 (summoning sickness).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { attack, canAttack, decision, endTurn } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  BLUE,
  countOptions,
  donOf,
  LW,
  need,
  no,
  onField,
  put,
  RED,
  returnDon,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'OP09-119';

function start(
  o: { active?: number; leader?: PlayerSpec['leader']; characters?: PlayerSpec['characters'] } = {},
) {
  return myTurn(
    {
      ...side(LW.luffy, BLUE, {
        hand: [ID],
        costArea: { active: o.active ?? 10, rested: 0 },
        ...(o.characters ? { characters: o.characters } : {}),
      }),
      leader: o.leader ?? LW.luffy,
    },
    side(LW.luffy, RED, { characters: [{ card: SW.marco, rested: true }] }),
  );
}

describe('OP09-119 Monkey.D.Luffy: [On Play] you may return 1+ DON!!: draw 1 and gain [Rush] this turn', () => {
  it('pays the cost: draws exactly 1 card and the Character may attack the opponent Leader this turn', () => {
    const g = start();
    const deck = g.zone('p1', 'deck').length;
    put(g, ID);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    yes(g);
    returnDon(g, 1, 'costActive');
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(deck - 1);
    const luffy = g.find('p1', 'characters', ID);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(canAttack(g, luffy, g.leader('p2'))).toBe(true);
    // 10 DON!! on the field, 1 returned.
    expect(onField(g)).toBe(9);
    expect(donOf(g).deck).toBe(1);
  });

  it('declining the cost: no card is drawn, no [Rush], and the new Character cannot attack', () => {
    const g = start();
    put(g, ID);
    no(g);
    expect(decision(g)?.kind).toBe('main');
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    const luffy = g.find('p1', 'characters', ID);
    expect(g.card(luffy).keywords).not.toContain('Rush');
    expect(canAttack(g, luffy, g.leader('p2'))).toBe(false);
    expect(canAttack(g, luffy, g.find('p2', 'characters', SW.marco))).toBe(false);
    expect(onField(g)).toBe(10);
  });

  it('returning more DON!! than 1 still draws only 1 card', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 3, 'costRested');
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(onField(g)).toBe(7);
    expect(donOf(g).deck).toBe(3);
  });

  it('"1 or more": the count offered runs from 1 to every DON!! on the field (10)', () => {
    const g = start();
    put(g, ID);
    yes(g);
    expect(
      countOptions(g)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('DON!! given to my Leader can be returned for the cost', () => {
    const g = start({ leader: { card: LW.luffy, don: 1 }, active: 9 });
    put(g, ID);
    // 9 active paid the cost; 1 DON!! is on the Leader.
    expect(donOf(g)).toMatchObject({ active: 0, rested: 9, given: 1 });
    yes(g);
    returnDon(g, 1, 'given');
    expect(donOf(g)).toMatchObject({ rested: 9, given: 0, deck: 1 });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('[Rush] lets it attack on the turn it is played, and a rested Character as well as the Leader', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    const luffy = g.find('p1', 'characters', ID);
    expect(canAttack(g, luffy, g.find('p2', 'characters', SW.marco))).toBe(true);
    attack(g, luffy, g.leader('p2'));
    expect(decision(g)?.kind).toBe('block');
  });

  it('[Rush] lasts only this turn: on my next turn the keyword is gone', () => {
    const g = start();
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    const luffy = g.find('p1', 'characters', ID);
    expect(g.card(luffy).keywords).not.toContain('Rush');
  });

  it('the opponent field, DON!! and hand are not touched by the effect', () => {
    const g = start();
    const before = donOf(g, 'p2');
    const hand = g.zone('p2', 'hand').length;
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    expect(donOf(g, 'p2')).toEqual(before);
    expect(g.zone('p2', 'hand')).toHaveLength(hand);
  });
});

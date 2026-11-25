/**
 * OP09-076 Roronoa Zoro (Character, Purple, cost 3, 5000, Slash, {Straw Hat Crew}).
 *
 * Card text: "[On Play] You may return 1 or more DON!! cards from your field to your DON!! deck: Add up
 * to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: CR 8-3-1 (activation cost, optional with "may"), CR 8-3-1-6 (DON!! returned to the DON!!
 * deck; DON!! in the cost area, active or rested, and given DON!! qualify), CR 4-8-1 ("up to" allows
 * 0), CR 3-9-3 / 4-4 (an added DON!! set as active is active).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { decision } from '../../helpers.ts';
import { myTurn, side } from '../kit.ts';
import {
  answerCount,
  asksCount,
  BLUE,
  countOptions,
  donOf,
  LW,
  no,
  onField,
  put,
  returnDon,
  RED,
  SW,
  yes,
} from './kit-w5a.ts';

const ID = 'OP09-076';

/** p1 (turn 3) holds Zoro with `active` active DON!! (cost 3 is paid on play). */
function start(
  o: {
    active?: number;
    rested?: number;
    donDeck?: number;
    characters?: PlayerSpec['characters'];
  } = {},
) {
  return myTurn(
    side(LW.luffy, BLUE, {
      hand: [ID],
      costArea: { active: o.active ?? 5, rested: o.rested ?? 0 },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
      ...(o.characters ? { characters: o.characters } : {}),
    }),
    side(LW.luffy, RED, { costArea: { active: 3, rested: 0 } }),
  );
}

describe('OP09-076 Roronoa Zoro: [On Play] you may return 1+ DON!!: add up to 1 DON!! and set it active', () => {
  it('pays 1 active DON!!, then adds 1 DON!! from the DON!! deck set active: the field is as large as before', () => {
    const g = start({ active: 5 });
    put(g, ID);
    // 5 active: 3 rested to play Zoro, 2 active left.
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3, deck: 5 });
    yes(g);
    returnDon(g, 1, 'costActive');
    // The cost is paid; the add asks a count.
    expect(asksCount(g)).toBe(true);
    expect(donOf(g)).toMatchObject({ active: 1, rested: 3, deck: 6 });
    answerCount(g, 1);
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3, deck: 5, given: 0 });
  });

  it('the added DON!! is active, even when a rested DON!! was returned: rested goes down, active up', () => {
    const g = start({ active: 5 });
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costRested');
    answerCount(g, 1);
    expect(donOf(g)).toMatchObject({ active: 3, rested: 2, deck: 5 });
  });

  it('"1 or more": the count question offers 1 up to every DON!! on the field (here 5)', () => {
    const g = start({ active: 5 });
    put(g, ID);
    yes(g);
    expect(
      countOptions(g)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('returning 2 still adds only "up to 1": the field ends one DON!! smaller', () => {
    const g = start({ active: 5 });
    put(g, ID);
    yes(g);
    returnDon(g, 2, 'costActive');
    expect(donOf(g)).toMatchObject({ active: 0, rested: 3, deck: 7 });
    // The add offers at most 1.
    expect(
      countOptions(g)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([0, 1]);
    answerCount(g, 1);
    expect(onField(g)).toBe(4);
    expect(donOf(g)).toMatchObject({ active: 1, rested: 3, deck: 6 });
  });

  it('"up to 1": adding 0 is allowed, and the returned DON!! stay returned', () => {
    const g = start({ active: 5 });
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 0);
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ active: 1, rested: 3, deck: 6 });
  });

  it('declining the cost: nothing is returned or added and Zoro is still played', () => {
    const g = start({ active: 5 });
    put(g, ID);
    no(g);
    expect(decision(g)?.kind).toBe('main');
    expect(donOf(g)).toMatchObject({ active: 2, rested: 3, deck: 5 });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('the DON!! deck may be empty before the cost: the returned DON!! can be the one added', () => {
    const g = start({ active: 10, donDeck: 0 });
    put(g, ID);
    expect(donOf(g).deck).toBe(0);
    yes(g);
    returnDon(g, 1, 'costActive');
    expect(donOf(g).deck).toBe(1);
    answerCount(g, 1);
    expect(donOf(g)).toMatchObject({ active: 7, rested: 3, deck: 0 });
  });

  it('DON!! given to a Character can be returned for the cost (CR 8-3-1-6)', () => {
    const g = start({ active: 3, characters: [{ card: SW.marco, don: 2 }] });
    put(g, ID);
    // 3 active paid Zoro's cost: 0 active, 3 rested, 2 given to Marco.
    expect(donOf(g)).toMatchObject({ active: 0, rested: 3, given: 2 });
    yes(g);
    returnDon(g, 2, 'given');
    answerCount(g, 1);
    expect(g.card(g.find('p1', 'characters', SW.marco)).don).toBe(0);
    expect(donOf(g)).toMatchObject({ active: 1, rested: 3, given: 0 });
  });

  it('only my DON!! are touched: the opponent field and DON!! deck are unchanged', () => {
    const g = start({ active: 5 });
    const before = donOf(g, 'p2');
    put(g, ID);
    yes(g);
    returnDon(g, 1, 'costActive');
    answerCount(g, 1);
    expect(donOf(g, 'p2')).toEqual(before);
  });
});

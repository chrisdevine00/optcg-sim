/**
 * ST34-002 Charlotte Cracker (Purple Character, cost 4, 5000, Counter +1000, Slash, {Big Mom Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Big Mom Pirates} type, add up to 1 DON!! card from your DON!!
 * deck and rest it. Then, K.O. up to 1 of your opponent's Characters with a cost of 2 or less."
 *
 * Rules: CR 8-3-3 and RD 122 (a failed "if" stops the clause that follows, "Then" included), E-Q11
 * ("add up to N DON!!" asks a count), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  asksDonCount,
  atMain,
  BLUE,
  cardIds,
  choices,
  don,
  fill,
  LDB,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SB,
  T,
  takeDon,
  trash,
} from './kit-stb5b.ts';

const CRACKER = T.cracker;

function setup(leader: string, opp: string[], p1: Partial<PlayerSpec> = {}) {
  return mine(
    leader,
    { hand: [CRACKER], deck: fill(BLUE, 15), costArea: { active: 5, rested: 0 }, ...p1 },
    { characters: opp },
  );
}

describe('ST34-002 Cracker: [On Play] BMP Leader: add up to 1 rested DON!!; Then K.O. up to 1 cost-2-or-less Character', () => {
  it('BMP Leader: 1 DON!! is added rested, then the chosen Character is K.O.ed', () => {
    const g = setup(LDB.bmp, [SB.c2p4]);
    playRaw(g, CRACKER);
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    pickCards(g, [SB.c2p4]);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ deck: 4, active: 1, rested: 5 });
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SB.c2p4]);
  });

  it('CR 8-3-3 / RD 122: a Leader without the {Big Mom Pirates} type: no DON!! added and nothing K.O.ed', () => {
    const g = setup(LDB.strike, [SB.c2p4]);
    playRaw(g, CRACKER);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ deck: 5, active: 1, rested: 4 });
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c2p4]);
  });

  it('K.O. cost boundary: cost 2 and 0 are offered, cost 3 is not', () => {
    const g = setup(LDB.bmp, [SB.c2p4, SB.c2p0, SB.c3p5]);
    playRaw(g, CRACKER);
    takeDon(g, 1);
    expect(offeredIds(g)).toEqual([SB.c2p0, SB.c2p4].sort());
  });

  it('"up to 1" K.O.: choosing nobody K.O.s nothing, the DON!! stays added', () => {
    const g = setup(LDB.bmp, [SB.c2p4]);
    playRaw(g, CRACKER);
    takeDon(g, 1);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c2p4]);
    expect(don(g)).toMatchObject({ deck: 4, rested: 5 });
  });

  it('"up to 1" K.O.: at most one target', () => {
    const g = setup(LDB.bmp, [SB.c2p4, SB.c2p0]);
    playRaw(g, CRACKER);
    takeDon(g, 1);
    expect(need(g, 'choose').max).toBe(1);
  });

  it('"up to 1" DON!!: the player may add none', () => {
    const g = setup(LDB.bmp, [SB.c2p4]);
    playRaw(g, CRACKER);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ deck: 5, active: 1, rested: 4 });
  });

  it('the DON!! added is RESTED, not active', () => {
    const g = setup(LDB.bmp, []);
    playRaw(g, CRACKER);
    takeDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(don(g).active).toBe(1);
    expect(don(g).rested).toBe(5);
  });

  it('RD 122: with an empty DON!! deck nothing can be added, and the K.O. still resolves', () => {
    const g = setup(LDB.bmp, [SB.c2p4], { costArea: { active: 10, rested: 0 } });
    playRaw(g, CRACKER);
    expect(asksDonCount(g)).toBe(false);
    expect(choices(g)).toHaveLength(1);
    pickCards(g, [SB.c2p4]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('only opposing Characters can be K.O.ed', () => {
    const g = setup(LDB.bmp, [SB.c2p4], { characters: [SB.c2p0] });
    playRaw(g, CRACKER);
    takeDon(g, 1);
    expect(offeredIds(g)).toEqual([SB.c2p4]);
  });
});

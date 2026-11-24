/**
 * ST33-005 Monkey.D.Garp (Blue Character, cost 6, 6000, Counter +1000, Strike, {Navy}).
 *
 * Card text: "[On Play] If your Leader has the {Navy} type, play up to 1 blue {Navy} type Character card with
 * 8000 power or less other than [Monkey.D.Garp] from your hand."
 *
 * Rules: CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"), play by an effect costs no DON!!, the played
 * Character's own [On Play] fires, filters use printed power and colour, name filter "other than".
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  cardIds,
  choices,
  don,
  fill,
  hand,
  LDB,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playRaw,
  T,
  trash,
  TY,
  SB,
} from './kit-stb5b.ts';

const GARP = T.garp;
const OTHER_GARP = 'OP06-055'; // Monkey.D.Garp: Blue, cost 5, 7000, {Navy}; has a [DON!! x2] [When Attacking] only
const OTHER_GARP2 = 'P-054'; // Monkey.D.Garp: Blue, cost 6, 7000, {Navy}
const HINA = 'EB05-026'; // Hina: Blue, cost 7, 8000, {Navy}

function setup(leader: string, handExtra: string[]) {
  return mine(leader, { hand: [GARP, ...handExtra], deck: fill(BLUE, 15) });
}

describe('ST33-005 Garp: [On Play] Navy Leader: play up to 1 blue Navy Character of 8000 power or less (not Garp) from hand', () => {
  it('Navy Leader: the chosen blue Navy Character enters the field for no DON!!', () => {
    const g = setup(LDB.navy, [TY.blueNavy4]);
    playRaw(g, GARP);
    pickCards(g, [TY.blueNavy4]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([GARP, TY.blueNavy4].sort());
    expect(don(g)).toMatchObject({ active: 4, rested: 6 });
    expect(hand(g)).toEqual([]);
  });

  it('power boundary: 8000 is offered, 10000 is not', () => {
    const g = setup(LDB.navy, [TY.blueNavy8000, TY.blueNavy10000, HINA]);
    playRaw(g, GARP);
    expect(offeredIds(g)).toEqual([HINA, TY.blueNavy8000].sort());
  });

  it('only BLUE Navy: a green Navy and a black Navy Character are not offered', () => {
    const g = setup(LDB.navy, [TY.greenNavy, TY.navy2, TY.blueNavy4]);
    playRaw(g, GARP);
    expect(offeredIds(g)).toEqual([TY.blueNavy4]);
  });

  it('only {Navy}: a blue Character without the type is not offered', () => {
    const g = setup(LDB.navy, [SB.c1p3, TY.blueNavy4]);
    playRaw(g, GARP);
    expect(offeredIds(g)).toEqual([TY.blueNavy4]);
  });

  it('"other than [Monkey.D.Garp]": other cards with that name are not offered', () => {
    const g = setup(LDB.navy, [OTHER_GARP, OTHER_GARP2, GARP, TY.blueNavy4]);
    playRaw(g, GARP);
    expect(offeredIds(g)).toEqual([TY.blueNavy4]);
  });

  it('CR 8-3-3: a Leader without the Navy type: nothing is asked and nothing is played', () => {
    const g = setup(LDB.strike, [TY.blueNavy4]);
    playRaw(g, GARP);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([GARP]);
    expect(hand(g)).toEqual([TY.blueNavy4]);
  });

  it('"up to 1": the player may play nothing', () => {
    const g = setup(LDB.navy, [TY.blueNavy4]);
    playRaw(g, GARP);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([GARP]);
    expect(hand(g)).toEqual([TY.blueNavy4]);
  });

  it('only one card is played, however many qualify', () => {
    const g = setup(LDB.navy, [TY.blueNavy4, TY.blueNavy5]);
    playRaw(g, GARP);
    expect(need(g, 'choose').max).toBe(1);
    pickCards(g, [TY.blueNavy5]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([GARP, TY.blueNavy5].sort());
    expect(hand(g)).toEqual([TY.blueNavy4]);
  });

  it('from the hand only: a qualifying card in the trash is not offered', () => {
    const g = mine(LDB.navy, { hand: [GARP], trash: [TY.blueNavy4], deck: fill(BLUE, 15) });
    playRaw(g, GARP);
    expect(choices(g)).toEqual([]);
    expect(trash(g)).toEqual([TY.blueNavy4]);
  });

  it('the Character played this way has its own [On Play] resolve (Koby: may trash 1 to draw 1)', () => {
    const g = setup(LDB.navy, [T.koby, SB.c1p3]);
    playRaw(g, GARP);
    pickCards(g, [T.koby]);
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g)).toBe(true);
  });
});

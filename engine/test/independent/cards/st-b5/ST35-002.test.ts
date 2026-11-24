/**
 * ST35-002 Lindbergh (Red Character, cost 4, 4000, Counter +2000, Special, {Minks}/{Revolutionary Army}).
 *
 * Card text: "[On Play] Give up to 1 of your opponent's Characters −3000 power during this turn."
 *
 * Rules: CR 8-4-4-1 ("up to"), RL-09 ("during this turn" ends with the turn), power below the
 * printed value is not a K.O. (a Character is K.O.ed by battle or effect only).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  attack,
  BLUE,
  cardIds,
  endTurn,
  fill,
  LDB,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  pickCards,
  playRaw,
  pw,
  SB,
  T,
  trash,
} from './kit-stb5b.ts';

const LIND = T.lindbergh;

function setup(opp: (string | { card: string; rested: boolean })[], p1_hand: string[] = []) {
  return mine(LDB.strike, { hand: [LIND, ...p1_hand], deck: fill(BLUE, 15) }, { characters: opp });
}

describe('ST35-002 Lindbergh: [On Play] give up to 1 opposing Character -3000 power during this turn', () => {
  it('the chosen Character loses 3000 power', () => {
    const g = setup([SB.c6p8, SB.c5p7]);
    playRaw(g, LIND);
    pickCards(g, [SB.c6p8]);
    expect(atMain(g)).toBe(true);
    expect(pw(g, 'p2', SB.c6p8)).toBe(5000);
    expect(pw(g, 'p2', SB.c5p7)).toBe(7000);
  });

  it('"up to 1": at most one target, and choosing nobody changes nothing', () => {
    const g = setup([SB.c6p8, SB.c5p7]);
    playRaw(g, LIND);
    expect(need(g, 'choose').max).toBe(1);
    none(g);
    expect(pw(g, 'p2', SB.c6p8)).toBe(8000);
    expect(pw(g, 'p2', SB.c5p7)).toBe(7000);
  });

  it('only Characters are offered: not the opposing Leader, not own Characters', () => {
    const g = mine(
      LDB.strike,
      { hand: [LIND], characters: [SB.c2p4], deck: fill(BLUE, 15) },
      { characters: [SB.c6p8] },
    );
    playRaw(g, LIND);
    expect(offeredIds(g)).toEqual([SB.c6p8]);
  });

  it('RL-09: the -3000 ends with the turn', () => {
    const g = setup([SB.c6p8]);
    playRaw(g, LIND);
    pickCards(g, [SB.c6p8]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(pw(g, 'p2', SB.c6p8)).toBe(8000);
  });

  it('power 0 is not a K.O.: a 3000 Character lowered to 0 stays on the field', () => {
    const g = setup([SB.c1p3]);
    playRaw(g, LIND);
    pickCards(g, [SB.c1p3]);
    expect(pw(g, 'p2', SB.c1p3)).toBe(0);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p3]);
  });

  it('a Character of power 0 goes below zero (no floor): its power is not above 0', () => {
    const g = setup([SB.c2p0]);
    playRaw(g, LIND);
    pickCards(g, [SB.c2p0]);
    expect(pw(g, 'p2', SB.c2p0)!).toBeLessThanOrEqual(0);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c2p0]);
  });

  it('it counts in battle: a 4000 attacker beats a rested 5000 Character lowered to 2000', () => {
    const g = mine(
      LDB.strike,
      { hand: [LIND], characters: [SB.c2p4], deck: fill(BLUE, 15) },
      { characters: [{ card: SB.c3p5, rested: true }] },
    );
    playRaw(g, LIND);
    pickCards(g, [SB.c3p5]);
    attack(g, g.find('p1', 'characters', SB.c2p4), g.find('p2', 'characters', SB.c3p5));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SB.c3p5]);
  });

  it('control for the test above: without Lindbergh the 4000 attacker does not K.O. the 5000 Character', () => {
    const g = mine(
      LDB.strike,
      { characters: [SB.c2p4], deck: fill(BLUE, 15) },
      { characters: [{ card: SB.c3p5, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', SB.c2p4), g.find('p2', 'characters', SB.c3p5));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c3p5]);
  });

  it('two Lindberghs on the same Character stack to -6000', () => {
    const g = mine(
      LDB.strike,
      { hand: [LIND, LIND], deck: fill(BLUE, 15) },
      { characters: [SB.c6p8] },
    );
    playRaw(g, LIND);
    pickCards(g, [SB.c6p8]);
    playRaw(g, LIND);
    pickCards(g, [SB.c6p8]);
    expect(pw(g, 'p2', SB.c6p8)).toBe(2000);
  });
});

/**
 * OP13-027 Sanji (Character, Green, cost 5, 7000, no Counter; FILM / Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Set up to 2 of your DON!! cards as active.
 *    [End of Your Turn] If your Leader has the "FILM" or "Straw Hat Crew" type, set up to 1 of your
 *    DON!! cards as active."
 *
 * Rules: only rested DON!! can be set active; the [On Play] is unconditional; the [End of Your Turn]
 * condition is checked at the End Phase (CR 6-6-1-1, 4-10-1), once, for 1 DON!!.
 */
import { describe, expect, it } from 'vitest';
import { donOf, drive, endTurn, F, LB, myTurn, play, side } from './kit-b.ts';

const SANJI = 'OP13-027';

describe('OP13-027 [On Play]: set up to 2 DON!! as active', () => {
  function playGame(leader: string) {
    const g = myTurn(
      side(leader, F.green, { hand: [SANJI], costArea: { active: 7, rested: 0 } }),
      side(LB.opp, F.red),
    );
    play(g, g.find('p1', 'hand', SANJI));
    drive(g, 'p1', { picks: [['DON', 'DON']], don: 'costRested' });
    return g;
  }

  it('2 of the 5 rested DON!! become active (2 + 2 = 4 active, 3 rested)', () => {
    const g = playGame(LB.greenShc);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
  });

  it('unconditional: a Leader with neither type gets the same', () => {
    const g = playGame(LB.greenKid);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
  });

  it('exactly 2, not 1 and not 3', () => {
    const g = playGame(LB.greenKid);
    expect(donOf(g, 'p1').active).toBe(4);
  });
});

describe('OP13-027 [End of Your Turn]: if your Leader has "FILM" or "Straw Hat Crew", set up to 1 DON!! active', () => {
  function fieldGame(leader: string, rested = 3) {
    return myTurn(
      side(leader, F.green, { characters: [SANJI], costArea: { active: 0, rested } }),
      side(LB.opp, F.red),
    );
  }

  it('Straw Hat Crew Leader: exactly 1 of 3 rested DON!! becomes active at the end of the turn', () => {
    const g = fieldGame(LB.greenShc);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    endTurn(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('FILM Leader (ST05-001): the "or" holds', () => {
    const g = fieldGame(LB.film);
    endTurn(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 2 });
  });

  it('Leader with neither type (ST02-001): no DON!! is set active', () => {
    const g = fieldGame(LB.greenKid);
    endTurn(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
  });

  it('no rested DON!! to set: nothing happens and nothing breaks', () => {
    const g = fieldGame(LB.greenShc, 0);
    endTurn(g);
    expect(donOf(g, 'p1').rested).toBe(0);
  });

  it('it is checked at the End Phase, not before: no DON!! is set active during the Main Phase', () => {
    const g = fieldGame(LB.greenShc);
    expect(donOf(g, 'p1').active).toBe(0);
  });
});

/**
 * OP14-022 Usopp (Character, Green, cost 4, 5000, Counter +1000; FILM / Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[End of Your Turn] If your Leader has the {FILM} or {Straw Hat Crew} type, set up to 2 of your
 *    DON!! cards as active."
 *
 * Rules: [End of Your Turn] activates in the End Phase of your own turn (CR 6-6-1-1); the condition
 * is checked then (CR 4-10-1); only rested DON!! can be set active; "up to 2".
 */
import { takeMost } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import { donOf, drive, endTurn, F, LB, myTurn, side } from './kit-b.ts';

const USOPP = 'OP14-022';

function game(leader: string, rested = 4, chars: string[] = [USOPP]) {
  return myTurn(
    side(leader, F.green, { characters: chars, costArea: { active: 1, rested } }),
    side(LB.opp, F.red),
  );
}

describe('OP14-022 [End of Your Turn]: if your Leader has FILM or Straw Hat Crew, set up to 2 DON!! active', () => {
  it('Straw Hat Crew Leader: 2 of the 4 rested DON!! become active (1 + 2 = 3 active, 2 rested)', () => {
    const g = game(LB.greenShc);
    endTurn(g);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('FILM Leader (ST05-001): the "or" holds', () => {
    const g = game(LB.film);
    endTurn(g);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
  });

  it('a Leader with neither type (ST02-001): nothing is set active', () => {
    const g = game(LB.greenKid);
    endTurn(g);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
  });

  it('"up to 2": with only 1 rested DON!!, 1 becomes active', () => {
    const g = game(LB.greenShc, 1);
    endTurn(g);
    takeMost(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('it does not happen during the Main Phase, only at the end of the turn', () => {
    const g = game(LB.greenShc);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 4 });
  });

  it('two copies each set up to 2: 4 DON!! become active', () => {
    const g = game(LB.greenShc, 4, [USOPP, USOPP]);
    endTurn(g);
    drive(g, 'p1'); // simultaneous effects: order, then each asks a count (most first)
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 0 });
  });
});

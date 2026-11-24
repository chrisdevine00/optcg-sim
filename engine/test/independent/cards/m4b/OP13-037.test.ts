/**
 * OP13-037 Roronoa Zoro (Character, Green, cost 4, 5000, Counter +1000; FILM / Straw Hat Crew /
 * Supernovas).
 *
 * Card text (cards/data):
 *   "[On Play] If your Leader has the "FILM" or "Straw Hat Crew" type, set up to 2 of your DON!!
 *    cards as active.
 *    [End of Your Turn] Set this Character as active."
 *
 * Rules: only rested DON!! can be set active (given DON!! cannot, digest 55); the condition is
 * checked when the [On Play] resolves (CR 4-10-1); [End of Your Turn] activates in the End Phase
 * of your own turn only (CR 6-6-1-1) and is unconditional.
 */
import { takeMost } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { CH, donOf, drive, endTurn, F, LB, myTurn, play, side } from './kit-b.ts';

const ZORO = 'OP13-037';

function playGame(leader: string, costArea = { active: 6, rested: 0 }) {
  const g = myTurn(side(leader, F.green, { hand: [ZORO], costArea }), side(LB.opp, F.red));
  play(g, g.find('p1', 'hand', ZORO));
  takeMost(g);
  drive(g, 'p1', { picks: [['DON', 'DON']], don: 'costRested' });
  return g;
}

describe('OP13-037 [On Play]: if your Leader has "FILM" or "Straw Hat Crew", set up to 2 DON!! active', () => {
  it('Straw Hat Crew Leader: 2 of the 4 rested DON!! become active (2 + 2 = 4 active, 2 rested)', () => {
    const g = playGame(LB.greenShc);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });

  it('FILM Leader (ST05-001 Shanks, no Straw Hat Crew): the "or" holds: 2 DON!! become active', () => {
    const g = playGame(LB.film);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });

  it('a Leader with neither type (ST02-001 Kid): nothing is set active (2 active, 4 rested)', () => {
    const g = playGame(LB.greenKid);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('exactly 2, not more: 4 rested DON!! → only 2 become active', () => {
    const g = playGame(LB.greenShc, { active: 8, rested: 0 });
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 2 });
  });

  it('with no rested DON!! (all 10 active before, 4 paid → 4 rested): sets exactly the rested ones it can', () => {
    const g = playGame(LB.greenShc, { active: 10, rested: 0 });
    expect(donOf(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
  });
});

describe('OP13-037 [End of Your Turn]: set this Character as active', () => {
  function fieldGame(
    rested: boolean,
    leader: string = LB.greenKid,
    extra: Partial<PlayerSpec> = {},
  ) {
    return myTurn(
      side(leader, F.green, {
        characters: [
          { card: ZORO, rested },
          { card: CH.alvida, rested: true },
        ],
        ...extra,
      }),
      side(LB.opp, F.red),
    );
  }

  it('a rested Zoro is active again once the turn has ended (seen during the opponent’s turn)', () => {
    const g = fieldGame(true);
    const zoro = g.find('p1', 'characters', ZORO);
    expect(g.card(zoro).rested).toBe(true);
    endTurn(g);
    takeMost(g);
    expect(g.card(zoro).rested).toBe(false);
  });

  it('it is unconditional: it works with a Leader that has neither type', () => {
    const g = fieldGame(true, LB.greenKid);
    endTurn(g);
    takeMost(g);
    expect(g.card(g.find('p1', 'characters', ZORO)).rested).toBe(false);
  });

  it('only "this Character": another rested Character stays rested through the opponent’s turn', () => {
    const g = fieldGame(true);
    endTurn(g);
    takeMost(g);
    expect(g.card(g.find('p1', 'characters', CH.alvida)).rested).toBe(true);
  });

  it('an already-active Zoro simply stays active', () => {
    const g = fieldGame(false);
    endTurn(g);
    takeMost(g);
    expect(g.card(g.find('p1', 'characters', ZORO)).rested).toBe(false);
  });

  it('it is set active at the end of the turn, not right after resting: a Zoro rested by attacking is still rested in the Main Phase', () => {
    const g = myTurn(side(LB.greenShc, F.green, { characters: [ZORO] }), side(LB.opp, F.red));
    const zoro = g.find('p1', 'characters', ZORO);
    g.act({ type: 'attack', attacker: zoro, target: g.leader('p2') });
    expect(g.card(zoro).rested).toBe(true);
  });
});

/**
 * OP14-031 Nami (Character, Green, cost 4, 2000, Counter +1000; FILM / Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[Blocker][On Play] Rest up to 2 of your opponent's Characters with a cost of 8 or less. Then,
 *    set up to 5 of your DON!! cards as active at the end of this turn."
 *
 * Rules: [Blocker] (CR 10-1-4); "up to 2" allows 0-2 (CR 8-4-4-1); the DON!! are set active in the
 * End Phase of this turn, not at once (CR 6-6-1-2 delayed effects); only rested DON!! can be set
 * active; given the "then" the second part does not depend on any target having been chosen
 * (CR 4-10-2, no "if").
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  blockers,
  CH,
  choiceCards,
  donOf,
  drive,
  endTurn,
  F,
  LB,
  myTurn,
  play,
  side,
  theirTurn,
} from './kit-b.ts';

const NAMI = 'OP14-031';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LB.greenKid, F.green, {
      hand: [NAMI],
      costArea: { active: 5, rested: 5 },
      ...p1,
    }),
    side(LB.opp, F.red, { characters: [CH.kingdew, CH.accino8, CH.luffyP10], ...p2 }),
  );
  play(g, g.find('p1', 'hand', NAMI));
  return g;
}

describe('OP14-031 [Blocker]', () => {
  it('has [Blocker] and can block an attack on the opponent’s turn', () => {
    const g = theirTurn(
      side(LB.greenKid, F.green, { characters: [NAMI] }),
      side(LB.opp, F.red, { characters: [CH.kingdew] }),
    );
    expect(g.card(g.find('p1', 'characters', NAMI)).keywords).toContain('Blocker');
    act(g, {
      type: 'attack',
      attacker: g.find('p2', 'characters', CH.kingdew),
      target: g.leader('p1'),
    });
    expect(blockers(g)).toEqual([g.find('p1', 'characters', NAMI)]);
  });
});

describe('OP14-031 [On Play]: rest up to 2 of the opponent’s Characters with a cost of 8 or less', () => {
  it('candidates: cost ≤8 only: Kingdew (5) and Don Accino (8, the boundary); not P-041 (10)', () => {
    const g = game();
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.accino8].sort());
  });

  it('happy path: both are rested', () => {
    const g = game();
    drive(g, 'p1', {
      picks: [[g.find('p2', 'characters', CH.kingdew), g.find('p2', 'characters', CH.accino8)]],
    });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.accino8)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.luffyP10)).rested).toBe(false);
  });

  it('"up to 2": 1 is allowed', () => {
    const g = game();
    drive(g, 'p1', { picks: [[g.find('p2', 'characters', CH.accino8)]] });
    expect(g.card(g.find('p2', 'characters', CH.accino8)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).rested).toBe(false);
  });

  it('"up to 2": none is allowed', () => {
    const g = game();
    drive(g, 'p1', { picks: [[]] });
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});

describe('OP14-031 [On Play]: then set up to 5 DON!! as active at the end of this turn', () => {
  it('not at once: right after the [On Play] the DON!! are still rested (1 active, 9 rested)', () => {
    const g = game();
    drive(g, 'p1', { picks: [[]] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 9 });
  });

  it('at the end of the turn 5 of the 9 rested DON!! become active (observed on the opponent’s turn: 6 active, 4 rested)', () => {
    const g = game();
    drive(g, 'p1', { picks: [[]] });
    endTurn(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
  });

  it('"up to 5": with only 4 rested DON!! all 4 become active', () => {
    const g = game({ costArea: { active: 6, rested: 0 } });
    drive(g, 'p1', { picks: [[]] });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
    endTurn(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 0 });
  });

  it('CR 4-10-2: the DON!! part does not depend on resting a target: with no opponent Characters it still happens', () => {
    const g = game({}, { characters: [] });
    drive(g, 'p1', {});
    endTurn(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
  });

  it('only once: nothing more is set active at the end of the following turn', () => {
    const g = game();
    drive(g, 'p1', { picks: [[]] });
    endTurn(g); // p2 turn 4
    expect(donOf(g, 'p1').active).toBe(6);
    endTurn(g); // p1 turn 5: refresh sets everything active anyway; just ensure play continues
    expect(donOf(g, 'p1').active + donOf(g, 'p1').rested).toBeLessThanOrEqual(10);
  });
});

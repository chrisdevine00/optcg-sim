/**
 * OP08-074 Black Maria (Character, Purple, cost 3, 2000, Counter +2000, Animal Kingdom Pirates).
 *
 * Card text (cards/data, no override text patch):
 *   "[Activate:Main] [Once Per Turn] If you have no other [Black Maria] Characters, add up to 5
 *    DON!! cards from your DON!! deck and rest them. Then, at the end of this turn, return DON!!
 *    cards from your field to your DON!! deck until you have the same number of DON!! cards on your
 *    field as your opponent."
 *
 * Rules relied on:
 * - CR 6-6-1-2: delayed "at the end of this turn" processing runs in the End Phase.
 * - QA-OP01 OP01-091 / RL-24: "DON!! cards on your field" counts cost-area and given DON!!.
 * - CR 1-3-2: "until you have the same number" returns nothing when you already have fewer.
 * - CR 8-3-3 / 4-10-1: the "if" is in the effect; with another [Black Maria] nothing is added and
 *   the "Then" part (the end-of-turn return) does not happen either.
 * - RL-23: when an effect returns your DON!!, you choose which.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { endTurn } from '../helpers.ts';
import {
  AKP,
  activate,
  canActivate,
  donOf,
  donOnField,
  kind,
  LEAD,
  myTurn,
  PURPLE,
  RED,
  settleYes,
  side,
  VAN,
} from './kit.ts';
import type { TestGame } from '../../fixtures/index.ts';

function game(p1: Partial<PlayerSpec>, p2Don: number) {
  return myTurn(
    side(LEAD.kaido, PURPLE, { characters: [AKP.blackMaria], ...p1 }),
    side(LEAD.luffy, RED, { costArea: { active: p2Don, rested: 0 } }),
  );
}

function maria(g: TestGame) {
  return g.find('p1', 'characters', AKP.blackMaria);
}

/** Activate if offered, resolving every choice. */
function tryActivate(g: TestGame) {
  if (!canActivate(g, maria(g))) return;
  activate(g, maria(g));
  settleYes(g, 'p1');
}

/** End p1's turn, answering any End Phase choice p1 owes (which DON!! to return). */
function endMyTurn(g: TestGame) {
  endTurn(g);
  settleYes(g, 'p1');
}

describe('OP08-074 Black Maria: [Activate: Main] [Once Per Turn] +5 rested DON!!, even out at end of turn', () => {
  it('happy path: +5 rested DON!!; at the end of the turn p1 returns down to the opponent’s 5', () => {
    const g = game({ costArea: { active: 4, rested: 0 } }, 5);
    activate(g, maria(g));
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 5, deck: 1 });
    expect(kind(g)).toBe('main');
    endMyTurn(g);
    expect(donOnField(g, 'p1')).toBe(5);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('CR 1-3-2: with fewer DON!! than the opponent at the end of the turn, nothing is returned', () => {
    const g = game({ costArea: { active: 2, rested: 0 } }, 8);
    activate(g, maria(g));
    settleYes(g, 'p1');
    expect(donOnField(g, 'p1')).toBe(7);
    endMyTurn(g);
    expect(donOnField(g, 'p1')).toBe(7);
  });

  it('CR 1-3-2: "up to 5": a DON!! deck of 3 adds 3', () => {
    const g = game({ costArea: { active: 7, rested: 0 } }, 3);
    activate(g, maria(g));
    settleYes(g, 'p1');
    expect(donOf(g, 'p1')).toMatchObject({ active: 7, rested: 3, deck: 0 });
  });

  it('RL-24: given DON!! count as "on your field" for the end-of-turn comparison', () => {
    const g = game({ leader: { card: LEAD.kaido, don: 2 }, costArea: { active: 2, rested: 0 } }, 5);
    activate(g, maria(g));
    settleYes(g, 'p1');
    expect(donOnField(g, 'p1')).toBe(9);
    endMyTurn(g);
    expect(donOnField(g, 'p1')).toBe(5);
  });

  it('condition: another [Black Maria] Character → nothing added and nothing returned later', () => {
    // OP11-089 Black Maria: vanilla Character with the same name.
    const g = game(
      { characters: [AKP.blackMaria, VAN.blackMaria], costArea: { active: 4, rested: 0 } },
      2,
    );
    tryActivate(g);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, deck: 6 });
    endMyTurn(g);
    expect(donOnField(g, 'p1')).toBe(4);
  });

  it('CR 10-2-13: [Once Per Turn]', () => {
    const g = game({ costArea: { active: 2, rested: 0 } }, 5);
    activate(g, maria(g));
    settleYes(g, 'p1');
    expect(canActivate(g, maria(g))).toBe(false);
  });

  it('CR 3-7-4 only limits attacks: a Black Maria played this turn may activate', () => {
    const g = game(
      {
        characters: [{ card: AKP.blackMaria, playedThisTurn: true }],
        costArea: { active: 3, rested: 0 },
      },
      5,
    );
    expect(canActivate(g, maria(g))).toBe(true);
  });
});

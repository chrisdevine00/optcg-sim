/**
 * OP18-077 White Hobby Horse 1 (Stage, Purple, cost 5, type Straw Hat Crew).
 *
 * Card text (cards/data):
 *   "[On Play] Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck.
 *    [Activate: Main] You may rest this Stage: Up to 1 of your {Straw Hat Crew} type Characters
 *    gains [Rush: Character] during this turn."
 *
 * Rules: CR 3-7-4 (a Character played this turn cannot attack); [Rush: Character] (CR 10-1-?) lets
 * it attack Characters, not the Leader, the turn it is played; "up to" CR 8-4-4-1; "during this
 * turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, attackTargets, play, takeMost } from '../../helpers.ts';
import {
  activate,
  canActivate,
  canAttackAny,
  choiceCards,
  choose,
  chooseNone,
  donOf,
  kind,
  LEAD,
  myTurn,
  PURPLE,
  RED,
  settleYes,
  side,
  sortedIds,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HORSE = 'OP18-077';
/** Vanilla {Straw Hat Crew} Characters: P-015 Sunny-Kun 3000, ST01-010 Franky 6000. */
const SHC_A = 'P-015';
const SHC_B = 'ST01-010';

const fresh = (card: string) => ({ card, playedThisTurn: true });

function onField(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return myTurn(
    side(LEAD.kaido, PURPLE, {
      stage: HORSE,
      characters: [fresh(SHC_A), fresh(SHC_B), fresh(VAN.marco)],
      costArea: { active: 2, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [{ card: VAN.kingdew, rested: true }], ...p2 }),
  );
}

const stageOf = (g: TestGame) => g.find('p1', 'stage', HORSE);
const shcA = (g: TestGame) => g.find('p1', 'characters', SHC_A);

describe('OP18-077 White Hobby Horse 1: [On Play] draw 1, then add up to 1 rested DON!!', () => {
  it('playing it draws the top card and adds 1 rested DON!!', () => {
    const g = myTurn(
      side(LEAD.kaido, PURPLE, {
        hand: [HORSE],
        deck: [VAN.marco, ...Array(10).fill(PURPLE)],
        costArea: { active: 5, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    play(g, g.find('p1', 'hand', HORSE));
    takeMost(g);
    settleYes(g, 'p1');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.marco]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 6, deck: 4 });
    expect(kind(g)).toBe('main');
  });
});

describe('OP18-077 White Hobby Horse 1: [Activate: Main] rest it → a {Straw Hat Crew} Character gains [Rush: Character]', () => {
  it('without the effect a Character played this turn cannot attack', () => {
    const g = onField();
    expect(canAttackAny(g, shcA(g))).toBe(false);
  });

  it('happy path: the chosen Crew Character gains [Rush: Character] and can attack the opposing Character, not the Leader', () => {
    const g = onField();
    activate(g, stageOf(g));
    choose(g, [shcA(g)]);
    expect(g.card(shcA(g)).keywords).toContain('Rush: Character');
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(attackTargets(g, shcA(g))).toEqual([g.find('p2', 'characters', VAN.kingdew)]);
    expect(attackTargets(g, shcA(g))).not.toContain(g.leader('p2'));
  });

  it('only {Straw Hat Crew} Characters are offered: the non-Crew vanilla Character is not', () => {
    const g = onField();
    activate(g, stageOf(g));
    expect(choiceCards(g)).toEqual([SHC_A, SHC_B].sort());
    chooseNone(g);
  });

  it('only your own Characters are offered', () => {
    const g = onField({ characters: [fresh(SHC_A)] }, { characters: [fresh(SHC_B)] });
    activate(g, stageOf(g));
    expect(choiceCards(g)).toEqual([SHC_A]);
    chooseNone(g);
  });

  it('"up to 1": only the chosen Character gets it; the other Crew Character still cannot attack', () => {
    const g = onField();
    activate(g, stageOf(g));
    choose(g, [shcA(g)]);
    const other = g.find('p1', 'characters', SHC_B);
    expect(g.card(other).keywords).not.toContain('Rush: Character');
    expect(canAttackAny(g, other)).toBe(false);
  });

  it('"up to 1": choosing nobody is allowed; the Stage is still rested', () => {
    const g = onField();
    activate(g, stageOf(g));
    chooseNone(g);
    expect(g.card(stageOf(g)).rested).toBe(true);
    expect(canAttackAny(g, shcA(g))).toBe(false);
  });

  it('a rested Stage cannot pay the rest cost: it cannot be activated', () => {
    const g = onField({ stage: { card: HORSE, rested: true } });
    expect(canActivate(g, stageOf(g))).toBe(false);
  });

  it('the Stage costs no DON!!: it can be activated with none in the cost area', () => {
    const g = onField({ costArea: { active: 0, rested: 0 } });
    expect(canActivate(g, stageOf(g))).toBe(true);
  });

  it('"during this turn": the keyword is gone on the opponent’s turn', () => {
    const g = onField();
    activate(g, stageOf(g));
    choose(g, [shcA(g)]);
    act(g, { type: 'endTurn' });
    expect(g.card(shcA(g)).keywords).not.toContain('Rush: Character');
  });
});

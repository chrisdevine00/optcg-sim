/**
 * OP18-072 The Franky Family (Character, Purple, cost 5, 6000, Counter +1000, [Blocker], types
 * Water Seven / The Franky Family).
 *
 * Card text (cards/data):
 *   "[Blocker]
 *    [Activate: Main] [Once Per Turn] You may K.O. 1 of your Stages with a cost of 5 or less: If this
 *    Character was played on this turn, give up to 1 of your opponent's Characters −3000 power
 *    during this turn."
 *
 * Rules: CR 8-3-1 (a cost must be payable to activate); the "If" after the colon is an effect
 * condition, so the cost is paid even when the check fails (CR 4-10-1); [Once Per Turn] CR 10-2-13;
 * "up to" CR 8-4-4-1; "during this turn" ends at the end of the turn. K.O.ing your own Stage as a
 * cost is a real K.O. (it goes to your trash).
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import {
  accept,
  abilities,
  canActivate,
  choiceCards,
  chooseNone,
  choose,
  count,
  kind,
  LEAD,
  myTurn,
  offered,
  payWith,
  PURPLE,
  RED,
  side,
  sortedIds,
  VAN,
} from '../kit.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const FF = 'OP18-072';
/** OP05-040 Birdcage: Stage, cost 5. OP06-041 The Ark Noah: Stage, cost 6. ST01-017 Thousand Sunny: Stage, cost 1. */
const STAGE5 = 'OP05-040';
const STAGE6 = 'OP06-041';
const STAGE1 = 'ST01-017';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return myTurn(
    side(LEAD.kaido, PURPLE, {
      characters: [{ card: FF, playedThisTurn: true }],
      stage: STAGE5,
      costArea: { active: 5, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { characters: [VAN.marco, VAN.kingdew], ...p2 }),
  );
}

const ff = (g: TestGame) => g.find('p1', 'characters', FF);

/** Activate, pay the Stage K.O. (picked if asked). */
function use(g: TestGame): void {
  const player = g.decider;
  const [ability] = abilities(g, ff(g));
  act(g, { type: 'activate', card: ff(g), ability: ability! });
  if (offered(g, player)) accept(g);
  if (kind(g) === 'choose' && g.zone('p1', 'stage').length)
    payWith(g, [g.zone('p1', 'stage')[0]!.instance]);
}

describe('OP18-072 The Franky Family: [Activate: Main] K.O. own Stage (cost ≤5) → −3000 if played this turn', () => {
  it('happy path: played this turn, K.O. a cost-5 Stage, an opposing Character gets −3000 power', () => {
    const g = game();
    use(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', VAN.kingdew)]);
    expect(g.power(g.find('p2', 'characters', VAN.kingdew))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(5000);
    expect(count(g, 'p1', 'stage')).toBe(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([STAGE5]);
  });

  it('really played this turn (from hand), not placed by the scenario: the effect works', () => {
    const g = game({ hand: [FF], characters: [] });
    play(g, g.find('p1', 'hand', FF));
    expect(canActivate(g, ff(g))).toBe(true);
    use(g);
    choose(g, [g.find('p2', 'characters', VAN.marco)]);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(2000);
  });

  it('cost boundary: a Stage with cost 6 cannot be the K.O. cost, so the ability is not offered', () => {
    const g = game({ stage: STAGE6 });
    expect(canActivate(g, ff(g))).toBe(false);
    expect(g.zone('p1', 'stage')).toHaveLength(1);
  });

  it('cost boundary: a Stage with cost 1 (well under 5) can be K.O.ed', () => {
    const g = game({ stage: STAGE1 });
    expect(canActivate(g, ff(g))).toBe(true);
    use(g);
    choose(g, [g.find('p2', 'characters', VAN.marco)]);
    expect(count(g, 'p1', 'stage')).toBe(0);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(2000);
  });

  it('with no Stage the cost cannot be paid: the ability is not offered', () => {
    const g = game({ stage: undefined });
    expect(canActivate(g, ff(g))).toBe(false);
  });

  it('"If this Character was played on this turn": not played this turn, the Stage is still K.O.ed but nothing is reduced', () => {
    const g = game({ characters: [FF] });
    expect(canActivate(g, ff(g))).toBe(true);
    use(g);
    if (kind(g) === 'choose') chooseNone(g);
    expect(count(g, 'p1', 'stage')).toBe(0);
    expect(g.power(g.find('p2', 'characters', VAN.kingdew))).toBe(7000);
    expect(g.power(g.find('p2', 'characters', VAN.marco))).toBe(5000);
  });

  it('[Once Per Turn]: after one use it cannot be activated again, even with another Stage', () => {
    const g = game();
    use(g);
    choose(g, [g.find('p2', 'characters', VAN.marco)]);
    expect(canActivate(g, ff(g))).toBe(false);
  });

  it('"up to 1": the −3000 may be given to no one, and the Stage stays K.O.ed', () => {
    const g = game();
    use(g);
    chooseNone(g);
    expect(count(g, 'p1', 'stage')).toBe(0);
    expect(g.power(g.find('p2', 'characters', VAN.kingdew))).toBe(7000);
  });

  it('only the opponent’s Characters are offered as targets, not your own', () => {
    const g = game({ characters: [{ card: FF, playedThisTurn: true }, VAN.sai] });
    use(g);
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.kingdew].sort());
    chooseNone(g);
  });

  it('"during this turn": the −3000 is gone on the opponent’s turn', () => {
    const g = game();
    use(g);
    const king = g.find('p2', 'characters', VAN.kingdew);
    choose(g, [king]);
    expect(g.power(king)).toBe(4000);
    act(g, { type: 'endTurn' });
    expect(g.power(king)).toBe(7000);
  });

  it('it has [Blocker]', () => {
    const g = game();
    expect(g.card(ff(g)).keywords).toContain('Blocker');
  });
});

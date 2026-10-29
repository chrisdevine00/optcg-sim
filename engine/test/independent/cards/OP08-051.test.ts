/**
 * OP08-051 Buckin (Character, Blue, cost 1, 2000, Counter +1000, type Former Rocks Pirates).
 *
 * Card text (cards/data):
 *   "[Your Turn] [On Play] Up to 1 of your [Edward Weevil] cards gains +2000 power during this turn."
 *
 * Rules: [Edward Weevil] is an exact name (CR 2-1-2); "cards" here means your Leader or Characters
 * on the field, the only cards with power (CR 2-6-2). [Your Turn] is a condition (CR 8-3-2-4); this
 * deck has no way to play Buckin on the opponent's turn, so the failing side of [Your Turn] is not
 * testable here (see the report). "During this turn" ends at End Phase step 6-6-1-3 (RL-09).
 * ST03-002 Edward Weevil: Blue, cost 3, 5000, vanilla.
 */
import { describe, expect, it } from 'vitest';
import { type PlayerSpec } from '@optcg/engine';
import { decision, endTurn, play } from '../helpers.ts';
import {
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  LEAD,
  myTurn,
  RED,
  ROCKS,
  side,
  VAN,
} from './kit.ts';

function game(p1: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(LEAD.rocks, BLUE, {
      hand: [ROCKS.buckin],
      characters: [VAN.weevil, VAN.mohji],
      costArea: { active: 1, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
  play(g, g.find('p1', 'hand', ROCKS.buckin));
  return g;
}

describe('OP08-051 Buckin: [Your Turn] [On Play] an [Edward Weevil] gains +2000 during this turn', () => {
  it('happy path: Edward Weevil goes from 5000 to 7000', () => {
    const g = game();
    const weevil = g.find('p1', 'characters', VAN.weevil);
    choose(g, [weevil]);
    expect(g.power(weevil)).toBe(7000);
  });

  it('CR 2-1-2: target restriction is the exact name [Edward Weevil] (not Mohji, not Buckin, not the Leader)', () => {
    const g = game();
    expect(choiceCards(g)).toEqual([VAN.weevil]);
  });

  it('two Edward Weevils: either may be chosen, but only one gains +2000', () => {
    const g = game({ characters: [VAN.weevil, VAN.weevil] });
    expect(choiceCards(g)).toEqual([VAN.weevil, VAN.weevil]);
    choose(g, [g.find('p1', 'characters', VAN.weevil, 1)]);
    expect(g.power(g.find('p1', 'characters', VAN.weevil, 0))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', VAN.weevil, 1))).toBe(7000);
  });

  it('"during this turn": the +2000 is gone on the opponent’s turn', () => {
    const g = game();
    const weevil = g.find('p1', 'characters', VAN.weevil);
    choose(g, [weevil]);
    endTurn(g);
    expect(g.power(weevil)).toBe(5000);
  });

  it('CR 8-4-4-1: choosing none changes nothing', () => {
    const g = game();
    chooseNone(g);
    expect(g.power(g.find('p1', 'characters', VAN.weevil))).toBe(5000);
  });

  it('with no Edward Weevil in play, nothing is asked and the Main Phase continues', () => {
    const g = game({ characters: [VAN.mohji] });
    if (decision(g)?.kind === 'choose') expect(choiceCards(g)).toEqual([]);
    else expect(decision(g)).toMatchObject({ kind: 'main', player: 'p1' });
  });
});

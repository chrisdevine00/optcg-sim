/**
 * ST21-014 Monkey.D.Luffy (Character, Red, cost 5, 6000, no Counter; Straw Hat Crew / The Four
 * Emperors).
 *
 * Card text (cards/data):
 *   "[Rush] (This card can attack on the turn in which it is played.)
 *    [When Attacking] Give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: [Rush] lets it attack the turn it is played (CR 10-1-1); [When Attacking] activates when it
 * declares an attack (CR 10-2-?); only a rested DON!! in the cost area can be given (CR 6-5-5, RL-35);
 * each given DON!! is +1000 power on its owner's turn (CR 6-5-5-2); "up to 1" allows none.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canAttackAny,
  CH,
  choiceCards,
  donOf,
  drive,
  F,
  kind,
  LB,
  myTurn,
  noDefence,
  side,
} from './kit-b.ts';
import type { PlayerSpec } from '@optcg/engine';

const LUFFY = 'ST21-014';

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LB.redShc, F.red, {
      characters: [{ card: LUFFY, playedThisTurn: true }, CH.robin],
      costArea: { active: 1, rested: 2 },
      ...p1,
    }),
    side(LB.opp, F.red),
  );
}

describe('ST21-014 [Rush]', () => {
  it('it can attack the turn it is played (CR 10-1-1); control: a vanilla 6000 Character played this turn cannot', () => {
    const g = game({
      characters: [
        { card: LUFFY, playedThisTurn: true },
        { card: CH.hajrudin, playedThisTurn: true },
      ],
    });
    expect(canAttackAny(g, g.find('p1', 'characters', LUFFY))).toBe(true);
    expect(canAttackAny(g, g.find('p1', 'characters', CH.hajrudin))).toBe(false);
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).toContain('Rush');
  });
});

describe('ST21-014 [When Attacking]: give up to 1 rested DON!! to your Leader or 1 of your Characters', () => {
  function attackAndDrive(g: ReturnType<typeof game>, picks: string[][]) {
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    drive(g, 'p1', { picks });
  }

  it('happy path: a rested DON!! goes to the Leader (1 rested left, 1 given)', () => {
    const g = game();
    attackAndDrive(g, [[g.leader('p1')]]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, rested: 1, given: 1 });
  });

  it('it may go to Luffy itself: 6000 → 7000 during the attack', () => {
    const g = game();
    const luffy = g.find('p1', 'characters', LUFFY);
    attackAndDrive(g, [[luffy]]);
    expect(g.card(luffy).don).toBe(1);
    expect(g.power(luffy)).toBe(7000);
  });

  it('it may go to another Character (Robin 5000 → 6000)', () => {
    const g = game();
    const robin = g.find('p1', 'characters', CH.robin);
    attackAndDrive(g, [[robin]]);
    expect(g.power(robin)).toBe(6000);
  });

  it('candidates: your Leader and your Characters, not the opponent’s', () => {
    const g = myTurn(
      side(LB.redShc, F.red, {
        characters: [{ card: LUFFY, playedThisTurn: true }, CH.robin],
        costArea: { active: 1, rested: 2 },
      }),
      side(LB.opp, F.red, { characters: [CH.marco] }),
    );
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    expect(choiceCards(g)).toEqual([LB.redShc, LUFFY, CH.robin].sort());
  });

  it('only a rested DON!! is given: with only an active DON!! in the cost area nothing is given', () => {
    const g = game({ costArea: { active: 2, rested: 0 } });
    attackAndDrive(g, [[g.leader('p1')]]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, given: 0 });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  // DISAGREEMENTS-b.md B-1: "up to 1 rested DON!!" - the engine forces a recipient and gives the DON!!.
  it.fails('CR 8-4-4-1: "up to 1": giving nothing is allowed', () => {
    const g = game();
    attackAndDrive(g, [[]]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
    expect(kind(g)).toBe('block');
  });

  it('only 1 DON!! is given per attack', () => {
    const g = game({ costArea: { active: 0, rested: 3 } });
    attackAndDrive(g, [[g.leader('p1')]]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 1 });
  });

  it('the attack still resolves afterwards (p2 does not defend: p2 loses 1 Life)', () => {
    const g = game();
    attackAndDrive(g, [[g.leader('p1')]]);
    noDefence(g);
    expect(g.life('p2')).toBe(3);
  });
});

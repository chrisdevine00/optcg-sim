/**
 * OP18-029 Tony Tony.Chopper (Green Character, cost 9, 6000, {Animal}/{Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Rush]
 *    [When Attacking] [Once Per Turn] Give up to 3 rested DON!! cards to your Leader and set this
 *    Character as active. Then, this Character will not become active in your next Refresh Phase."
 *
 * Reading: Rush. On attack (once per turn) take up to 3 rested DON!! from the cost area and give
 * them to your Leader (the count is the player's choice), set Chopper active, and Chopper skips the
 * next Refresh Phase of its controller.
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import {
  at,
  canHit,
  donOf,
  endBattle,
  kind,
  kw,
  LC,
  mine,
  need,
  pickCount,
  toMyNextMain,
  VC,
  askedCount,
} from './kit-c.ts';

const CHOPPER = 'OP18-029';

function board(rested: number, active = 10 - rested) {
  return mine(LC.luffy, { characters: [CHOPPER], costArea: { active, rested } });
}

function swing(g: ReturnType<typeof mine>) {
  attack(g, at(g, 'p1', 'characters', CHOPPER), g.leader('p2'));
}

/** Answer the count and target questions of "give up to N rested DON!! to your Leader". */
function give(g: ReturnType<typeof mine>, n: number) {
  for (let i = 0; i < 3 && kind(g) === 'choose'; i++) {
    if (askedCount(g)) pickCount(g, n);
    else if (g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p1'))) {
      act(g, { type: 'pick', choice: g.leader('p1') });
    } else break;
  }
}

describe('OP18-029 Chopper: Rush', () => {
  it('has Rush and can attack the turn it is played', () => {
    const g = mine(LC.luffy, { characters: [{ card: CHOPPER, playedThisTurn: true }] });
    expect(kw(g, at(g, 'p1', 'characters', CHOPPER))).toContain('Rush');
    expect(canHit(g, at(g, 'p1', 'characters', CHOPPER), g.leader('p2'))).toBe(true);
  });
});

describe('OP18-029 Chopper: [When Attacking] [Once Per Turn] give up to 3 rested DON!! to the Leader, set active', () => {
  it('gives 3 rested DON!! to the Leader and sets Chopper active', () => {
    const g = board(3);
    swing(g);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(true);
    give(g, 3);
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(donOf(g, 'p1').rested).toBe(0);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(false);
  });

  it('"up to 3": with 5 rested DON!! it can give fewer (2)', () => {
    const g = board(5);
    swing(g);
    give(g, 2);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(donOf(g, 'p1').rested).toBe(3);
  });

  it('only rested DON!! can be given: 1 rested + 9 active gives exactly 1', () => {
    const g = board(1);
    swing(g);
    give(g, 1);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(donOf(g, 'p1').active).toBe(9);
  });

  it('with no rested DON!! it gives nothing but Chopper is still set active', () => {
    const g = board(0);
    swing(g);
    give(g, 0);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(false);
  });

  it('the DON!! given raise the Leader’s power on your turn (+1000 each)', () => {
    const g = board(3);
    swing(g);
    give(g, 3);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('[Once Per Turn]: after the first battle a second attack triggers nothing and Chopper stays rested', () => {
    const g = board(3);
    swing(g);
    give(g, 3);
    endBattle(g);
    swing(g);
    expect(kind(g)).not.toBe('choose');
    endBattle(g);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(true);
    void need;
  });

  it('it does not become active in the next Refresh Phase (ends rested after the second attack)', () => {
    const g = board(3);
    swing(g);
    give(g, 3);
    endBattle(g);
    swing(g);
    endBattle(g);
    toMyNextMain(g);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(true);
    expect(canHit(g, at(g, 'p1', 'characters', CHOPPER), g.leader('p2'))).toBe(false);
  });

  it('the skip is for one Refresh only: active again the turn after', () => {
    const g = board(3);
    swing(g);
    give(g, 3);
    endBattle(g);
    swing(g);
    endBattle(g);
    toMyNextMain(g);
    toMyNextMain(g);
    expect(g.card(at(g, 'p1', 'characters', CHOPPER)).rested).toBe(false);
    void VC;
  });
});

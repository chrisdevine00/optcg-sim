/**
 * OP18-022 Monkey.D.Luffy (Leader, Green, 5000, 5 Life, {Water Seven}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[DON!! x3] [When Attacking] [Once Per Turn] You may set this Leader as active. If you do, this
 *    Leader will not become active in your next Refresh Phase."
 *
 * Reading: with 3 or more DON!! given, when the Leader attacks you may set it active (a yes/no).
 * Yes: it is active again at once (it can attack again, no second prompt this turn) and it skips
 * the Refresh of your next turn (stays rested if it is rested then). No: nothing happens.
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import { at, atMain, canHit, kind, LC, mine, need, no, yes, toMyNextMain, VC } from './kit-c.ts';

const LUFFY = 'OP18-022';

function leaderSwing(g: ReturnType<typeof mine>) {
  attack(g, g.leader('p1'), g.leader('p2'));
}

function finishBattle(g: ReturnType<typeof mine>) {
  passBlock(g);
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
  while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
}

describe('OP18-022 Monkey.D.Luffy Leader: [DON!! x3][When Attacking][Once Per Turn] set active', () => {
  it('yes: the Leader is active again after the attack declaration and can attack a second time', () => {
    const g = mine({ card: LUFFY, don: 3 }, { costArea: { active: 7, rested: 0 } });
    leaderSwing(g);
    yes(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(false);
    finishBattle(g);
    expect(g.life('p2')).toBe(3);
    expect(atMain(g)).toBe(true);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(true);
  });

  it('no: the Leader stays rested after the attack', () => {
    const g = mine({ card: LUFFY, don: 3 }, { costArea: { active: 7, rested: 0 } });
    leaderSwing(g);
    no(g, 'p1');
    expect(g.card(g.leader('p1')).rested).toBe(true);
    finishBattle(g);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(false);
  });

  it('[DON!! x3]: with only 2 DON!! given there is no prompt and the Leader stays rested', () => {
    const g = mine({ card: LUFFY, don: 2 }, { costArea: { active: 8, rested: 0 } });
    leaderSwing(g);
    expect(kind(g)).not.toBe('optional');
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('[DON!! x3] counts 3 or more: with 4 DON!! given the prompt is asked', () => {
    const g = mine({ card: LUFFY, don: 4 }, { costArea: { active: 6, rested: 0 } });
    leaderSwing(g);
    need(g, 'optional', 'p1');
  });

  it('[Once Per Turn]: the second attack in the same turn asks nothing, and the Leader ends rested', () => {
    const g = mine({ card: LUFFY, don: 3 }, { costArea: { active: 7, rested: 0 } });
    leaderSwing(g);
    yes(g, 'p1');
    finishBattle(g);
    leaderSwing(g);
    expect(kind(g)).not.toBe('optional');
    finishBattle(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(g.life('p2')).toBe(2);
  });

  it('yes then a second attack: the Leader does not become active in the next Refresh Phase', () => {
    const g = mine(
      { card: LUFFY, don: 3 },
      { costArea: { active: 7, rested: 0 }, characters: [VC.marco3] },
    );
    leaderSwing(g);
    yes(g, 'p1');
    finishBattle(g);
    leaderSwing(g);
    finishBattle(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    toMyNextMain(g);
    // Refresh skipped for the Leader: still rested, so it has no attack; other cards refreshed.
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(canHit(g, g.leader('p1'), g.leader('p2'))).toBe(false);
  });

  it('the skip lasts one Refresh only: two turns later the Leader is active again', () => {
    const g = mine({ card: LUFFY, don: 3 }, { costArea: { active: 7, rested: 0 } });
    leaderSwing(g);
    yes(g, 'p1');
    finishBattle(g);
    leaderSwing(g);
    finishBattle(g);
    toMyNextMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    toMyNextMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('no: the Leader refreshes normally next turn (nothing skipped)', () => {
    const g = mine({ card: LUFFY, don: 3 }, { costArea: { active: 7, rested: 0 } });
    leaderSwing(g);
    no(g, 'p1');
    finishBattle(g);
    toMyNextMain(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    void at;
    void LC;
  });
});

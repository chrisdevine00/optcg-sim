/**
 * ST30-001 Luffy & Ace (Leader, Green/Red, 6000, 4 Life; Straw Hat Crew / Whitebeard Pirates / Impel Down).
 *
 * Card text (cards/data):
 *   "If you have a Character with 7000 base power or more, give this Leader −2000 power.
 *    [Opponent's Turn] All of your [Portgas.D.Ace] and [Monkey.D.Luffy] cards gain +3000 power."
 *
 * Rules: base power ignores modifiers (CR 4-9-2); [Portgas.D.Ace] / [Monkey.D.Luffy] are exact names
 * (CR 2-1-2), so the Leader "Luffy & Ace" is neither (RL-49, QA-ST30 ST30-001 row 2); with no
 * Characters there is no -2000 (RL-49 row 1); permanent effects are re-checked as the board changes
 * (CR 8-1-3-3).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { endTurn } from '../../helpers.ts';
import { CH, F, LB, myTurn, side, theirTurn } from './kit-b.ts';

const LEADER = 'ST30-001';

function mine(p1: Partial<PlayerSpec> = {}) {
  return myTurn(side(LEADER, F.green, p1), side(LB.opp, F.red));
}
function theirs(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return theirTurn(side(LEADER, F.green, p1), side(LB.opp, F.red, p2));
}

describe('ST30-001: -2000 while you have a Character with 7000 base power or more', () => {
  it('RL-49 row 1: with no Characters the Leader keeps 6000', () => {
    const g = mine();
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a Character with 6000 base power (P-022) does not switch it on', () => {
    const g = mine({ characters: [CH.luffy4] });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a Character with exactly 7000 base power (OP10-013 Nami) gives -2000: 4000', () => {
    const g = mine({ characters: [CH.nami5] });
    expect(g.power(g.leader('p1'))).toBe(4000);
  });

  it('a Character with more than 7000 base power (OP10-014, 8000) gives -2000', () => {
    const g = mine({ characters: [CH.franky6] });
    expect(g.power(g.leader('p1'))).toBe(4000);
  });

  it('CR 4-9-2: base power only. A 6000-base Character with a given DON!! (7000 now) does not count', () => {
    const g = mine({ characters: [{ card: CH.luffy4, don: 1 }] });
    expect(g.power(g.find('p1', 'characters', CH.luffy4))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the opponent’s 7000-base Character does not count ("you have")', () => {
    const g = mine();
    const h = myTurn(side(LEADER, F.green), side(LB.opp, F.red, { characters: [CH.nami5] }));
    expect(h.power(h.leader('p1'))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('two Characters at 7000 base or more still give a single -2000', () => {
    const g = mine({ characters: [CH.nami5, CH.kingdew] });
    expect(g.power(g.leader('p1'))).toBe(4000);
  });

  it('it works on the opponent’s turn too', () => {
    const g = theirs({ characters: [CH.nami5] });
    expect(g.power(g.leader('p1'))).toBe(4000);
  });
});

describe('ST30-001: [Opponent’s Turn] [Portgas.D.Ace] and [Monkey.D.Luffy] cards gain +3000', () => {
  it('on the opponent’s turn a [Monkey.D.Luffy] Character (P-022, 6000) is 9000', () => {
    const g = theirs({ characters: [CH.luffy4] });
    expect(g.power(g.find('p1', 'characters', CH.luffy4))).toBe(9000);
  });

  it('on the opponent’s turn a [Portgas.D.Ace] Character (EB02-028, 5000) is 8000', () => {
    const g = theirs({ characters: [CH.ace5] });
    expect(g.power(g.find('p1', 'characters', CH.ace5))).toBe(8000);
  });

  it('on your own turn neither gets the boost', () => {
    const g = mine({ characters: [CH.luffy4, CH.ace5] });
    expect(g.power(g.find('p1', 'characters', CH.luffy4))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', CH.ace5))).toBe(5000);
  });

  it('other names get nothing: OP10-013 Nami and OP01-023 Marco keep their power', () => {
    const g = theirs({ characters: [CH.marco, CH.sanji1] });
    expect(g.power(g.find('p1', 'characters', CH.marco))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', CH.sanji1))).toBe(3000);
  });

  it('CR 2-1-2 / RL-49 row 2: the Leader itself ("Luffy & Ace") gets no +3000', () => {
    const g = theirs();
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the opponent’s own [Monkey.D.Luffy] gets nothing', () => {
    const g = theirs({}, { characters: [CH.luffy4] });
    expect(g.power(g.find('p2', 'characters', CH.luffy4))).toBe(6000);
  });

  it('a Luffy with 9000 base power switches the -2000 on and is 12000 on the opponent’s turn', () => {
    const g = theirs({ characters: [CH.luffy7] });
    expect(g.power(g.leader('p1'))).toBe(4000);
    expect(g.power(g.find('p1', 'characters', CH.luffy7))).toBe(12000);
  });

  it('RL-49: on your own turn Luffy is back to 6000 after the turns pass (re-checked as the turn changes)', () => {
    const g = theirs({ characters: [CH.luffy4] });
    expect(g.power(g.find('p1', 'characters', CH.luffy4))).toBe(9000);
    endTurn(g); // p2's turn 4 ends: it becomes p1's turn 5
    expect(g.power(g.find('p1', 'characters', CH.luffy4))).toBe(6000);
  });
});

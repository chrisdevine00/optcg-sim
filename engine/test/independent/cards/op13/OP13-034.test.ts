/**
 * OP13-034 Brook (Character, Green, cost 3, 4000, Counter +1000, {FILM}/{Straw Hat Crew}).
 *
 * Card text: "[On Play] If your Leader has the "FILM" or "Straw Hat Crew" type, set up to 1 of your
 * DON!! cards as active."
 *
 * Rules: digest 55 (given DON!! cannot be set active), CR 8-4-4-1 ("up to"), CR 10-1-... [On Play]
 * resolves after the cost is paid, so the DON!! that paid for Brook can be set active again.
 */
import { describe, expect, it } from 'vitest';
import { dons, isMain, mine, playRaw, WL, WV } from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BROOK = 'OP13-034';

function board(
  leader: string,
  active: number,
  rested: number,
  p2Leader: string = WL.luffy,
): TestGame {
  return mine(leader, { hand: [BROOK], costArea: { active, rested } }, {}, p2Leader);
}

describe('OP13-034 Brook: [On Play] with a FILM or Straw Hat Crew Leader, set up to 1 DON!! active', () => {
  it('{FILM} Leader: one rested DON!! becomes active', () => {
    const g = board(WL.shanks, 3, 4);
    playRaw(g, BROOK);
    expect(isMain(g)).toBe(true);
    // 3 rested for the cost + 4 rested before = 7; one is set active
    expect(dons(g)).toMatchObject({ active: 1, rested: 6 });
  });

  it('{Straw Hat Crew} Leader: one rested DON!! becomes active', () => {
    const g = board(WL.luffy, 3, 4);
    playRaw(g, BROOK);
    expect(dons(g)).toMatchObject({ active: 1, rested: 6 });
  });

  it('a Leader with neither type: nothing is set active', () => {
    const g = board(WL.croc, 3, 4);
    playRaw(g, BROOK);
    expect(isMain(g)).toBe(true);
    expect(dons(g)).toMatchObject({ active: 0, rested: 7 });
  });

  it('only one DON!! is set active ("up to 1")', () => {
    const g = board(WL.shanks, 3, 6);
    playRaw(g, BROOK);
    expect(dons(g).active).toBe(1);
  });

  it('the DON!! that paid for Brook is the one that can come back', () => {
    const g = board(WL.shanks, 3, 0);
    playRaw(g, BROOK);
    expect(dons(g)).toMatchObject({ active: 1, rested: 2 });
  });

  it('no prompt is needed: it resolves straight to the Main Phase', () => {
    const g = board(WL.luffy, 5, 0);
    playRaw(g, BROOK);
    expect(isMain(g)).toBe(true);
  });

  it('the opponent Leader type does not count: my Leader decides', () => {
    const g = board(WL.croc, 3, 4, WL.shanks);
    playRaw(g, BROOK);
    expect(dons(g).active).toBe(0);
  });

  it('DON!! given to a Leader or Character is not set active by it', () => {
    const g = mine(
      { card: WL.shanks, don: 2 },
      { hand: [BROOK], costArea: { active: 3, rested: 0 } },
      {},
      WL.luffy,
    );
    playRaw(g, BROOK);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(dons(g)).toMatchObject({ active: 1, rested: 2, given: 2 });
  });

  it('from 10 active DON!!: 3 rest for the cost, one of them is set active again', () => {
    const g = board(WL.shanks, 10, 0);
    playRaw(g, BROOK);
    expect(dons(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('Brook has 4000 power and can be played next to other Characters', () => {
    const g = mine(WL.luffy, { hand: [BROOK], characters: [WV.marco] });
    playRaw(g, BROOK);
    expect(g.power(g.find('p1', 'characters', BROOK))).toBe(4000);
  });
});

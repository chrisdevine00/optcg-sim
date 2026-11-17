/**
 * OP07-064 Sanji (Character, Purple, cost 6, 6000, Counter +2000, {Straw Hat Crew}).
 *
 * Card text:
 *   "If the number of DON!! cards on your field is at least 2 less than the number on your
 *    opponent's field, give this card in your hand −3 cost. [Blocker]"
 *
 * Rules: CR 8-1-3-3 / 8-1-3-3-3 (a permanent effect that works in hand); RL-24 / QA-OP01 OP01-091
 * ("DON!! on your field" counts the cost area, given DON!! and rested DON!!); CR 2-7-2 (the cost
 * paid is the current cost); CR 10-1-4 ([Blocker]).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import { donOf, myTurn, theirTurn } from '../kit.ts';
import { blockOptions, C, canPlay, FILLER, leaderDon, playCard, side, V } from './kit-c.ts';

const ID = 'OP07-064';

function game(mine: number, theirs: number, rested = 0) {
  return myTurn(
    side(C.shanks, FILLER, { hand: [ID], costArea: { active: mine, rested } }),
    side(C.luffy, FILLER, { costArea: { active: theirs, rested: 0 } }),
  );
}

describe('OP07-064 Sanji: costs 3 less in hand while you have at least 2 fewer DON!! on your field', () => {
  it('3 vs 5 (exactly 2 fewer): cost 3, playable with 3 DON!!, all 3 rested', () => {
    const g = game(3, 5);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(3);
    expect(canPlay(g, 'p1', ID)).toBe(true);
    playCard(g, 'p1', ID);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('4 vs 5 (only 1 fewer): full cost 6, not playable with 4 or 5 active DON!!', () => {
    const g = game(4, 5);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(6);
    expect(canPlay(g, 'p1', ID)).toBe(false);
  });

  it('equal DON!! counts: full cost 6', () => {
    const g = game(5, 5);
    expect(canPlay(g, 'p1', ID)).toBe(false);
    const g2 = game(6, 6);
    expect(canPlay(g2, 'p1', ID)).toBe(true);
    playCard(g2, 'p1', ID);
    expect(donOf(g2, 'p1')).toMatchObject({ active: 0, rested: 6 });
  });

  it('more DON!! than the opponent: full cost 6', () => {
    const g = game(6, 3);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(6);
  });

  it('3 or more fewer (3 vs 6): the reduction is only −3, not larger', () => {
    const g = game(3, 6);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(3);
    playCard(g, 'p1', ID);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
  });

  it('rested DON!! count as on the field: 1 active + 2 rested = 3 vs 5 → cost 3, and 1 active DON!! is not enough', () => {
    const g = game(1, 5, 2);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(3);
    expect(canPlay(g, 'p1', ID)).toBe(false);
  });

  it('given DON!! count as on the field: 2 in the cost area + 1 given to the Leader = 3 vs 5 → cost 3', () => {
    const g = myTurn(
      leaderDon(side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }), 0),
      side(C.luffy, FILLER, { costArea: { active: 6, rested: 0 } }),
    );
    // 3 vs 6: cost 3.
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(3);
    const g2 = myTurn(
      leaderDon(side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }), 1),
      side(C.luffy, FILLER, { costArea: { active: 6, rested: 0 } }),
    );
    // 3 + 1 given = 4 vs 6: exactly 2 fewer, still cost 3.
    expect(g2.card(g2.find('p1', 'hand', ID)).cost).toBe(3);
    const g3 = myTurn(
      leaderDon(side(C.shanks, FILLER, { hand: [ID], costArea: { active: 3, rested: 0 } }), 2),
      side(C.luffy, FILLER, { costArea: { active: 6, rested: 0 } }),
    );
    // 3 + 2 given = 5 vs 6: only 1 fewer → full cost.
    expect(g3.card(g3.find('p1', 'hand', ID)).cost).toBe(6);
  });

  it("the opponent's given DON!! count on their field: 5 in the cost area + 2 given = 7 vs my 5 → cost 3", () => {
    const g = myTurn(
      side(C.shanks, FILLER, { hand: [ID], costArea: { active: 5, rested: 0 } }),
      leaderDon(side(C.luffy, FILLER, { costArea: { active: 5, rested: 0 } }), 2),
    );
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(3);
  });

  it('once on the field its cost is the printed 6 (the −3 applies to the card in hand only)', () => {
    const g = game(3, 5);
    playCard(g, 'p1', ID);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(6);
  });
});

describe('OP07-064 Sanji: [Blocker]', () => {
  it('an active Sanji can block an attack on the Leader', () => {
    const g = theirTurn(
      side(C.shanks, FILLER, { characters: [ID] }),
      side(C.luffy, FILLER, { characters: [V.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', V.kingdew), g.leader('p1'));
    expect(blockOptions(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});

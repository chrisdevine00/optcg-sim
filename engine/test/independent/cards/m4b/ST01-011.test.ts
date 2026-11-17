/**
 * ST01-011 Brook (Character, Red, cost 2, 3000, Counter +2000, {Straw Hat Crew}).
 *
 * Card text:
 *   "[On Play] Give up to 2 rested DON!! cards to your Leader or 1 of your Characters."
 *
 * Rules: CR 6-5-5 (giving DON!!: here only RESTED DON!! from the cost area); CR 2-7-2 (the DON!!
 * rested to pay Brook's cost are rested and so can be given); CR 8-4-4-1 ("up to"); "your Leader
 * or 1 of your Characters": one recipient only, never the opponent's cards.
 */
import { describe, expect, it } from 'vitest';
import { donChoices, donOf, kind, myTurn, outcomes } from '../kit.ts';
import { C, drive, FILLER, offeredCards, playCard, side, sorted, V } from './kit-c.ts';

const ID = 'ST01-011';

function game(active: number, rested: number, chars: string[] = [V.sai]) {
  return myTurn(
    side(C.luffy, FILLER, { hand: [ID], characters: chars, costArea: { active, rested } }),
    side(C.shanks, FILLER, { characters: [V.kingdew] }),
  );
}

describe('ST01-011 Brook: [On Play] give up to 2 rested DON!! to your Leader or 1 of your Characters', () => {
  it('gives 2 rested DON!! to the Leader', () => {
    const g = game(2, 2);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.leader('p1')], don: 'costRested' });
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 2, given: 2 });
  });

  it('gives 2 rested DON!! to a Character instead', () => {
    const g = game(2, 2);
    const sai = g.find('p1', 'characters', V.sai);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [sai], don: 'costRested' });
    expect(g.card(sai).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('the DON!! rested to pay for Brook can themselves be given (only those 2 are rested)', () => {
    const g = game(2, 0);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.leader('p1')], don: 'costRested' });
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 0, given: 2 });
  });

  it('only RESTED DON!! can be given: active ones stay active', () => {
    const g = game(4, 0);
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.leader('p1')], don: 'costRested' });
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 0, given: 2 });
    for (const o of donChoices(g)) expect(o.from).not.toBe('costActive');
  });

  // DISAGREEMENTS-c.md D-1 (fixed in M4b fix round 1): the number given is the player's choice.
  it('"up to 2": giving only 1 (or 0) DON!! is a legal choice (CR 8-4-4-1)', () => {
    const g = game(2, 2);
    playCard(g, 'p1', ID);
    const reached = outcomes(g, 'p1', (x) => String(donOf(x, 'p1').given));
    expect(reached.has('1')).toBe(true);
  });

  it('with only 1 rested DON!! available the 1 is given ("up to 2")', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { hand: [ID], costArea: { active: 2, rested: 0 } }),
      side(C.shanks, FILLER),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.leader('p1')] });
    expect(g.card(g.leader('p1')).don).toBe(2);
  });

  it("candidates are my Leader and my Characters (Brook included), not the opponent's", () => {
    const g = game(2, 2);
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    g.act({ type: 'pick', choice: { option: '2' } }); // how many to give; then to whom
    expect(kind(g)).toBe('choose');
    const names = offeredCards(g);
    const leaderOffered = g.legal().some((a) => a.type === 'pick' && a.choice === g.leader('p1'));
    expect(leaderOffered).toBe(true);
    expect(sorted(names.filter((n) => n !== C.luffy))).toEqual(sorted([V.sai, ID]));
  });

  // DISAGREEMENTS-c.md D-1
  it('"up to 2": giving none at all is a legal choice (CR 8-4-4-1)', () => {
    const g = game(2, 2);
    playCard(g, 'p1', ID);
    const reached = outcomes(g, 'p1', (x) => String(donOf(x, 'p1').given));
    expect(reached.has('0')).toBe(true);
  });
});

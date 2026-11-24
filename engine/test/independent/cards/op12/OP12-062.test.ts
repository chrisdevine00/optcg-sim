/**
 * OP12-062 Vinsmoke Sora (Character, Purple, cost 1, 0 power, Counter +2000, {The Vinsmoke
 * Family}/{Kingdom of GERMA}).
 *
 * Card text: "[On Play] If your Leader is [Sanji] and the number of DON!! cards on your field is equal
 * to or less than the number on your opponent's field, add up to 1 DON!! card from your DON!! deck
 * and rest it. Then, draw 1 card."
 *
 * Rules: "DON!! cards on your field" counts the cost area (active and rested) and DON!! given to
 * cards, when the effect resolves (the DON!! that paid for Sora is still on the field). "Add up to
 * 1" asks a count and the added DON!! is rested (E-Q11). A "Then" after an "If" that failed does
 * not resolve (M4b-5).
 */
import { describe, expect, it } from 'vitest';
import { asksDonCount, cast, deck, don, hand, kind, LB, mine, SB, takeDon } from './kit-op12b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SORA = 'OP12-062';
const TOP = [SB.marco, SB.sai, ...Array(13).fill(SB.mohji)];

function play(
  leader: string,
  mineDon: number,
  theirDon: number,
  extra: Parameters<typeof mine>[1] = {},
): TestGame {
  return mine(
    leader,
    { hand: [SORA], costArea: { active: mineDon, rested: 0 }, deck: TOP, ...extra },
    { costArea: { active: theirDon, rested: 0 } },
  );
}

describe('OP12-062 Vinsmoke Sora: [On Play] [Sanji] and DON!! count not above theirs: add 1 rested DON!!, then draw 1', () => {
  it('equal DON!! counts: add 1 DON!! rested and draw 1', () => {
    const g = play(LB.sanji, 3, 3);
    cast(g, SORA);
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ deck: 6, active: 2, rested: 2, given: 0 });
    expect(hand(g)).toEqual([SB.marco]);
    expect(deck(g)).toHaveLength(14);
  });

  it('fewer DON!! than the opponent: the effect applies', () => {
    const g = play(LB.sanji, 2, 5);
    cast(g, SORA);
    takeDon(g, 1);
    expect(don(g).rested).toBe(2);
    expect(hand(g)).toEqual([SB.marco]);
  });

  it('boundary: one DON!! more than the opponent: nothing is added, nothing is drawn, nothing is asked', () => {
    const g = play(LB.sanji, 4, 3);
    cast(g, SORA);
    expect(asksDonCount(g)).toBe(false);
    expect(kind(g)).toBe('main');
    expect(don(g)).toMatchObject({ deck: 6, active: 3, rested: 1 });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('must not: a Leader that is not [Sanji] gets nothing, even with fewer DON!!', () => {
    const g = play(LB.croc, 2, 5);
    cast(g, SORA);
    expect(asksDonCount(g)).toBe(false);
    expect(don(g)).toMatchObject({ deck: 8, active: 1, rested: 1 });
    expect(hand(g)).toEqual([]);
  });

  it("the opponent's rested DON!! count toward their field", () => {
    const g = mine(
      LB.sanji,
      { hand: [SORA], costArea: { active: 3, rested: 0 }, deck: TOP },
      { costArea: { active: 1, rested: 2 } },
    );
    cast(g, SORA);
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(hand(g)).toEqual([SB.marco]);
  });

  it('DON!! given to my Leader still count as on my field: 2 in the cost area + 1 given vs 2 is more', () => {
    const g = mine(
      LB.sanji,
      {
        hand: [SORA],
        costArea: { active: 2, rested: 0 },
        deck: TOP,
      },
      { costArea: { active: 2, rested: 0 } },
    );
    // Control: 2 vs 2 applies.
    cast(g, SORA);
    expect(asksDonCount(g)).toBe(true);
    const h = mine(
      { card: LB.sanji, don: 1 },
      { hand: [SORA], costArea: { active: 2, rested: 0 }, deck: TOP },
      { costArea: { active: 2, rested: 0 } },
    );
    cast(h, SORA);
    // 3 on my field (2 cost area + 1 given) against 2: the condition fails.
    expect(asksDonCount(h)).toBe(false);
    expect(hand(h)).toEqual([]);
  });

  it('"up to 1": answering 0 adds no DON!!', () => {
    const g = play(LB.sanji, 3, 3);
    cast(g, SORA);
    takeDon(g, 0);
    expect(don(g)).toMatchObject({ deck: 7, active: 2, rested: 1 });
  });

  it('the condition counts the DON!! that paid for Sora: cost 1 rested does not remove it from the field', () => {
    const g = play(LB.sanji, 1, 1);
    cast(g, SORA);
    // 1 DON!! (now rested) vs 1: equal, so the effect applies.
    expect(asksDonCount(g)).toBe(true);
    takeDon(g, 1);
    expect(don(g)).toMatchObject({ rested: 2, active: 0 });
  });

  it('the added DON!! comes from the DON!! deck, never the hand or cost area: totals stay at 10', () => {
    const g = play(LB.sanji, 3, 3);
    cast(g, SORA);
    takeDon(g, 1);
    const d = don(g);
    expect(d.deck + d.active + d.rested + d.given).toBe(10);
  });
});

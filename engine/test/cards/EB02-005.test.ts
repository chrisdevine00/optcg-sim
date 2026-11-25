/** EB02-005 Fake Straw Hat Crew. */
import { describe, expect, it } from 'vitest';
import { boost, mk } from './helpers-aeb2g1.ts';

const ID = 'EB02-005';

describe('EB02-005 Fake Straw Hat Crew', () => {
  it('[Your Turn]: 3000 + 2000 = 5000', () => {
    const g = mk({ characters: [ID] });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it("[Opponent's Turn]: 3000 - 2000 = 1000", () => {
    const g = mk({ characters: [ID] });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it("the opponent's copy follows its own controller's turns", () => {
    const g = mk({}, { characters: [ID] });
    const theirs = g.find('p2', 'characters', ID);
    expect(g.power(theirs)).toBe(1000); // p1's turn: their Character's controller is the opponent
    g.act({ type: 'endTurn' });
    expect(g.power(theirs)).toBe(5000);
  });

  it('stacks with other power changes and given DON!!', () => {
    const g = mk({ characters: [{ card: ID, don: 2 }], costArea: { active: 3, rested: 0 } });
    const me = g.find('p1', 'characters', ID);
    expect(g.power(me)).toBe(7000); // 3000 + 2000 (effect) + 2000 (2 DON!!)
    boost(g, me, 1000);
    expect(g.power(me)).toBe(8000);
    g.act({ type: 'endTurn' });
    expect(g.power(me)).toBe(1000); // -2000 on the opponent's turn, given DON!! give nothing, the boost ended
  });
});

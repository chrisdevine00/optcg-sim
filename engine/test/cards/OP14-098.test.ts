/** OP14-098 Crescent Cutlass. */
import { describe, expect, it } from 'vitest';
import { endCounter, play, V } from './helpers.ts';
import { BW5, BW_LEADER, COST8, counterGame, TBP4, start } from './helpers-op14g4.ts';

const ID = 'OP14-098';
const main = (p1chars: string[], p2chars: string[]) => {
  const g = start(
    { leader: BW_LEADER, hand: [ID], characters: p1chars, costArea: { active: 1, rested: 0 } },
    { characters: p2chars },
  );
  play(g, ID);
  return g;
};
const cost = (g: ReturnType<typeof main>, p: 'p1' | 'p2', card: string) =>
  g.card(g.find(p, 'characters', card)).cost;

describe('OP14-098 Crescent Cutlass', () => {
  it("[Main] with a cost 8 Character on the field: your Baroque Works Characters gain +3 cost until the end of your opponent's next End Phase", () => {
    const g = main([BW5, TBP4], [COST8]);
    expect(cost(g, 'p1', BW5)).toBe(8);
    expect(cost(g, 'p1', TBP4)).toBe(4); // not Baroque Works
    expect(cost(g, 'p2', COST8)).toBe(8);
    g.act({ type: 'endTurn' });
    expect(cost(g, 'p1', BW5)).toBe(8); // still on the opponent's turn
    g.act({ type: 'endTurn' });
    expect(cost(g, 'p1', BW5)).toBe(5); // ended with the opponent's End Phase
  });

  it('a cost 8 Character of your own counts', () => {
    const g = main([BW5, COST8], []);
    expect(cost(g, 'p1', BW5)).toBe(8);
  });

  it('the boundary is cost 8: with only a cost 7 Character nothing happens', () => {
    const g = main([BW5], [V.c7]);
    expect(cost(g, 'p1', BW5)).toBe(5);
  });

  it('with no other Character than the Baroque Works one the condition is false', () => {
    const g = main([BW5], []);
    expect(cost(g, 'p1', BW5)).toBe(5);
  });

  it('[Counter] your Leader gains +3000 power during this battle (and not afterwards)', () => {
    const g = counterGame(ID, { leader: BW_LEADER });
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    // 8000 beats the 7000 attacker (5000 alone would not): no damage.
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

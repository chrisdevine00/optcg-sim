/** OP12-073 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, option, play, V } from './helpers.ts';
import { HEART4, mine, ROSI_G } from './helpers-op12g2.ts';

const ID = 'OP12-073';

describe('OP12-073 Trafalgar Law', () => {
  // p1 plays Law (cost 7) from 7 active DON!!: 7 DON!! remain on its field (rested by the cost).
  const start = (oppActive: number) =>
    mine(
      { hand: [ID], characters: [ROSI_G, HEART4, V.c3] },
      { costArea: { active: oppActive, rested: 0 } },
      {},
      7,
    );
  const power = (g: ReturnType<typeof start>, card: string) =>
    g.power(g.find('p1', 'characters', card));

  it("with DON!! no more than the opponent's: add 1 active DON!!, then [Rosinante] and {Heart Pirates} Characters gain +1000", () => {
    const g = start(7);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 7 });
    expect(power(g, ID)).toBe(9000);
    expect(power(g, HEART4)).toBe(7000);
    expect(power(g, ROSI_G)).toBe(2000);
    expect(power(g, V.c3)).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: 1 more DON!! than the opponent: nothing is added and no power is given ("Then" is inside the "If")', () => {
    const g = start(6);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(power(g, ID)).toBe(8000);
    expect(power(g, HEART4)).toBe(6000);
    expect(power(g, ROSI_G)).toBe(1000);
  });

  it('"up to 1": declining the DON!! still gives the power (Then, not If you do)', () => {
    const g = start(9);
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options!.at(-1)!.id);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7 });
    expect(power(g, HEART4)).toBe(7000);
  });

  it("the power lasts until the end of the opponent's next End Phase", () => {
    const g = start(7);
    play(g, ID);
    addMost(g);
    g.act({ type: 'endTurn' });
    expect(power(g, HEART4)).toBe(7000); // the opponent's turn
    g.act({ type: 'endTurn' });
    expect(power(g, HEART4)).toBe(6000);
    expect(power(g, ID)).toBe(8000);
  });
});

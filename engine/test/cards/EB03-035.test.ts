/** EB03-035 Charlotte Pudding. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, option, play, V } from './helpers.ts';
import { mk } from './helpers-eb03g2.ts';

const ID = 'EB03-035';
const area = (active: number) => ({ costArea: { active, rested: 0 } });

describe('EB03-035 Charlotte Pudding', () => {
  it('[On Play]: with fewer DON!! than the opponent, adds up to 1 DON!! rested', () => {
    const g = mk({ hand: [ID], ...area(5) }, area(7));
    play(g, ID);
    addMost(g);
    // 4 rested to play Pudding, plus the added DON!!, rested.
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
    expectDecision(g, 'main', 'p1');
  });

  it('boundary: equal DON!! counts fire (after paying for Pudding the count is unchanged)', () => {
    const g = mk({ hand: [ID], ...area(5) }, area(5));
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('boundary: one more DON!! than the opponent does not fire and asks nothing', () => {
    const g = mk({ hand: [ID], ...area(6) }, area(5));
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
  });

  it('DON!! given to Characters count as on the field', () => {
    // p1: 4 in the cost area plus 2 given = 6 against p2 with 5: does not fire.
    const g = mk({ hand: [ID], ...area(4), characters: [{ card: V.c1, don: 2 }] }, area(5));
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    // The same position with the opponent at 6 fires.
    const h = mk({ hand: [ID], ...area(4), characters: [{ card: V.c1, don: 2 }] }, area(6));
    play(h, ID);
    addMost(h);
    expect(don(h, 'p1').rested).toBe(5);
  });

  it('"up to 1": the count may be 0', () => {
    const g = mk({ hand: [ID], ...area(5) }, area(7));
    play(g, ID);
    option(g, '0');
    expect(don(g, 'p1').rested).toBe(4);
  });

  it('is a [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});

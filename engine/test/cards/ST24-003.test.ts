/** ST24-003 Basil Hawkins. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, mk, opp, option, V } from './helpers-lfc.ts';

const ID = 'ST24-003';

describe('ST24-003 Basil Hawkins', () => {
  const rested = (n: number) => ({ active: 10 - n, rested: n });

  it('[End of Your Turn] sets 1 rested DON!! as active', () => {
    const g = mk({ characters: [ID], costArea: rested(7) });
    g.act({ type: 'endTurn' });
    expect(expectDecision(g, 'choose', 'p1').max).toBe(1);
    option(g, '1');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expectDecision(g, 'main', 'p2');
  });

  it('"up to 1": may set 0', () => {
    const g = mk({ characters: [ID], costArea: rested(7) });
    g.act({ type: 'endTurn' });
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });

  it('with no rested DON!! nothing is asked and nothing changes', () => {
    const g = mk({ characters: [ID], costArea: rested(0) });
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toMatchObject({ active: 10, rested: 0 });
  });

  it("must not fire at the end of the opponent's turn, nor from the hand", () => {
    const g = mk({ characters: [ID], costArea: rested(7) }, {}, opp);
    g.act({ type: 'endTurn' });
    expect(dec(g)?.kind).toBe('main');
    const h = mk({ hand: [ID, V.c1], characters: [], costArea: rested(7) });
    h.act({ type: 'endTurn' });
    expectDecision(h, 'main', 'p2');
  });
});

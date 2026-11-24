/** EB03-038 Thanks for the Treat. ♡ */
import { describe, expect, it } from 'vitest';
import { accept, addMost, decline, don, expectDecision, play, V } from './helpers.ts';
import { counterStep, donArea, useCounter } from './helpers-luffyace.ts';
import { GERMA5, mk, RED_LEADER } from './helpers-eb03g2.ts';

const ID = 'EB03-038';
const area = (active: number) => ({ costArea: { active, rested: 0 } });

describe('EB03-038 Thanks for the Treat. ♡', () => {
  it('[Main] rest 1 DON!!: with as few DON!! as the opponent and only GERMA Characters, adds up to 2 DON!! rested', () => {
    const g = mk({ hand: [ID], characters: [GERMA5], ...area(5) }, area(6));
    play(g, ID);
    accept(g);
    addMost(g);
    // 1 rested to play the Event, 1 for the cost, 2 added rested.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 4 });
    expectDecision(g, 'main', 'p1');
  });

  it('boundary: equal DON!! counts fire (the cost rests a DON!! but the count stays), one more does not', () => {
    const g = mk({ hand: [ID], characters: [GERMA5], ...area(5) }, area(5));
    play(g, ID);
    accept(g);
    addMost(g);
    expect(don(g, 'p1').rested).toBe(4);
    const h = mk({ hand: [ID], characters: [GERMA5], ...area(6) }, area(5));
    play(h, ID);
    accept(h);
    expectDecision(h, 'main', 'p1');
    expect(don(h, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });

  it('a Character without a GERMA type stops it', () => {
    const g = mk({ hand: [ID], characters: [GERMA5, V.c1], ...area(5) }, area(6));
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('reading (as OP13-095): with no Characters "you only have GERMA Characters" is false', () => {
    const g = mk({ hand: [ID], ...area(5) }, area(6));
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('the rest cost is optional: declining it resolves nothing', () => {
    const g = mk({ hand: [ID], characters: [GERMA5], ...area(5) }, area(6));
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 1 });
  });

  it('[Counter]: your Leader gains +3000 power during this battle only', () => {
    const g = counterStep({ leader: RED_LEADER, hand: [ID], ...donArea(3) });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    g.act({ type: 'endCounter' });
    while (g.legal().some((a) => a.type === 'trigger')) g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

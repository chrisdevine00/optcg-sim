/** ST26-003 Nico Robin. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  addMost,
  decline,
  don,
  dec,
  expectDecision,
  option,
  payDon,
  play,
} from './helpers.ts';
import { mk } from './helpers-st2627.ts';

const ID = 'ST26-003';
/** Robin costs 3: 5 active leaves 2 active, 3 rested; DON!! -2 returns active ones first. */
const start = () => mk({ hand: [ID], costArea: { active: 5, rested: 0 } });

describe('ST26-003 Nico Robin', () => {
  it('[On Play] DON!! -2: adds 1 DON!! from the DON!! deck, set as active', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3, deck: 6 });
    expectDecision(g, 'main', 'p1');
  });

  it('"add up to 1" asks a count: the most is 1, and 0 is allowed ("Then" is not part of it: nothing else follows)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.length).toBe(2);
    option(g, d.options!.at(-1)!.id);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('declining the DON!! -2: nothing is returned or added', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 3, deck: 5 });
  });

  it('with only the 3 DON!! that paid for it (all rested) the DON!! -2 can still be paid and 1 DON!! comes back active', () => {
    const g = mk({ hand: [ID], costArea: { active: 3, rested: 0 } });
    play(g, ID);
    accept(g);
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1, deck: 9 });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
  });

  it('must not fire when Robin is not played: the DON!! -2 prompt only appears on play', () => {
    const g = mk({ characters: [ID], costArea: { active: 5, rested: 0 } });
    expectDecision(g, 'main', 'p1');
    expect(dec(g)!.kind).toBe('main');
    expect(don(g, 'p1').deck).toBe(5);
  });
});

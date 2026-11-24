/** OP13-030 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, play } from './helpers.ts';
import { mk } from './helpers-op13g1.ts';

const ID = 'OP13-030';

describe('OP13-030 Tony Tony.Chopper', () => {
  it('[On Play]: sets up to 2 of your DON!! as active', () => {
    const g = mk({ hand: [ID], costArea: { active: 5, rested: 5 } });
    play(g, ID); // 5 rested for the cost: 0 active, 10 rested
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    expectDecision(g, 'main', 'p1');
  });

  it('sets only 2, not more, even with many rested', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 7, rested: 3 }); // 5 left active + 2 set
  });

  it('given DON!! are not affected', () => {
    const g = mk({
      hand: [ID],
      leader: { card: 'ST01-001', don: 3 },
      costArea: { active: 5, rested: 2 },
    });
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 5, given: 3 });
  });

  it('has no [Blocker]-style extras: it is a plain 6000 Character with no other effect', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.power).toBe(6000);
    expect(c.keywords).toEqual([]);
  });

  it('must not fire off the field: placing Chopper does nothing to DON!!', () => {
    const g = mk({ characters: [ID], costArea: { active: 3, rested: 7 } });
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7 });
  });
});

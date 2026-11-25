/** PRB02-011 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, option, play } from './helpers.ts';
import { mk, NAVY_LEADER, PLAIN_PURPLE_LEADER } from './helpers-prbst.ts';

const ID = 'PRB02-011';

describe('PRB02-011 Donquixote Doflamingo', () => {
  const start = (leader: string, costArea = { active: 8, rested: 0 }) =>
    mk({ leader, hand: [ID], costArea });

  it('has [Blocker] (printed)', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    option(g, '1');
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: with a multicolored Leader, adds up to 1 DON!! from the DON!! deck, rested (a count is asked)', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    option(g, '1');
    // 5 DON!! paid for the cost (rested), then 1 added rested; the deck had 2.
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 6, deck: 1 });
  });

  it('"up to 1": adding none is allowed', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    option(g, '0');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 5, deck: 2 });
  });

  it('must not fire: with a single-colour Leader nothing is added and nothing is asked', () => {
    const g = start(PLAIN_PURPLE_LEADER);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 5, deck: 2 });
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = start(NAVY_LEADER, { active: 10, rested: 0 });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ rested: 5, deck: 0 });
  });
});

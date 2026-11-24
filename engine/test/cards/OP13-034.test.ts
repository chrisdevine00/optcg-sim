/** OP13-034 Brook. */
import { describe, expect, it } from 'vitest';
import { don, play, PLAIN_BLUE } from './helpers.ts';
import { expectDecision, FILM_LEADER, mk, settle } from './helpers-op13g2.ts';
import { SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP13-034';

// Brook costs 3: 3 active are paid, 3 stay rested; one of those can be set active.
const start = (leader: string) => mk({ leader, hand: [ID], costArea: { active: 3, rested: 3 } });

describe('OP13-034 Brook', () => {
  it('[On Play]: with a {FILM} Leader, sets up to 1 of your DON!! cards as active', () => {
    const g = start(FILM_LEADER);
    play(g, ID);
    settle(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
  });

  it('a {Straw Hat Crew} Leader works too', () => {
    const g = start(SHC_LEADER);
    play(g, ID);
    settle(g);
    expect(don(g, 'p1').active).toBe(1);
  });

  it('must not fire with a Leader that is neither type', () => {
    const g = start(PLAIN_BLUE);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 6 });
  });

  it('"up to 1": exactly one DON!! card is set active, not all of them', () => {
    const g = start(FILM_LEADER);
    play(g, ID);
    settle(g);
    expect(don(g, 'p1').active).toBe(1);
    expect(don(g, 'p1').rested).toBe(5);
  });
});

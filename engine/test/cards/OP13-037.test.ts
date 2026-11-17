/** OP13-037 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, play, PLAIN_BLUE, PLAIN_PURPLE } from './helpers.ts';
import { donArea, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'OP13-037';
const FILM_LEADER = 'ST05-001'; // Shanks: {FILM}, not {Straw Hat Crew}

describe('OP13-037 Roronoa Zoro', () => {
  const played = (leader: string) =>
    game({ leader, hand: [ID], ...donArea(4, 3) }, { leader: PLAIN_BLUE });

  it('[On Play]: with a {Straw Hat Crew} Leader, set up to 2 DON!! cards as active', () => {
    const g = played(SHC_LEADER);
    play(g, ID);
    // The 4 active DON!! paid for Zoro; 7 are rested now. Up to 2 are set active.
    expectDecision(g, 'main', 'p1');
    const d = don(g, 'p1');
    expect(d.active).toBe(2);
    expect(d.rested).toBe(5);
  });

  it('[On Play]: a {FILM} Leader qualifies as well', () => {
    const g = played(FILM_LEADER);
    play(g, ID);
    expect(don(g, 'p1').active).toBe(2);
  });

  it('[On Play]: with a Leader that is neither {FILM} nor {Straw Hat Crew} nothing is set active', () => {
    const g = played(PLAIN_PURPLE);
    play(g, ID);
    const d = don(g, 'p1');
    expect(d.active).toBe(0);
    expect(d.rested).toBe(7);
    expectDecision(g, 'main', 'p1');
  });

  it('[End of Your Turn]: sets this Character as active', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, rested: true }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });
});

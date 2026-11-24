/** OP12-093 Morley. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { koBy } from './helpers-w3s.ts';
import { cardsIn, mk, OTHER_LEADER, RA_LEADER } from './helpers-op12g3.ts';

const ID = 'OP12-093';

describe('OP12-093 Morley', () => {
  it('with a "Revolutionary Army" Leader this Character gains +4 cost (4 becomes 8)', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
  });

  it('must not apply with another Leader: cost stays 4', () => {
    const g = mk({ leader: OTHER_LEADER, characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(4);
  });

  it("follows the Leader live: the bonus is there on the opponent's turn too, and gives nothing else", () => {
    const g = game(
      { leader: RA_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.cost).toBe(8);
    expect(c.power).toBe(5000);
    expect(c.keywords).toEqual([]);
  });

  it('the +4 cost is current cost only: an effect limited to base cost 4 still reaches it', () => {
    // A planted "K.O. up to 1 Character with base cost 4 or less" (OP12-089 style) still finds Morley.
    const g = mk({ characters: [ID, V.c5] }, {});
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
    koBy(g, 'p1', ID, 'p2');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([V.c5]);
    expectDecision(g, 'main', 'p1');
  });
});

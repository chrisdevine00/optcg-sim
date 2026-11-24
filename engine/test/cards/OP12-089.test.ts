/** OP12-089 Hack. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { koBy } from './helpers-w3s.ts';
import { C8, cardsIn, mk, offered, OTHER_LEADER, RA_LEADER } from './helpers-op12g3.ts';

const ID = 'OP12-089';

describe('OP12-089 Hack', () => {
  it('with a "Revolutionary Army" Leader this Character gains [Blocker] and +4 cost (4 becomes 8)', () => {
    const g = mk({ characters: [ID] });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).toContain('Blocker');
    expect(c.cost).toBe(8);
  });

  it('must not apply with another Leader: no [Blocker], cost 4', () => {
    const g = mk({ leader: OTHER_LEADER, characters: [ID] });
    const c = g.card(g.find('p1', 'characters', ID));
    expect(c.keywords).not.toContain('Blocker');
    expect(c.cost).toBe(4);
  });

  it('[On K.O.] with a "Revolutionary Army" Leader: K.O.s up to 1 opposing Character with base cost 4 or less', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4, V.c5, V.c1] });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    // Base cost 5 is out; 4 and 1 are in.
    expect(offered(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c4), g.find('p2', 'characters', V.c1)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c5, V.c1].sort());
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
  });

  it('the bound is base cost: a Character raised above 4 by an effect is still a target; one over 4 on print is not', () => {
    // A base-cost-3 Character that is +3 cost (6) now: still base 3.
    const g = mk({ characters: [ID] }, { characters: [V.c3, C8] });
    koBy(g, 'p1', ID, 'p2');
    expect(offered(g)).toEqual([g.find('p2', 'characters', V.c3)]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c4] });
    koBy(g, 'p1', ID, 'p2');
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it("must not fire with another Leader: nothing is asked when it is K.O.'d", () => {
    const g = mk({ leader: OTHER_LEADER, characters: [ID] }, { characters: [V.c4] });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it("works when K.O.'d on the opponent's turn too (the Leader condition is read when it resolves)", () => {
    const g = game(
      { leader: RA_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c2] },
      { turn: 4, activePlayer: 'p2' },
    );
    koBy(g, 'p1', ID, 'p2');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([]);
  });
});

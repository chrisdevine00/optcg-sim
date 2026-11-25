/** ST19-004 Hina. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { dec, expectDecision, pick, V } from './helpers.ts';
import { NAVY_LEADER, activateAb, canActivate, mk, offered, oppTurn } from './helpers-st1821.ts';

const ID = 'ST19-004';

describe('ST19-004 Hina', () => {
  it("[DON!! x1] [Opponent's Turn]: +4 cost during the opponent's turn only (cost 4 becomes 8)", () => {
    const opp = mk(
      {
        leader: NAVY_LEADER,
        characters: [{ card: ID, don: 1 }],
        costArea: { active: 5, rested: 0 },
      },
      {},
      oppTurn,
    );
    expect(opp.card(opp.find('p1', 'characters', ID)).cost).toBe(8);
    // On your own turn it is the printed cost.
    const own = mk({
      leader: NAVY_LEADER,
      characters: [{ card: ID, don: 1 }],
      costArea: { active: 5, rested: 0 },
    });
    expect(own.card(own.find('p1', 'characters', ID)).cost).toBe(4);
  });

  it('boundary: with no DON!! given there is no bonus, even on the opponent turn', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, {}, oppTurn);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(4);
  });

  it('[Activate: Main]: places 1 trash card at the deck bottom, gives 1 rested DON!! to the Leader or a Character', () => {
    const g = mk({
      leader: NAVY_LEADER,
      characters: [ID, V.c1],
      trash: [V.c2, V.c3],
      costArea: { active: 3, rested: 2 },
    });
    const hina = g.find('p1', 'characters', ID);
    expect(canActivate(g, hina, 'activate')).toBe(true);
    activateAb(g, hina, 'activate');
    pick(g, [g.find('p1', 'trash', V.c3)]);
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(V.c3);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c2]);
    // The target: the Leader or one of the Characters.
    expect(offered(g)).toHaveLength(3);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 1 });
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(1);
    // Once Per Turn.
    expect(canActivate(g, hina, 'activate')).toBe(false);
  });

  it('with an empty trash the cost cannot be paid: the Activate is not offered', () => {
    const g = mk({
      leader: NAVY_LEADER,
      characters: [ID],
      trash: [],
      costArea: { active: 3, rested: 2 },
    });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('with no rested DON!! the cost is still paid and nothing is given', () => {
    const g = mk({
      leader: NAVY_LEADER,
      characters: [ID],
      trash: [V.c2],
      costArea: { active: 5, rested: 0 },
    });
    activateAb(g, g.find('p1', 'characters', ID), 'activate');
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(V.c2);
    expect(queries.don(g.state, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expectDecision(g, 'main', 'p1');
  });
});

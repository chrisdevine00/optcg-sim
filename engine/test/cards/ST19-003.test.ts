/** ST19-003 Tashigi. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, trash, V } from './helpers.ts';
import {
  NAVY_LEADER,
  SMOKER_LEADER,
  activateAb,
  canActivate,
  cheapen,
  mk,
  offered,
} from './helpers-st1821.ts';

const ID = 'ST19-003';

describe('ST19-003 Tashigi', () => {
  it('[On Play] with a [Smoker] Leader: gives up to 1 Character -4 cost during this turn', () => {
    const g = mk({ leader: SMOKER_LEADER, hand: [ID] }, { characters: [V.c5, V.c3] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(1);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
    // It lasts this turn only.
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('with another {Navy} Leader (not named [Smoker]) the [On Play] does nothing and asks nothing', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('[Activate: Main] on the turn it was played: trashes a Character with a cost of 0 (the -4 made one)', () => {
    const g = mk({ leader: SMOKER_LEADER, hand: [ID] }, { characters: [V.c4, V.c1, V.c2] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(0);
    const tashigi = g.find('p1', 'characters', ID);
    expect(canActivate(g, tashigi, 'activate')).toBe(true);
    activateAb(g, tashigi, 'activate');
    // Only the cost-0 Character is a candidate (cost 1 and 2 are not).
    expect(offered(g)).toEqual([g.find('p2', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1, V.c2]);
    expect(trash(g, 'p2')).toContain(V.c4);
    // Once Per Turn: spent.
    expect(canActivate(g, tashigi, 'activate')).toBe(false);
  });

  it('"up to 1": the trash may be declined, and nothing is trashed with no cost-0 Character', () => {
    const g = mk({ leader: NAVY_LEADER, hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    const tashigi = g.find('p1', 'characters', ID);
    activateAb(g, tashigi, 'activate');
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    const h = mk({ leader: NAVY_LEADER, hand: [ID] }, { characters: [V.c4] });
    play(h, ID);
    cheapen(h, h.find('p2', 'characters', V.c4), 4);
    activateAb(h, h.find('p1', 'characters', ID), 'activate');
    none(h);
    expect(h.zone('p2', 'characters')).toHaveLength(1);
  });

  it('not played this turn: the Activate is still offered, spends Once Per Turn, and trashes nothing', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [ID] }, { characters: [V.c4] });
    cheapen(g, g.find('p2', 'characters', V.c4), 4);
    const tashigi = g.find('p1', 'characters', ID);
    expect(canActivate(g, tashigi, 'activate')).toBe(true);
    activateAb(g, tashigi, 'activate');
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(canActivate(g, tashigi, 'activate')).toBe(false);
  });
});

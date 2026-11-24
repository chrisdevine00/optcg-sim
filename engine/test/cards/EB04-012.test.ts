/** EB04-012 Kikunojo. */
import { describe, expect, it } from 'vitest';
import { dec, play } from './helpers.ts';
import {
  activateAb,
  at,
  canActivate,
  isRested,
  mk,
  RED_LEADER,
  WANO_LEADER,
} from './helpers-eb04g1.ts';

const ID = 'EB04-012';
const restedLeader = (card: string) => ({ card, rested: true });

describe('EB04-012 Kikunojo', () => {
  it('[Activate: Main] on the turn it was played: sets your {Land of Wano} Leader as active', () => {
    const g = mk({ leader: restedLeader(WANO_LEADER), hand: [ID] });
    play(g, ID);
    expect(isRested(g, g.leader('p1'))).toBe(true);
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    expect(isRested(g, g.leader('p1'))).toBe(false);
    expect(dec(g)?.kind).toBe('main');
  });

  it('on a later turn it can be activated but does nothing: the Leader stays rested', () => {
    const g = mk({ leader: restedLeader(WANO_LEADER), characters: [ID] });
    const id = at(g, 'p1', 'characters', ID);
    expect(canActivate(g, id, 'activate')).toBe(true);
    activateAb(g, id, 'activate');
    expect(isRested(g, g.leader('p1'))).toBe(true);
    expect(canActivate(g, id, 'activate')).toBe(false); // Once Per Turn was used
  });

  it('a Leader that is not {Land of Wano} is not set active', () => {
    const g = mk({ leader: restedLeader(RED_LEADER), hand: [ID] });
    play(g, ID);
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    expect(isRested(g, g.leader('p1'))).toBe(true);
  });

  it('Once Per Turn: after the first activation it is not offered again', () => {
    const g = mk({ leader: restedLeader(WANO_LEADER), hand: [ID] });
    play(g, ID);
    const id = at(g, 'p1', 'characters', ID);
    activateAb(g, id, 'activate');
    expect(canActivate(g, id, 'activate')).toBe(false);
  });

  it('an already active Leader stays active (nothing to do)', () => {
    const g = mk({ leader: WANO_LEADER, hand: [ID] });
    play(g, ID);
    activateAb(g, at(g, 'p1', 'characters', ID), 'activate');
    expect(isRested(g, g.leader('p1'))).toBe(false);
  });
});

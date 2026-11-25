/** EB02-006 Yamato. */
import { describe, expect, it } from 'vitest';
import {
  ACE_LEADER,
  activate,
  C1,
  canHit,
  don,
  mk,
  offeredAb,
  pick,
  WANO_LEADER,
} from './helpers-aeb2g1.ts';
import { dec, none } from './helpers.ts';

const ID = 'EB02-006';
const A = 'give-don';
const start = (leader: string, costArea = { active: 3, rested: 2 }, placed = true) =>
  mk(
    { leader, characters: [{ card: ID, playedThisTurn: placed }], costArea },
    { characters: [{ card: C1, rested: true }] },
  );

describe('EB02-006 Yamato', () => {
  it('{Land of Wano} Leader: gives 1 rested DON!! to the Leader and gains [Rush] this turn', () => {
    const g = start(WANO_LEADER);
    const me = g.find('p1', 'characters', ID);
    expect(canHit(g, me, g.leader('p2'))).toBe(false); // played this turn, no Rush yet
    activate(g, me, A);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(canHit(g, me, g.leader('p2'))).toBe(true);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.leader('p1')).don).toBe(0); // returned at the Refresh Phase
  });

  it('a [Portgas.D.Ace] Leader also qualifies', () => {
    const g = start(ACE_LEADER);
    activate(g, g.find('p1', 'characters', ID), A);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(canHit(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });

  it('any other Leader: nothing happens (no DON!!, no [Rush]) but Once Per Turn is spent', () => {
    const g = start('ST01-001');
    const me = g.find('p1', 'characters', ID);
    activate(g, me, A);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2, given: 0 });
    expect(canHit(g, me, g.leader('p2'))).toBe(false);
    expect(offeredAb(g, me, A)).toBe(false);
  });

  it('"up to 1": the DON!! may be declined, and [Rush] is granted anyway', () => {
    const g = start(WANO_LEADER);
    const me = g.find('p1', 'characters', ID);
    activate(g, me, A);
    none(g);
    expect(don(g, 'p1').given).toBe(0);
    expect(canHit(g, me, g.leader('p2'))).toBe(true);
  });

  it('with no rested DON!! nothing is given, yet "Then" still grants [Rush]', () => {
    const g = start(WANO_LEADER, { active: 4, rested: 0 });
    const me = g.find('p1', 'characters', ID);
    activate(g, me, A);
    expect(don(g, 'p1').given).toBe(0);
    expect(canHit(g, me, g.leader('p2'))).toBe(true);
  });

  it('is Once Per Turn, and a Character that was not just played attacks anyway', () => {
    const g = start(WANO_LEADER, { active: 3, rested: 2 }, false);
    const me = g.find('p1', 'characters', ID);
    expect(canHit(g, me, g.leader('p2'))).toBe(true);
    activate(g, me, A);
    expect(offeredAb(g, me, A)).toBe(false);
  });
});

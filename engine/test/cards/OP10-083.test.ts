/** OP10-083 Kouzuki Momonosuke. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  canActivate,
  canPick,
  DRESS_LEADER,
  DRESS_STAGE,
  expectDecision,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-083';
const start = (p1: object = {}) =>
  mk({ leader: DRESS_LEADER, characters: [ID], ...p1 }, { characters: [V.c3, V.c1] });

describe('OP10-083 Kouzuki Momonosuke', () => {
  it('rest this Character and your Dressrosa Leader: an opposing Character gets -2 cost this turn', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(1);
    expect(g.card(g.find('p2', 'characters', V.c1)).cost).toBe(1);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a Dressrosa Stage can be the second rested card', () => {
    const g = start({ leader: OTHER_LEADER, stage: DRESS_STAGE });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'stage', DRESS_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('"up to 1": may choose nothing; the cost is paid anyway', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c3)).cost).toBe(3);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('only opposing Characters are targets', () => {
    const g = start({ characters: [ID, V.c2] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('must not be offered without a Dressrosa Leader or Stage, or when this Character is rested', () => {
    const noDress = start({ leader: OTHER_LEADER });
    expect(canActivate(noDress, noDress.find('p1', 'characters', ID), 'activate')).toBe(false);
    const rested = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(rested, rested.find('p1', 'characters', ID), 'activate')).toBe(false);
    const leaderRested = start({ leader: { card: DRESS_LEADER, rested: true } });
    expect(canActivate(leaderRested, leaderRested.find('p1', 'characters', ID), 'activate')).toBe(
      false,
    );
    expect(idsOf(noDress, 'p2', 'characters')).toEqual([V.c3, V.c1]);
  });
});

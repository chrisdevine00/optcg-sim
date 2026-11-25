/** OP10-091 Brook. */
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
  trash,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-091';
const start = (p1: object = {}) =>
  mk(
    { leader: DRESS_LEADER, characters: [ID], deck: [V.c1, V.c2, V.c3], ...p1 },
    { characters: [V.c1, V.c2] },
  );

describe('OP10-091 Brook', () => {
  it('rest this Character and your Dressrosa Leader: K.O. a Character with cost 1 or less, then trash 2 from the deck', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // cost 1 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('"up to 1": with no K.O. the deck is still trashed', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
  });

  it('with no target at all the deck is still trashed', () => {
    const g = mk({ leader: DRESS_LEADER, characters: [ID], deck: [V.c1, V.c2, V.c3] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
  });

  it('a Dressrosa Stage can be the second rested card', () => {
    const g = start({ leader: OTHER_LEADER, stage: DRESS_STAGE });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'stage', DRESS_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('must not be offered without a Dressrosa Leader or Stage, or when this Character is rested', () => {
    const a = start({ leader: OTHER_LEADER });
    expect(canActivate(a, a.find('p1', 'characters', ID), 'activate')).toBe(false);
    const b = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(b, b.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

/** OP10-088 Nami. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  canActivate,
  DRESS_LEADER,
  DRESS_STAGE,
  hand,
  idsOf,
  mk,
  OTHER_LEADER,
  trash,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-088';
const start = (p1: object = {}) =>
  mk({ leader: DRESS_LEADER, characters: [ID], deck: [V.c1, V.c2, V.c3, V.c4], ...p1 });

describe('OP10-088 Nami', () => {
  it('rest this Character and your Dressrosa Leader: draw 1, then trash 2 from the top of the deck', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([V.c3, V.c2]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c4]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('a Dressrosa Stage can be the second rested card, the Leader stays active', () => {
    const g = start({ leader: OTHER_LEADER, stage: DRESS_STAGE });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(g.card(g.find('p1', 'stage', DRESS_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('with only 2 cards in the deck it draws one and trashes the last', () => {
    const g = start({ deck: [V.c1, V.c2] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(trash(g, 'p1')).toEqual([V.c2]);
  });

  it('must not be offered without a Dressrosa Leader or Stage', () => {
    const g = start({ leader: OTHER_LEADER });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('must not be offered when this Character is rested or the Leader is already rested', () => {
    const a = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(a, a.find('p1', 'characters', ID), 'activate')).toBe(false);
    const b = start({ leader: { card: DRESS_LEADER, rested: true } });
    expect(canActivate(b, b.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

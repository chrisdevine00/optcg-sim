/** OP10-087 Tony Tony.Chopper. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  canActivate,
  DRESS_LEADER,
  DRESS_STAGE,
  expectDecision,
  hand,
  idsOf,
  mk,
  OTHER_LEADER,
  pick,
  rep,
  trash,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-087';
const start = (theirHand: number, p1: object = {}) =>
  mk(
    { leader: DRESS_LEADER, characters: [ID], deck: [V.c1, V.c2, V.c3, V.c4], ...p1 },
    { hand: [V.c5, ...rep(theirHand - 1, V.c1)] },
  );

describe('OP10-087 Tony Tony.Chopper', () => {
  it('with 5 or more cards in the opponent hand: they trash 1 (they choose), then you trash 2 from the deck', () => {
    const g = start(5);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', V.c5)]);
    expect(trash(g, 'p2')).toEqual([V.c5]);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c3, V.c4]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('with 4 cards (boundary) nothing happens, and the deck is not trashed (the "Then" is inside the "If")', () => {
    const g = start(4);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(trash(g, 'p2')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([]);
    // the cost was still paid
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('with 6 cards the opponent trashes only 1', () => {
    const g = start(6);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p2', 'hand', V.c5)]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toEqual([V.c5]);
  });

  it('a Dressrosa Stage can be the second rested card', () => {
    const g = start(5, { leader: OTHER_LEADER, stage: DRESS_STAGE });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p2', 'hand', V.c5)]);
    expect(g.card(g.find('p1', 'stage', DRESS_STAGE)).rested).toBe(true);
    expect(trash(g, 'p1')).toEqual([V.c2, V.c1]);
  });

  it('must not be offered without a Dressrosa Leader or Stage', () => {
    const g = start(5, { leader: OTHER_LEADER });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

/** OP09-089 Stronger. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB_LEADER,
  canActivate,
  canPick,
  expectDecision,
  handIds,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-089';
const start = (p1: object = {}) =>
  mk(
    { leader: BB_LEADER, characters: [ID], hand: [V.c1, V.c2], deck: [V.c4, V.c5, V.c6], ...p1 },
    { characters: [V.c5, V.c2] },
  );

describe('OP09-089 Stronger', () => {
  it('[Activate: Main] trash 1 card and this Character: with a {Blackbeard Pirates} Leader, draw 1, then an opposing Character gets -2 cost', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]); // the cost
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toEqual(expect.arrayContaining([ID, V.c1]));
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(3);
    expect(g.card(g.find('p2', 'characters', V.c2)).cost).toBe(2);
    expect(handIds(g, 'p1')).toEqual([V.c2, V.c4]); // 2 - 1 + 1 drawn
  });

  it('"up to 1": may give -2 cost to nothing (the draw still happens)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(handIds(g, 'p1')).toHaveLength(2);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('without a {Blackbeard Pirates} Leader the cost is paid and neither the draw nor the -2 cost happens', () => {
    const g = start({ leader: OTHER_LEADER });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(handIds(g, 'p1')).toEqual([V.c2]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('must not be offered with an empty hand (the cost needs 1 card)', () => {
    const g = start({ hand: [] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

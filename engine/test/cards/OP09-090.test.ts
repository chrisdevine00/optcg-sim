/** OP09-090 Doc Q. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  addCost,
  BB_LEADER,
  canActivate,
  canPick,
  expectDecision,
  handIds,
  idsOf,
  koBy,
  mk,
  none,
  OTHER_LEADER,
  pick,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-090';
const ZERO = 'OP13-014'; // a vanilla with cost 1, 0 power (Red)
const start = (p1: object = {}) =>
  mk({ leader: BB_LEADER, characters: [ID], ...p1 }, { characters: [ZERO, V.c1, V.c2] });

describe('OP09-090 Doc Q', () => {
  it('[Activate: Main] rest this Character: K.O. up to 1 opposing Character with cost 1 or less', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', ZERO))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // cost 1: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // cost 2
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([ZERO, V.c2]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c1]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
  });

  it('the cost limit is the current cost: a -1 cost modifier makes a cost 2 Character eligible', () => {
    const g = start();
    addCost(g, 'p2', V.c2, -1);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
  });

  it('must not K.O. without a {Blackbeard Pirates} Leader (the Character is still rested)', () => {
    const g = start({ leader: OTHER_LEADER });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('must not be offered when rested', () => {
    const g = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('[On K.O.] draws 1 card', () => {
    const g = start();
    const before = handIds(g, 'p1').length;
    koBy(g, 'p1', ID, 'p2');
    expect(handIds(g, 'p1')).toHaveLength(before + 1);
  });
});

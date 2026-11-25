/** OP09-083 Van Augur. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB_LEADER,
  canActivate,
  canPick,
  expectDecision,
  handIds,
  koBy,
  mk,
  none,
  OTHER_LEADER,
  pick,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-083';
const start = (p1: object = {}) =>
  mk({ leader: BB_LEADER, characters: [ID], ...p1 }, { characters: [V.c5, V.c2] });

describe('OP09-083 Van Augur', () => {
  it('[Activate: Main] rest this Character: with a {Blackbeard Pirates} Leader, an opposing Character gets -3 cost this turn', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(2);
    expect(g.card(g.find('p2', 'characters', V.c2)).cost).toBe(2);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('only opposing Characters are offered, and "up to 1" may choose nothing (the rest is paid)', () => {
    const g = start({ characters: [ID, V.c3] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('the cost can go below 0 for the check but not the printed cost: -3 on a cost 2 Character leaves 0 or less', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c2)).cost).toBeLessThanOrEqual(0);
  });

  it('must not give -3 cost without a {Blackbeard Pirates} Leader (the Character is still rested)', () => {
    const g = start({ leader: OTHER_LEADER });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('must not be offered when this Character is rested', () => {
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

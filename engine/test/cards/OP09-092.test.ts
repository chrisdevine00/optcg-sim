/** OP09-092 Marshall.D.Teach (Whitebeard Pirates). */
import { describe, expect, it } from 'vitest';
import {
  activate,
  canActivate,
  expectDecision,
  handIds,
  mk,
  pick,
  times,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-092';
const start = (mine: number, theirs: number) =>
  mk(
    { characters: [ID], hand: times(mine, V.c1), deck: [V.c4, V.c5, V.c6, V.c7] },
    { hand: times(theirs, V.c2) },
  );

describe('OP09-092 Marshall.D.Teach', () => {
  it('[Activate: Main] rest this Character: with at least 3 fewer cards in hand than your opponent, draw 2 and trash 1', () => {
    const g = start(1, 4); // exactly 3 fewer: boundary
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    const drawn = g.find('p1', 'hand', V.c4);
    pick(g, [drawn]);
    expect(handIds(g, 'p1')).toHaveLength(2); // 1 + 2 - 1
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([V.c4]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('the trash can be any card in hand, a drawn one included', () => {
    const g = start(0, 3);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
  });

  it('a larger gap works too', () => {
    const g = start(0, 6);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(handIds(g, 'p1')).toHaveLength(1);
  });

  it('must not draw with only 2 fewer cards (the cost, resting, is still paid)', () => {
    const g = start(2, 4);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(handIds(g, 'p1')).toHaveLength(2);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('must not draw with more cards than the opponent', () => {
    const g = start(5, 1);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(handIds(g, 'p1')).toHaveLength(5);
  });

  it('must not be offered when this Character is rested', () => {
    const g = mk({ characters: [{ card: ID, rested: true }] }, { hand: times(5, V.c2) });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

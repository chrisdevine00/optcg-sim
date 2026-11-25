/** OP10-082 Kuzan. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB4,
  BB5,
  BB6,
  canActivate,
  canPick,
  DRESS2,
  expectDecision,
  hand,
  idsOf,
  koBy,
  KUZAN,
  mk,
  none,
  pick,
  V,
} from './helpers-a10g3.ts';

const ID = KUZAN;
const start = (p1: object = {}) =>
  mk({
    characters: [ID],
    trash: [BB4, BB5, BB6, DRESS2, KUZAN],
    deck: [V.c1, V.c2],
    ...p1,
  });

describe('OP10-082 Kuzan: cannot be removed by opponent effects', () => {
  it("an opponent's effect cannot K.O. it", () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('your own effect can K.O. it', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p1');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });
});

describe('OP10-082 Kuzan: [Activate: Main]', () => {
  it('trash this Character: draw 1, then play a Blackbeard Pirates Character with cost 5 or less from the trash', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', BB4))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', BB5))).toBe(true); // cost 5 boundary
    expect(canPick(g, g.find('p1', 'trash', BB6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'trash', DRESS2))).toBe(false); // not Blackbeard
    pick(g, [g.find('p1', 'trash', BB5)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([BB5]);
  });

  it('cannot play any [Kuzan], the trashed one (cost 5, Blackbeard Pirates) included', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    // the trash holds the other copy and the one just trashed: neither can be picked
    expect(idsOf(g, 'p1', 'trash').filter((c) => c === KUZAN)).toHaveLength(2);
    for (let n = 0; n < 2; n++) expect(canPick(g, g.find('p1', 'trash', KUZAN, n))).toBe(false);
  });

  it('"up to 1": the play may be skipped, the draw still happens', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('is offered while on the field (no DON!! needed)', () => {
    const g = start();
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });
});

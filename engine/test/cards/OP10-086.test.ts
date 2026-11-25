/** OP10-086 Shiryu. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  addCost,
  BB_LEADER,
  canActivate,
  canPick,
  expectDecision,
  game,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  PLAIN_BLUE,
  pick,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-086';
const start = (p1: object = {}, p2: string[] = [V.c1, V.c3, V.c4]) =>
  mk(
    { leader: BB_LEADER, characters: [{ card: ID, playedThisTurn: true }], ...p1 },
    { characters: p2 },
  );

describe("OP10-086 Shiryu: [Opponent's Turn]", () => {
  it("gains +2000 power on your opponent's turn only", () => {
    const mine = start();
    expect(mine.power(mine.find('p1', 'characters', ID))).toBe(5000);
    const theirs = game(
      { leader: BB_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(theirs.power(theirs.find('p1', 'characters', ID))).toBe(7000);
  });
});

describe('OP10-086 Shiryu: [Activate: Main] [Once Per Turn]', () => {
  it('with a Blackbeard Pirates Leader, played this turn: K.O. a Character with a base cost of 3 or less', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // base cost 3 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c4]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c3]);
  });

  it('reads the BASE cost: a raised cost still qualifies, a lowered one does not', () => {
    const g = start();
    addCost(g, 'p2', V.c3, 2); // current cost 5, base 3
    addCost(g, 'p2', V.c4, -2); // current cost 2, base 4
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c3, V.c4]);
  });

  it('Once Per Turn: it cannot be activated twice', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it("must not K.O. when it was not played this turn: still offered, spends the turn's use, does nothing", () => {
    const g = start({ characters: [ID] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c3, V.c4]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('must not K.O. without a Blackbeard Pirates Leader', () => {
    const g = start({ leader: OTHER_LEADER });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c3, V.c4]);
  });
});

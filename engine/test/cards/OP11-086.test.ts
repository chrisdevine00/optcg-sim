/** OP11-086 Coribou. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import {
  activate,
  canPick,
  CARIBOU3,
  CARIBOU4,
  CARIBOU5,
  idsOf,
  mk,
  offeredAb,
} from './helpers-op11g3.ts';

const ID = 'OP11-086';

describe('OP11-086 Coribou', () => {
  it('[On Play]: trash 1 card from your hand', () => {
    const g = mk({ hand: [ID, V.c1, V.c2] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c2]);
  });

  it('[On Play] with an empty hand trashes nothing', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });

  const start = (trash: string[]) => mk({ characters: [ID], trash });

  it('[Activate: Main]: trash this: play up to 1 [Caribou] with cost 4 or less from your trash', () => {
    const g = start([CARIBOU3, CARIBOU4, CARIBOU5, V.c3]);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(canPick(g, g.find('p1', 'trash', CARIBOU3))).toBe(true);
    expect(canPick(g, g.find('p1', 'trash', CARIBOU4))).toBe(true); // cost 4 is the boundary
    expect(canPick(g, g.find('p1', 'trash', CARIBOU5))).toBe(false);
    expect(canPick(g, g.find('p1', 'trash', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'trash', CARIBOU4)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([CARIBOU4]);
    expect(idsOf(g, 'p1', 'trash')).toContain(ID);
    expectDecision(g, 'main', 'p1');
  });

  it('"up to 1": may play nothing, and Coribou stays trashed', () => {
    const g = start([CARIBOU3]);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash').sort()).toEqual([CARIBOU3, ID].sort());
  });

  it('Coribou itself is not a [Caribou]: with none in the trash nothing is played', () => {
    const g = start([BLUE, CARIBOU5]);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    if (dec(g)?.kind === 'choose') none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(idsOf(g, 'p1', 'trash')).toContain(ID);
  });

  it('is offered even with no [Caribou] in the trash (the cost can be paid)', () => {
    const g = start([]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });
});

/** OP14-069 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, payDon, pick, play, V } from './helpers.ts';
import { canPick, DP_LEADER, idsOf, mine, mode, OTHER_LEADER, plant } from './helpers-op14g3.ts';

const ID = 'OP14-069';
/** Cost 9 (ST04-003) and cost 8 (OP14-101) Characters for the "cost 8 or less" boundary. */
const COST9 = 'ST04-003';
const COST8 = 'OP14-101';

describe('OP14-069 Donquixote Doflamingo', () => {
  const start = (leader: string, opp: string[]) =>
    mine(leader, { hand: [ID] }, { characters: opp }, 10);
  const go = (g: ReturnType<typeof start>) => {
    play(g, ID);
    accept(g);
    payDon(g);
  };

  it('[On Play] DON!! -3, mode 1: K.O. up to 1 opposing Character with a cost of 8 or less', () => {
    const g = start(DP_LEADER, [COST8, COST9, V.c1]);
    go(g);
    expect(don(g, 'p1').deck).toBe(3);
    mode(g, 0);
    expect(canPick(g, g.find('p2', 'characters', COST8))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', COST9))).toBe(false);
    pick(g, [g.find('p2', 'characters', COST8)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([COST8]);
  });

  it('mode 1 does nothing with a Leader that is not {Donquixote Pirates} (the mode may still be chosen)', () => {
    const g = start(OTHER_LEADER, [V.c1]);
    go(g);
    mode(g, 0);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('mode 2: up to 3 opposing Characters with a cost of 7 or less cannot be rested', () => {
    const g = start(OTHER_LEADER, [V.c1, V.c2, V.c3, V.c4, COST8]);
    go(g);
    mode(g, 1);
    expect(canPick(g, g.find('p2', 'characters', COST8))).toBe(false);
    pick(g, [
      g.find('p2', 'characters', V.c1),
      g.find('p2', 'characters', V.c2),
      g.find('p2', 'characters', V.c3),
    ]);
    plant(g, 'p1', { rest: { from: 'characters', owner: 'opponent' } });
    for (const c of [V.c1, V.c2, V.c3]) {
      expect(g.card(g.find('p2', 'characters', c)).rested).toBe(false);
    }
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', COST8)).rested).toBe(true);
  });

  it('mode 2 may choose fewer than 3 (up to)', () => {
    const g = start(DP_LEADER, [V.c1, V.c2]);
    go(g);
    mode(g, 1);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    plant(g, 'p1', { rest: { from: 'characters', owner: 'opponent' } });
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
  });

  it('declining the DON!! -3: no choice, no DON!! returned', () => {
    const g = start(DP_LEADER, [V.c1]);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').deck).toBe(0);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });
});

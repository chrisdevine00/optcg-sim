/** OP09-115 Ice Block Partisan (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  addCost,
  canPick,
  damageGame,
  expectDecision,
  hand,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  TRIG2,
  TRIG3,
  TRIG4,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-115';

describe('OP09-115 Ice Block Partisan: [Main]', () => {
  const start = () => mk({ hand: [ID] }, { characters: [TRIG2, TRIG3, TRIG4, V.c3, V.c1] });

  it("K.O. up to 1 of your opponent's Characters with a cost of 3 or less and a [Trigger]", () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', TRIG2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', TRIG3))).toBe(true); // cost 3: the boundary
    expect(canPick(g, g.find('p2', 'characters', TRIG4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // no [Trigger]
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false);
    pick(g, [g.find('p2', 'characters', TRIG3)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([TRIG3]);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(4);
  });

  it('current cost counts: a cost-3 Character with +1 cost (4) is no longer eligible', () => {
    const g = start();
    // TRIG3 (3) is raised to 4: not eligible any more.
    addCost(g, 'p2', TRIG3, 1);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', TRIG3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', TRIG2))).toBe(true);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(5);
  });

  it('only Characters of the opponent can be chosen', () => {
    const g = mk({ hand: [ID], characters: [TRIG2] }, { characters: [TRIG3] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', TRIG2))).toBe(false);
    pick(g, [g.find('p2', 'characters', TRIG3)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([TRIG2]);
  });

  it("nothing eligible: nothing is K.O.'d", () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1, TRIG4] });
    play(g, ID);
    // The field is public: no choice is asked when nothing is eligible.
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });
});

describe('OP09-115 Ice Block Partisan: [Trigger]', () => {
  it('draws 1 card', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER, deck: [V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});

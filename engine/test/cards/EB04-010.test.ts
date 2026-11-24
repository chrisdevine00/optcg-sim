/** EB04-010 Lulucia Kingdom (Stage). */
import { describe, expect, it } from 'vitest';
import { none, pick, play } from './helpers.ts';
import { boost } from './helpers-op15g1.ts';
import { at, mk, oppTurn, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-010';

describe('EB04-010 Lulucia Kingdom', () => {
  it("[Opponent's Turn]: your Characters with a base cost of 1 get +5000 (3000 -> 8000); others do not", () => {
    const g = mk({ leader: RED_LEADER, stage: ID, characters: [V.c1, V.c2] }, {}, oppTurn);
    expect(g.power(at(g, 'p1', 'characters', V.c1))).toBe(8000);
    expect(g.power(at(g, 'p1', 'characters', V.c2))).toBe(4000);
  });

  it('on your own turn there is no bonus', () => {
    const g = mk({ leader: RED_LEADER, stage: ID, characters: [V.c1] });
    expect(g.power(at(g, 'p1', 'characters', V.c1))).toBe(3000);
  });

  it("the opponent's cost-1 Characters and your Leader are not affected", () => {
    const g = mk({ leader: RED_LEADER, stage: ID }, { characters: [V.c1] }, oppTurn);
    expect(g.power(at(g, 'p2', 'characters', V.c1))).toBe(3000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("without the Stage there is no bonus on the opponent's turn", () => {
    const g = mk({ leader: RED_LEADER, characters: [V.c1] }, {}, oppTurn);
    expect(g.power(at(g, 'p1', 'characters', V.c1))).toBe(3000);
  });

  it('[On Play]: sets the power of up to 1 opposing Character to 0 during this turn', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c5, V.c3] });
    play(g, ID);
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(0);
    expect(g.power(at(g, 'p2', 'characters', V.c3))).toBe(5000);
  });

  it('reading (M6b-Q9): the set is a base power, so a later +2000 this turn still adds', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    boost(g, at(g, 'p2', 'characters', V.c5), 2000);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(2000);
  });

  it('"up to 1": may be skipped', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
  });
});

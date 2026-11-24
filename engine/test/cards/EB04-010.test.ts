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

  it('B4T-R1: power the target already has (an earlier +2000) does not survive; a later +2000 still adds', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c5] });
    const t = at(g, 'p2', 'characters', V.c5);
    boost(g, t, 2000);
    expect(g.power(t)).toBe(9000);
    play(g, ID);
    pick(g, [t]);
    expect(g.power(t)).toBe(0);
    boost(g, t, 2000);
    expect(g.power(t)).toBe(2000);
  });

  it('B4T-R1: several buffs and a debuff on the target are all cancelled (resolved power, not one layer)', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c5] });
    const t = at(g, 'p2', 'characters', V.c5);
    boost(g, t, 3000);
    boost(g, t, -1000);
    expect(g.power(t)).toBe(9000);
    play(g, ID);
    pick(g, [t]);
    expect(g.power(t)).toBe(0);
  });

  it("the 0 lasts the turn only (given DON!! on its owner's side add nothing on my turn)", () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [{ card: V.c5, don: 2 }] });
    const t = at(g, 'p2', 'characters', V.c5);
    expect(g.power(t)).toBe(7000); // the opponent's DON!! add power on the opponent's turn only
    play(g, ID);
    pick(g, [t]);
    expect(g.power(t)).toBe(0);
    g.act({ type: 'endTurn' });
    expect(g.power(t)).toBe(7000);
  });

  it('"up to 1": may be skipped', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    none(g);
    expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
  });
});

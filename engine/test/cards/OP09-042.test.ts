/** OP09-042 Buggy (Leader). */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { activate, canPick, CG, EVENT, ids, mk, offeredAb } from './helpers-a09g1.ts';

const ID = 'OP09-042';
const AB = 'activate';

describe('OP09-042 Buggy', () => {
  it('[Activate: Main]: rest 5 DON!! and trash 1 card from your hand: play up to 1 {Cross Guild} Character from your hand', () => {
    const g = mk({ leader: ID, hand: [CG.c5, V.c1] });
    activate(g, g.leader('p1'), AB);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', CG.c5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([CG.c5]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only a {Cross Guild} Character card can be played (not another Character, not an Event)', () => {
    const g = mk({ leader: ID, hand: [CG.c5, V.c3, EVENT, V.c1] });
    activate(g, g.leader('p1'), AB);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(canPick(g, g.find('p1', 'hand', CG.c5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', EVENT))).toBe(false);
  });

  it('"up to 1": the cost stays paid when you play nothing', () => {
    const g = mk({ leader: ID, hand: [CG.c5, V.c1] });
    activate(g, g.leader('p1'), AB);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([CG.c5]);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('the trashed card may be a {Cross Guild} Character, and another one is then played', () => {
    const g = mk({ leader: ID, hand: [CG.c5, CG.c6] });
    activate(g, g.leader('p1'), AB);
    pick(g, [g.find('p1', 'hand', CG.c6)]);
    expect(canPick(g, g.find('p1', 'hand', CG.c5))).toBe(true);
    pick(g, [g.find('p1', 'hand', CG.c5)]);
    expect(trash(g, 'p1')).toEqual([CG.c6]);
    expect(ids(g, 'p1', 'characters')).toEqual([CG.c5]);
  });

  it('is not offered with only 4 active DON!! or with an empty hand', () => {
    const few = mk({ leader: ID, hand: [CG.c5, V.c1], costArea: { active: 4, rested: 6 } });
    expect(offeredAb(few, few.leader('p1'), AB)).toBe(false);
    const empty = mk({ leader: ID, hand: [] });
    expect(offeredAb(empty, empty.leader('p1'), AB)).toBe(false);
  });

  it('has no Once Per Turn: with 10 DON!! it can be used twice', () => {
    const g = mk({ leader: ID, hand: [CG.c5, CG.c6, V.c1, V.c2] });
    activate(g, g.leader('p1'), AB);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'hand', CG.c5)]);
    expect(offeredAb(g, g.leader('p1'), AB)).toBe(true);
    activate(g, g.leader('p1'), AB);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    pick(g, [g.find('p1', 'hand', CG.c6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([CG.c5, CG.c6]);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1').rested).toBe(10);
  });
});

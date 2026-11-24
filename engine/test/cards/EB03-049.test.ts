/** EB03-049 I Knew You People Were Behind This. */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, expectDecision, none, pick, play, V } from './helpers.ts';
import { counterStep, donArea, useCounter } from './helpers-luffyace.ts';
import {
  canPick,
  cardsIn,
  mk,
  PERONA_LEADER,
  RED_LEADER,
  TBP2,
  TBP4,
  TBP6,
  TBP8,
} from './helpers-eb03g2.ts';

const ID = 'EB03-049';
/** [Gecko Moria]-less cost 5 {Thriller Bark Pirates} (OP14-033, [On Play] only, inert here). */
const TBP5 = 'OP14-033';

describe('EB03-049 I Knew You People Were Behind This.', () => {
  it('[Main] rest 7 DON!!, with [Perona] as Leader: plays a cost 6 or less and a cost 4 or less {Thriller Bark Pirates} Character, from hand or trash', () => {
    const g = mk({ leader: PERONA_LEADER, hand: [ID, TBP6], trash: [TBP4, V.c2] });
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 8 });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', TBP6)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'trash', TBP4)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([TBP4, TBP6].sort());
    expect(cardsIn(g, 'p1', 'trash').sort()).toEqual([V.c2, ID].sort());
  });

  it('boundaries: cost 7+ is never offered, cost 5 and 6 only for the cost-6 pick', () => {
    const g = mk({ leader: PERONA_LEADER, hand: [ID, TBP8, TBP5, TBP6, TBP4] });
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', TBP8))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', TBP5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', TBP6))).toBe(true);
    pick(g, [g.find('p1', 'hand', TBP5)]);
    // Second pick: cost 4 or less only.
    expect(canPick(g, g.find('p1', 'hand', TBP6))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', TBP8))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', TBP4))).toBe(true);
    pick(g, [g.find('p1', 'hand', TBP4)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([TBP4, TBP5].sort());
  });

  it('"up to 1 ... and up to 1": a cost 4 card can fill the first pick but never both', () => {
    const g = mk({ leader: PERONA_LEADER, hand: [ID, TBP4] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', TBP4)]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([TBP4]);
  });

  it('either pick may be left empty ("up to")', () => {
    const g = mk({ leader: PERONA_LEADER, hand: [ID], trash: [TBP2, TBP6] });
    play(g, ID);
    accept(g);
    none(g);
    pick(g, [g.find('p1', 'trash', TBP2)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([TBP2]);
  });

  it('a Leader other than [Perona]: the DON!! are rested and nothing is played', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID, TBP6], trash: [TBP4] });
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(don(g, 'p1').rested).toBe(8);
  });

  it('the 7-DON!! cost is optional, and cannot be paid with fewer than 7 left after the Event cost', () => {
    const g = mk({ leader: PERONA_LEADER, hand: [ID, TBP6] });
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').rested).toBe(1);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    const h = mk({ leader: PERONA_LEADER, hand: [ID, TBP6], costArea: { active: 7, rested: 0 } });
    play(h, ID);
    expectDecision(h, 'optional', 'p1');
    expect(h.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(h);
    expect(don(h, 'p1')).toMatchObject({ active: 6, rested: 1 });
    expect(cardsIn(h, 'p1', 'characters')).toEqual([]);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterStep({ leader: PERONA_LEADER, hand: [ID], ...donArea(3) });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});

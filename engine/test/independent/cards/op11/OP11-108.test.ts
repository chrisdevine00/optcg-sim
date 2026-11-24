/**
 * OP11-108 Neptune (Character, Yellow, cost 5, 7000, no Counter, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[On Play] If your Leader is [Shirahoshi], you may turn 1 card from the top of your Life
 * cards face-down: Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-3-2 (If), CR 8-3-1-4 (cost), CR 1-3-2-1 (needs a face-up top Life card), CR 8-4-4
 * (the trash is an exact count, chosen by me from the hand after drawing).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cnt,
  hand,
  kind,
  LD11,
  lifeFaces,
  lifeUp,
  me,
  need,
  no,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SC11,
  trash,
  unusable,
  up,
  yes,
  type LifeRow,
} from './kit-op11c.ts';

const ID = 'OP11-108';

function start(
  o: {
    leader?: string;
    life?: LifeRow;
    hand?: string[];
    deck?: string[];
  } = {},
) {
  const g = me(
    o.leader ?? LD11.shirahoshi,
    {
      hand: [ID, ...(o.hand ?? [SC11.r1])],
      life: o.life ?? lifeUp(4),
      deck: o.deck ?? [SC11.r2, SC11.r3, SC11.r4, SC11.r5, SC11.r6],
    },
    {},
  );
  playRaw(g, ID);
  return g;
}

describe('OP11-108 Neptune: with a [Shirahoshi] Leader, turn my top Life card face-down to draw 2 and trash 1', () => {
  it('printed effect: draw 2, then trash 1 card of my choice from my hand', () => {
    const g = start();
    yes(g, 'p1');
    expect(lifeFaces(g)).toEqual([false, true, true, true]);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    expect(hand(g)).toEqual([SC11.r2, SC11.r3].sort());
    expect(trash(g)).toEqual([SC11.r1]);
    expect(kind(g)).toBe('main');
  });

  it('the trashed card may be one I just drew', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(reachablePickSets(g).size).toBe(3);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r2)]);
    expect(hand(g)).toEqual([SC11.r1, SC11.r3].sort());
  });

  it('every card in hand (old and drawn) is a candidate, the played Neptune is not', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(ID);
    expect(offeredIds(g).length).toBeGreaterThan(0);
  });

  it('net hand size: +2 drawn −1 trashed', () => {
    const g = start();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    expect(cnt(g, 'p1', 'hand')).toBe(2);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('"you may": declining draws and trashes nothing and leaves Life face-up', () => {
    const g = start();
    no(g, 'p1');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
    expect(kind(g)).toBe('main');
  });

  it('a Leader that is not [Shirahoshi]: no draw, no trash, Life unchanged', () => {
    const g = start({ leader: LD11.plain });
    if (kind(g) === 'optional') unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(lifeFaces(g)).toEqual([true, true, true, true]);
  });

  it('unpayable: a face-down top Life card cannot be turned face-down', () => {
    const g = start({ life: [SC11.r1, up(SC11.r2)] });
    unusable(g, 'p1');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(kind(g)).toBe('main');
  });

  it('unpayable: no Life cards', () => {
    const g = start({ life: [] });
    unusable(g, 'p1');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('the cards come from the top of my deck, in order', () => {
    const g = start({ deck: [SC11.r7, SC11.r6, SC11.r5, SC11.r4] });
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    expect(hand(g)).toEqual([SC11.r7, SC11.r6].sort());
  });
});

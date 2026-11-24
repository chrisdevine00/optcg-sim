/**
 * OP11-091 Berry Good (Character, Black, cost 4, 5000, Counter +2000, {Navy}).
 *
 * Card text: "[On Play] Your opponent places 3 Events from their trash at the bottom of their deck in
 * any order."
 *
 * Rules: the opponent chooses which of their own Events go (E-Q5 style: they place them), CR 1-3-2
 * (as many as possible when there are fewer), CR 3-2-2 / bottom-order (the owner orders the cards
 * they place). Events in the opponent's trash: ST01-014 Guard Point, OP11-099, EB05-020, OP07-076.
 */
import { describe, expect, it } from 'vitest';
import {
  cnt,
  deckBottom,
  deckSize,
  kind,
  LD11,
  me,
  need,
  offeredIds,
  orderFirst,
  pickInst,
  playRaw,
  SC11,
  trash,
  zoneIds,
} from './kit-op11c.ts';

const ID = 'OP11-091';
const E1 = 'ST01-014';
const E2 = 'OP11-099';
const E3 = 'EB05-020';
const E4 = 'OP07-076';

function play(oppTrash: string[]) {
  const g = me(LD11.plain, { hand: [ID] }, { trash: oppTrash });
  playRaw(g, ID);
  return g;
}

function settle(g: ReturnType<typeof play>) {
  while (kind(g) === 'order') orderFirst(g, 'p2');
}

describe('OP11-091 Berry Good: my opponent bottoms 3 Events from their trash', () => {
  it('printed effect: of 4 Events the opponent chooses 3; the fourth stays in their trash', () => {
    const g = play([E1, E2, E3, E4]);
    const d = need(g, 'choose', 'p2');
    expect(d.min).toBe(3);
    expect(d.max).toBe(3);
    const t = zoneIds(g, 'p2', 'trash');
    pickInst(g, [t[1]!, t[2]!, t[3]!]);
    settle(g);
    expect(trash(g, 'p2')).toEqual([E1]);
    expect(deckBottom(g, 'p2', 3).sort()).toEqual([E2, E3, E4].sort());
    expect(deckSize(g, 'p2')).toBe(18);
    expect(kind(g)).toBe('main');
  });

  it('only Events can be chosen: Characters in their trash are never offered', () => {
    const g = play([SC11.r1, E1, SC11.r2, E2, E3, SC11.r3, E4]);
    need(g, 'choose', 'p2');
    const offered = offeredIds(g);
    expect(offered.length).toBeGreaterThan(0);
    for (const c of offered) expect([E1, E2, E3, E4]).toContain(c);
  });

  it('exactly 3 Events: all 3 go (with or without a prompt), the Characters stay', () => {
    const g = play([E1, SC11.r1, E2, E3]);
    if (kind(g) === 'choose')
      pickInst(
        g,
        zoneIds(g, 'p2', 'trash').filter((_, i) => i !== 1),
      );
    settle(g);
    expect(trash(g, 'p2')).toEqual([SC11.r1]);
    expect(deckBottom(g, 'p2', 3).sort()).toEqual([E1, E2, E3].sort());
  });

  it('only 2 Events: both go and the effect does not wait for a third', () => {
    const g = play([E1, SC11.r1, E2]);
    if (kind(g) === 'choose')
      pickInst(g, [zoneIds(g, 'p2', 'trash')[0]!, zoneIds(g, 'p2', 'trash')[2]!]);
    settle(g);
    expect(trash(g, 'p2')).toEqual([SC11.r1]);
    expect(deckBottom(g, 'p2', 2).sort()).toEqual([E1, E2].sort());
    expect(kind(g)).toBe('main');
  });

  it('no Events in their trash: nothing happens and nobody is asked anything', () => {
    const g = play([SC11.r1, SC11.r2]);
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p2', 'trash')).toBe(2);
    expect(deckSize(g, 'p2')).toBe(15);
  });

  it('an empty opponent trash: nothing happens', () => {
    const g = play([]);
    expect(kind(g)).toBe('main');
    expect(deckSize(g, 'p2')).toBe(15);
  });

  it('the opponent (not me) is the one asked to choose and order', () => {
    const g = play([E1, E2, E3, E4]);
    need(g, 'choose', 'p2');
    const t = zoneIds(g, 'p2', 'trash');
    pickInst(g, [t[0]!, t[1]!, t[2]!]);
    if (kind(g) === 'order') need(g, 'order', 'p2');
    settle(g);
    expect(kind(g)).toBe('main');
  });

  it('my own trash is untouched: my Events stay where they are', () => {
    const g = me(LD11.plain, { hand: [ID], trash: [E1, E2, E3] }, { trash: [E1, E2, E3] });
    playRaw(g, ID);
    if (kind(g) === 'choose') pickInst(g, zoneIds(g, 'p2', 'trash'));
    settle(g);
    expect(trash(g, 'p1')).toEqual([E1, E2, E3].sort());
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the Events go to the bottom of the deck: the top card of their deck is unchanged', () => {
    const g = me(
      LD11.plain,
      { hand: [ID] },
      { trash: [E1, E2, E3], deck: [SC11.r4, SC11.r5, SC11.r6] },
    );
    playRaw(g, ID);
    if (kind(g) === 'choose') pickInst(g, zoneIds(g, 'p2', 'trash'));
    settle(g);
    expect(g.zone('p2', 'deck')[0]!.card).toBe(SC11.r4);
    expect(deckSize(g, 'p2')).toBe(6);
  });
});

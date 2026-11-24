/**
 * OP13-067 Scopper Gaban (Character, Purple, cost 6, 7000, Counter +1000, {Roger Pirates}).
 *
 * Card text: "[On Play] If your Leader's type includes "Roger Pirates", draw 2 cards and trash 1 card
 * from your hand. Then, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: CR 2-4-3-1 ("type including"), CR 4-5-3 (draw), E-Q11 (the count), RD 122 (CR 4-10-1: after
 * a failed "If" the "Then" does not resolve), CR 3-9-3.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  atMain,
  canFinish,
  choices,
  countOptions,
  deck,
  don,
  hand,
  kind,
  LD13,
  me,
  need,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  trash,
  at,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-067';
const D1 = S13.c3;
const D2 = S13.c4;
const KEEP = S13.c5;

function play(
  leader: string,
  o: { hand?: string[]; deckTop?: string[]; active?: number; p2Leader?: string } = {},
): TestGame {
  return me(
    leader,
    {
      hand: [ID, ...(o.hand ?? [KEEP])],
      deck: [...(o.deckTop ?? [D1, D2]), ...Array.from({ length: 10 }, () => S13.filler)],
      costArea: { active: o.active ?? 6, rested: 0 },
    },
    {},
    o.p2Leader,
  );
}

describe('OP13-067 Scopper Gaban: [On Play] Roger Pirates Leader: draw 2, trash 1 from hand. Then add up to 1 DON!! rested', () => {
  it('draws 2, trashes the chosen hand card, then asks the DON!! count and adds 1 RESTED DON!!', () => {
    const g = play(LD13.rogerPiratesLeader);
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([D1, D2, KEEP].sort());
    pickInst(g, [at(g, 'p1', 'hand', KEEP)]);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toEqual([KEEP]);
    expect(deck(g)).toHaveLength(10);
    expect(don(g)).toMatchObject({
      active: before.active - 6,
      rested: before.rested + 6 + 1,
      deck: before.deck - 1,
    });
  });

  it('a card just drawn may be the one trashed', () => {
    const g = play(LD13.rogerPiratesLeader);
    playRaw(g, ID);
    pickInst(g, [at(g, 'p1', 'hand', D2)]);
    addDon(g, 0);
    expect(hand(g)).toEqual([D1, KEEP].sort());
    expect(trash(g)).toEqual([D2]);
  });

  it('the trash is exactly 1 card: it cannot be skipped', () => {
    const g = play(LD13.rogerPiratesLeader);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    expect(choices(g).length).toBeGreaterThan(1);
  });

  it('with only the two drawn cards in hand: draws 2, trashes 1 of them', () => {
    const g = play(LD13.rogerPiratesLeader, { hand: [] });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([D1, D2].sort());
    pickInst(g, [at(g, 'p1', 'hand', D1)]);
    addDon(g, 1);
    expect(hand(g)).toEqual([D2]);
    expect(trash(g)).toEqual([D1]);
  });

  it('"up to 1": choosing 0 DON!! adds nothing, the draw and trash stay done', () => {
    const g = play(LD13.rogerPiratesLeader);
    const before = don(g);
    playRaw(g, ID);
    pickInst(g, [at(g, 'p1', 'hand', KEEP)]);
    addDon(g, 0);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
    expect(hand(g)).toHaveLength(2);
  });

  it('{Roger Pirates} Leader ([Gol.D.Roger]) qualifies too', () => {
    const g = play(LD13.roger);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(10);
    expect(hand(g)).toHaveLength(3);
  });

  it('a Leader without a Roger Pirates type: nothing is drawn, trashed or added (the "Then" does not resolve either)', () => {
    const g = play(LD13.plain);
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KEEP]);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([]);
    expect(don(g).deck).toBe(before.deck);
    expect(kind(g)).toBe('main');
  });

  it('must not: the opponent’s Roger Pirates Leader does not count', () => {
    const g = play(LD13.plain, { p2Leader: LD13.rogerPiratesLeader });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KEEP]);
  });

  it('with an empty DON!! deck the DON!! count is not asked', () => {
    const g = play(LD13.rogerPiratesLeader, { active: 10 });
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    pickInst(g, [at(g, 'p1', 'hand', KEEP)]);
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
  });
});

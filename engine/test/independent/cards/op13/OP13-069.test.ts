/**
 * OP13-069 Tom (Character, Purple, cost 2, 2000, Counter +1000, {Fish-Man}/{Water Seven}).
 *
 * Card text: "[On Play] DON!! −1: Add up to 1 Stage card with a cost of 3 or less from your trash to your
 * hand."
 *
 * Rules: CR 10-2-?? (DON!! −N returns DON!! from the field to the DON!! deck), E-Q12 / RL-52 (DON!! −N
 * is optional and may be declined), CR 8-3-1-3 (an unpayable cost), CR 4-8-1 ("up to"), the trash is
 * an open area (CR 3-5-2).
 * Scenery: OP03-075 Galley-La Company (Stage, cost 3), OP05-040 Birdcage (Stage, cost 5).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  choices,
  kind,
  don,
  field,
  hand,
  LD13,
  me,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  trash,
  yes,
  at,
  payDonOnce,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-069';
const STAGE1 = 'OP02-070'; // OP02-070 New Kama Land: Stage, cost 1

function play(
  trashCards: CardId[],
  o: { active?: number; rested?: number; p2Trash?: CardId[] } = {},
): TestGame {
  return me(
    LD13.plain,
    { hand: [ID], trash: trashCards, costArea: { active: o.active ?? 5, rested: o.rested ?? 0 } },
    { trash: o.p2Trash ?? [] },
  );
}

/** Play Tom, accept "DON!! −1" and pay it from the active DON!!. */
function playAndPay(g: TestGame): void {
  playRaw(g, ID);
  need(g, 'optional', 'p1');
  yes(g, 'p1');
  const d = g.legal().some((a) => a.type === 'pick');
  if (d) payDonOnce(g, 'costActive');
}

describe('OP13-069 Tom: [On Play] DON!! −1: add up to 1 Stage card with cost 3 or less from my trash to my hand', () => {
  it('pays DON!! −1 (one DON!! goes back to the DON!! deck) and adds a cost-3 Stage to my hand', () => {
    const g = play([S13.stage3]);
    const before = don(g);
    playAndPay(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', S13.stage3)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([S13.stage3]);
    expect(trash(g)).toEqual([]);
    expect(don(g).deck).toBe(before.deck + 1);
    expect(field(g)).toBe(5 - 1);
  });

  it('boundary: a Stage with cost 3 is offered, a Stage with cost 5 is not', () => {
    const g = play([S13.stage3, S13.stage5]);
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.stage3]);
  });

  it('cost 1 is covered ("or less")', () => {
    const g = play([STAGE1, S13.stage5]);
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([STAGE1]);
  });

  it('only Stage cards: a cheap Character and an Event in the trash are not offered', () => {
    const g = play([S13.c1, 'OP09-077', S13.stage3]);
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.stage3]);
  });

  it('adds at most 1 even when two Stage cards qualify', () => {
    const g = play([S13.stage3, STAGE1]);
    playAndPay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([STAGE1, S13.stage3].sort());
    pickInst(g, [at(g, 'p1', 'trash', STAGE1)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([STAGE1]);
    expect(trash(g)).toEqual([S13.stage3]);
  });

  it('"up to 1": the Stage may be skipped; the DON!! −1 stays paid', () => {
    const g = play([S13.stage3]);
    const before = don(g);
    playAndPay(g);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([S13.stage3]);
    expect(don(g).deck).toBe(before.deck + 1);
  });

  it('declining the cost: no DON!! returns and nothing is added', () => {
    const g = play([S13.stage3]);
    const before = don(g);
    playRaw(g, ID);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(don(g).deck).toBe(before.deck);
  });

  it('may be paid with a rested DON!!: the DON!! count on the field drops by exactly 1', () => {
    const g = play([S13.stage3], { active: 4, rested: 4 });
    playRaw(g, ID);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (g.legal().some((a) => a.type === 'pick')) payDonOnce(g, 'costRested');
    need(g, 'choose', 'p1');
    expect(field(g)).toBe(8 - 1);
  });

  it('must not: the opponent’s trash is not searched', () => {
    const g = play([], { p2Trash: [S13.stage3] });
    playAndPay(g);
    if (kind(g) === 'choose') expect(choices(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual([S13.stage3]);
  });
});

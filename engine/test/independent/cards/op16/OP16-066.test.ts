/**
 * OP16-066 Sengoku (Character, Purple, cost 5, 5000, Counter +2000, {Navy}).
 *
 * Card text: "[On Play] If your Leader has the {Navy} type, add up to 2 DON!! cards from your DON!! deck
 * and rest them. Then, draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: CR 4-10-1 / OPEN-QUESTIONS M4b-5 (a "Then" after a failed "If" does not resolve), CR 4-10-2
 * (a "Then" after a clause that resolved with 0 still resolves), CR 8-4-4-1 ("up to"), CR 3-9-3 /
 * RD 69 (DON!! deck), CR 10-2-14 (Trash 2 from hand: the player chooses), CR 4-5-3 (draw 2).
 * E-Q11: "add up to N DON!!" asks a count, most first.
 */
import { describe, expect, it } from 'vitest';
import {
  asksDonCount,
  backAtMain,
  BLUE,
  canFinish,
  deck,
  donCountOptions,
  don,
  fill,
  hand,
  kind,
  LDR,
  mine,
  n,
  need,
  offeredNow,
  pickInst,
  put,
  SCN,
  takeDon,
  trash,
  inst,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const SENGOKU = 'OP16-066';
const TOP = [SCN.c7, SCN.c8, ...fill(BLUE, 8)];

function start(leader: string, handCards: string[] = [], active = 5): TestGame {
  const g = mine(leader, {
    hand: [SENGOKU, ...handCards],
    deck: TOP,
    costArea: { active, rested: 0 },
  });
  put(g, SENGOKU);
  return g;
}

describe('OP16-066 Sengoku: [On Play] if your Leader is {Navy}: add up to 2 rested DON!!; then draw 2 and trash 2', () => {
  it('Navy Leader: adds 2 rested DON!!, draws 2, then I trash 2 cards of my choice from hand', () => {
    const g = start(LDR.navy, [SCN.c1, SCN.c2]);
    need(g, 'choose', 'p1');
    takeDon(g, 2);
    need(g, 'choose', 'p1');
    expect(don(g)).toMatchObject({ active: 0, rested: 7, deck: 3 });
    expect(offeredNow(g).length).toBeGreaterThanOrEqual(3);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c1), inst(g, 'p1', 'hand', SCN.c7)]);
    expect(backAtMain(g)).toBe(true);
    expect(trash(g)).toEqual([SCN.c1, SCN.c7].sort());
    expect(hand(g)).toEqual([SCN.c2, SCN.c8].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('"up to 2": the count may be 2, 1 or 0', () => {
    const g = start(LDR.navy);
    expect(donCountOptions(g).sort()).toEqual(['0', '1', '2']);
  });

  it('CR 4-10-2: choosing 0 DON!! does not stop the "Then": draw 2 and trash 2 still happen', () => {
    const g = start(LDR.navy, [SCN.c1]);
    takeDon(g, 0);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c1), inst(g, 'p1', 'hand', SCN.c7)]);
    expect(don(g)).toMatchObject({ rested: 5, deck: 5 });
    expect(hand(g)).toEqual([SCN.c8]);
    expect(deck(g)).toHaveLength(8);
  });

  it('exactly 2 cards are trashed: no "done" before 2 are chosen', () => {
    const g = start(LDR.navy, [SCN.c1]);
    takeDon(g, 1);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c7), inst(g, 'p1', 'hand', SCN.c8)]);
    expect(trash(g)).toEqual([SCN.c7, SCN.c8].sort());
    expect(hand(g)).toEqual([SCN.c1]);
  });

  it('CR 4-10-1: a Leader that is not {Navy}: nothing at all happens (no DON!!, no draw, no trash)', () => {
    const g = start(LDR.luffy, [SCN.c1]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SCN.c1]);
    expect(deck(g)).toHaveLength(10);
    expect(don(g)).toMatchObject({ active: 0, rested: 5, deck: 5 });
  });

  it('a Leader with {Navy} among several types ({Donquixote Pirates}/{Navy}) counts', () => {
    const g = start(LDR.dpNavy, []);
    takeDon(g, 2);
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(8);
  });

  it('with an empty DON!! deck no DON!! can be added but the draw 2 and trash 2 still happen', () => {
    const g = start(LDR.navy, [SCN.c1], 10);
    if (asksDonCount(g)) {
      expect(donCountOptions(g)).not.toContain('2');
      expect(donCountOptions(g)).not.toContain('1');
      takeDon(g, 0);
    }
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c7), inst(g, 'p1', 'hand', SCN.c8)]);
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(deck(g)).toHaveLength(8);
  });

  it('with 1 DON!! left in the DON!! deck the count cannot exceed 1', () => {
    const g = start(LDR.navy, [], 9);
    expect(donCountOptions(g)).not.toContain('2');
  });

  it('only on play: a Sengoku already on the field draws nothing', () => {
    const g = mine(LDR.navy, { characters: [SENGOKU], deck: TOP });
    expect(n(g, 'p1', 'hand')).toBe(0);
  });
});

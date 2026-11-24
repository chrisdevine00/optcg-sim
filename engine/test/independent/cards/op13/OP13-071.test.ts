/**
 * OP13-071 Nekomamushi (Character, Purple, cost 3, 3000, Counter +2000, {Minks}/{Roger Pirates}).
 *
 * Card text: "[On Play] If you have 8 or more DON!! cards on your field, K.O. up to 1 of your opponent's
 * Characters with 3000 base power or less."
 *
 * Rules: CR 3-1-2 (the field includes the cost area; DON!! given count), CR 4-9-2 ("base" power),
 * CR 4-8-1 ("up to").
 * Scenery: OP01-010 Komachiyo (3000), ST05-007 Gordon (3000), OP01-012 Sai (4000).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  chars,
  ch,
  LD13,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  trash,
  type Placed,
  type PlayerSpec,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-071';

function play(
  o: {
    active?: number;
    rested?: number;
    given?: number;
    theirs?: Placed;
    p2Cost?: PlayerSpec['costArea'];
  } = {},
): TestGame {
  return me(
    o.given ? { card: LD13.plain, don: o.given } : LD13.plain,
    { hand: [ID], costArea: { active: o.active ?? 8, rested: o.rested ?? 0 } },
    { characters: o.theirs ?? [S13.c1, S13.c2], ...(o.p2Cost ? { costArea: o.p2Cost } : {}) },
  );
}

describe('OP13-071 Nekomamushi: [On Play] with 8+ DON!! on my field, K.O. up to 1 Character with 3000 base power or less', () => {
  it('8 DON!! (all spent or not, they stay on the field): K.O.s a 3000-base Character', () => {
    const g = play();
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c2]);
    expect(trash(g, 'p2')).toEqual([S13.c1]);
  });

  it('boundary: 3000 base power is offered, 4000 is not', () => {
    const g = play();
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
  });

  it('boundary: 7 DON!! on the field does nothing (no K.O., no prompt)', () => {
    const g = play({ active: 7 });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2].sort());
  });

  it('rested DON!! count: 4 active + 4 rested is 8', () => {
    const g = play({ active: 4, rested: 4 });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
  });

  it('DON!! given count: 6 in the cost area + 2 given is 8', () => {
    const g = play({ active: 6, given: 2 });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
  });

  it('must not: the opponent’s DON!! do not count (10 on their field, 7 on mine)', () => {
    const g = play({ active: 7, p2Cost: { active: 10, rested: 0 } });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2].sort());
  });

  it('"up to 1": the K.O. may be skipped', () => {
    const g = play();
    playRaw(g, ID);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2].sort());
  });

  it('K.O.s at most 1 even when two Characters qualify', () => {
    const g = play({ theirs: [S13.c1, S13.gordon] });
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1, S13.gordon].sort());
    pickInst(g, [ch(g, 'p2', S13.gordon)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c1]);
  });

  it('only the opponent’s Characters are candidates, never mine', () => {
    const g = me(
      LD13.plain,
      { hand: [ID], characters: [S13.c1], costArea: { active: 8, rested: 0 } },
      { characters: [S13.gordon] },
    );
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.gordon]);
  });
});

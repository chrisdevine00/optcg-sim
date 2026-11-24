/**
 * OP13-061 Inuarashi (Character, Purple, cost 3, 3000, Counter +1000, {Minks}/{Roger Pirates}).
 *
 * Card text: "[On Play] If you have any DON!! cards given, add up to 1 DON!! card from your DON!! deck and
 * rest it. Then, K.O. up to 1 of your opponent's Characters with a cost of 1 or less."
 *
 * Rules: rules-digest 15 / E-Q11 ("add up to N DON!!" asks a count, most first, "None" last),
 * RD 122 (CR 4-10-1: after a failed "If" the following "Then" does not resolve; CR 4-10-2: when a
 * "Then" clause cannot be resolved the following clause still can), CR 4-8-1 ("up to" allows 0),
 * CR 3-9-3 (rested DON!!), DON!! given means DON!! on a Leader or Character (CR 6-2-3).
 * Scenery: OP01-010 Komachiyo (cost 1), OP01-012 Sai (cost 2).
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  atMain,
  chars,
  countOptions,
  don,
  LD13,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S13,
  ch,
  trash,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-061';

/** p1's Main Phase, Inuarashi in hand, 5 active DON!! and `given` DON!! on the Leader. */
function start(
  o: {
    given?: number;
    mineChars?: Placed;
    theirs?: Placed;
    active?: number;
    leaderOpp?: string;
  } = {},
): TestGame {
  return me(
    { card: LD13.plain, don: o.given ?? 1 },
    { hand: [ID], characters: o.mineChars ?? [], costArea: { active: o.active ?? 5, rested: 0 } },
    { characters: o.theirs ?? [S13.c1, S13.c2] },
  );
}

describe('OP13-061 Inuarashi: [On Play] if any DON!! given, add up to 1 DON!! rested. Then K.O. up to 1 cost 1 or less', () => {
  it('with DON!! given: asks the count, adds 1 rested DON!! from the DON!! deck, then K.O.s a cost-1 Character', () => {
    const g = start();
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    need(g, 'choose', 'p1');
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(atMain(g)).toBe(true);
    const after = don(g);
    expect(after.deck).toBe(before.deck - 1);
    expect(after.rested).toBe(before.rested + 3 + 1);
    expect(after.active).toBe(before.active - 3);
    expect(chars(g, 'p2')).toEqual([S13.c2]);
    expect(trash(g, 'p2')).toEqual([S13.c1]);
  });

  it('boundary: a cost-1 Character is offered, a cost-2 Character is not', () => {
    const g = start();
    playRaw(g, ID);
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
  });

  it('"up to 1": the K.O. may be skipped, the DON!! stays added', () => {
    const g = start();
    const before = don(g);
    playRaw(g, ID);
    addDon(g, 1);
    none(g);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2].sort());
    expect(don(g).deck).toBe(before.deck - 1);
  });

  it('with no DON!! given: no DON!! is added and, after the failed "If", the "Then" K.O. does not resolve either', () => {
    const g = start({ given: 0 });
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2].sort());
  });

  it('DON!! given to one of my Characters (not the Leader) satisfies the condition', () => {
    const g = start({ given: 0, mineChars: [{ card: S13.c3, don: 1 }] });
    playRaw(g, ID);
    expect(asksCount(g)).toBe(true);
    addDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S13.c1]);
  });

  it('must not: DON!! given to the opponent’s cards does not count', () => {
    const g = start({ given: 0, theirs: [{ card: S13.c1, don: 1 }, S13.c2] });
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([S13.c1, S13.c2].sort());
  });

  it('choosing 0 DON!!: nothing is added, the "Then" K.O. is still available', () => {
    const g = start();
    const before = don(g);
    playRaw(g, ID);
    addDon(g, 0);
    need(g, 'choose', 'p1');
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(don(g).deck).toBe(before.deck);
    expect(chars(g, 'p2')).toEqual([S13.c2]);
  });

  it('with an empty DON!! deck the count is not asked, and the K.O. still resolves', () => {
    // 1 given + 9 in the cost area = 10 DON!! on the field, none left in the DON!! deck.
    const g = start({ active: 9 });
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    expect(asksCount(g)).toBe(false);
    need(g, 'choose', 'p1');
    pickInst(g, [ch(g, 'p2', S13.c1)]);
    expect(chars(g, 'p2')).toEqual([S13.c2]);
  });

  it('with one DON!! left in the DON!! deck the count offers 1 and None', () => {
    const g = start({ active: 8 });
    expect(don(g).deck).toBe(1);
    playRaw(g, ID);
    expect(countOptions(g)).toEqual(['1', '0']);
  });

  it('the added DON!! is rested, not active', () => {
    const g = start();
    const before = don(g);
    playRaw(g, ID);
    addDon(g, 1);
    none(g);
    // Cost 3 rests 3 active DON!!; the added one is rested too.
    expect(don(g)).toMatchObject({ active: before.active - 3, rested: before.rested + 3 + 1 });
  });
});

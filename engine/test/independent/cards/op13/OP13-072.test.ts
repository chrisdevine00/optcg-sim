/**
 * OP13-072 Buggy (Character, Purple, cost 2, 2000, Counter +2000, {Roger Pirates}).
 *
 * Card text: "[On Play] If your Leader's type includes "Roger Pirates" and you have any DON!! cards
 * given, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: CR 2-4-3-1 ("type including" matches {Former Roger Pirates}), E-Q11 (the count), CR 4-8-1,
 * CR 3-9-3, CR 8-3-3 (both conditions must hold).
 * Leaders: OP12-001 Silvers Rayleigh ({Former Roger Pirates}), OP13-003 Gol.D.Roger ({Roger Pirates}),
 * ST01-001 Luffy (no Roger Pirates).
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  asksCount,
  atMain,
  countOptions,
  don,
  LD13,
  me,
  need,
  playRaw,
  S13,
  type Placed,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP13-072';

function play(
  leader: string,
  o: { given?: number; active?: number; mineChars?: Placed; p2Leader?: string } = {},
): TestGame {
  return me(
    { card: leader, don: o.given ?? 1 },
    { hand: [ID], characters: o.mineChars ?? [], costArea: { active: o.active ?? 6, rested: 0 } },
    {},
    o.p2Leader,
  );
}

describe('OP13-072 Buggy: [On Play] Roger Pirates Leader and any DON!! given: add up to 1 DON!! rested', () => {
  it('both conditions hold: asks the count and adds 1 RESTED DON!! ({Former Roger Pirates} Leader)', () => {
    const g = play(LD13.rogerPiratesLeader);
    const before = don(g);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(countOptions(g)).toEqual(['1', '0']);
    addDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({
      active: before.active - 2,
      rested: before.rested + 2 + 1,
      deck: before.deck - 1,
    });
  });

  it('a {Roger Pirates} Leader ([Gol.D.Roger]) qualifies too', () => {
    const g = play(LD13.roger);
    playRaw(g, ID);
    expect(asksCount(g)).toBe(true);
  });

  it('Roger Pirates Leader but no DON!! given: nothing is added', () => {
    const g = play(LD13.rogerPiratesLeader, { given: 0 });
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('DON!! given but a Leader without a Roger Pirates type: nothing is added', () => {
    const g = play(LD13.plain);
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('DON!! given to one of my Characters satisfies the DON!! condition', () => {
    const g = play(LD13.rogerPiratesLeader, { given: 0, mineChars: [{ card: S13.c3, don: 1 }] });
    playRaw(g, ID);
    expect(asksCount(g)).toBe(true);
  });

  it('must not: the opponent’s Roger Pirates Leader does not count for my Leader condition', () => {
    const g = play(LD13.plain, { p2Leader: LD13.rogerPiratesLeader });
    const before = don(g);
    playRaw(g, ID);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('"up to 1": choosing 0 adds nothing', () => {
    const g = play(LD13.rogerPiratesLeader);
    const before = don(g);
    playRaw(g, ID);
    addDon(g, 0);
    expect(atMain(g)).toBe(true);
    expect(don(g).deck).toBe(before.deck);
  });

  it('with an empty DON!! deck the count is not asked', () => {
    const g = play(LD13.rogerPiratesLeader, { active: 9 });
    expect(don(g).deck).toBe(0);
    playRaw(g, ID);
    expect(asksCount(g)).toBe(false);
    expect(atMain(g)).toBe(true);
  });

  it('with one DON!! left in the DON!! deck the count offers 1 and None', () => {
    const g = play(LD13.rogerPiratesLeader, { active: 8 });
    expect(don(g).deck).toBe(1);
    playRaw(g, ID);
    expect(countOptions(g)).toEqual(['1', '0']);
  });
});

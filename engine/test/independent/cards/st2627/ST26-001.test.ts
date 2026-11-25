/**
 * ST26-001 Soba Mask (Character, Purple, cost 7, 9000, no Counter, {Straw Hat Crew}, Strike).
 *
 * Card text: "If you have a [San-Gorou] or [Sanji] Character with 7000 base power or more, give this
 * card in your hand -5 cost. [On Play] Return all of your [San-Gorou] and [Sanji] Characters to the
 * owner's hand."
 *
 * Rules: CR 4-9-2 ("base power" is the printed power, so DON!! and effects do not count), CR 3-1-6
 * (a card that changes area is a new card, DON!! given to it returns to the cost area rested),
 * CR 1-3-6-2 (a cost is never below 0). "All" has no choice: nothing is asked.
 */
import { describe, expect, it } from 'vitest';
import type { CardPlacement } from '@optcg/engine';
import {
  at,
  canPlay,
  charIds,
  costIn,
  donOf,
  fill,
  hand,
  mine,
  playCard,
  RED,
  SL,
  SS,
  waitingAtMain,
} from './kit-st2627a.ts';
import { kind } from '../kit.ts';

const SOBA = 'ST26-001';

function start(
  chars: (string | CardPlacement)[],
  extra: { hand?: string[]; costArea?: { active: number; rested: number } } = {},
  p2: { characters?: string[] } = {},
) {
  return mine(
    SL.shanks,
    { hand: [SOBA], characters: chars, ...extra },
    { deck: fill(RED, 10), ...p2 },
  );
}

describe('ST26-001 Soba Mask: -5 cost in hand with a 7000+ base [San-Gorou] or [Sanji]', () => {
  it('a [San-Gorou] with 8000 base power makes it cost 2 (7 - 5)', () => {
    const g = start([SS.sangorou8]);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(2);
  });

  it('a [Sanji] with exactly 7000 base power qualifies (boundary)', () => {
    const g = start([SS.sanji7]);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(2);
  });

  it('a [Sanji] with 6000 base power does not qualify (boundary): the cost stays 7', () => {
    const g = start([SS.sanji6]);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(7);
  });

  it('"base power": a 6000-base [Sanji] with 1 DON!! given has 7000 power but does not qualify (CR 4-9-2)', () => {
    const g = start([{ card: SS.sanji6, don: 1 }], { costArea: { active: 9, rested: 0 } });
    expect(g.power(at(g, 'p1', 'characters', SS.sanji6))).toBe(7000);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(7);
  });

  it('a [Sanji] with 9000 base power qualifies; the reduction is -5 once, not per qualifying Character', () => {
    const g = start([SS.sanji9, SS.sangorou8, SS.sanji7]);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(2);
  });

  it('another name with 8000 power (Thatch) does not qualify; neither does a 6000 [San-Gorou]', () => {
    const g = start([SS.thatch8, SS.sangorou6]);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(7);
  });

  it('the opponent\'s [Sanji] with 9000 base power does not qualify ("you have")', () => {
    const g = start([], {}, { characters: [SS.sanji9] });
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(7);
  });

  it('playability follows the reduced cost: 2 active DON!! are enough with a qualifier, not without', () => {
    const withQ = start([SS.sanji7], { costArea: { active: 2, rested: 0 } });
    const without = start([SS.sanji6], { costArea: { active: 2, rested: 0 } });
    expect(canPlay(withQ, at(withQ, 'p1', 'hand', SOBA))).toBe(true);
    expect(canPlay(without, at(without, 'p1', 'hand', SOBA))).toBe(false);
  });

  it('the reduction is only for the card in hand: once played, Soba Mask on the field has cost 7', () => {
    const g = start([SS.sanji7]);
    playCard(g, SOBA);
    expect(waitingAtMain(g)).toBe(true);
    expect(costIn(g, 'p1', 'characters', SOBA)).toBe(7);
  });
});

describe('ST26-001 Soba Mask: [On Play] return all of your [San-Gorou] and [Sanji] Characters', () => {
  it('returns every [Sanji] and [San-Gorou] of mine, whatever their power, and nothing is asked', () => {
    const g = start([SS.sanji7, SS.sangorou6, SS.sanji6, SS.thatch8]);
    playCard(g, SOBA);
    expect(waitingAtMain(g)).toBe(true);
    expect(charIds(g, 'p1')).toEqual([SOBA, SS.thatch8].sort());
    expect(hand(g)).toEqual([SS.sanji7, SS.sangorou6, SS.sanji6].sort());
  });

  it("does not return the opponent's [Sanji] or [San-Gorou]", () => {
    const g = start([SS.sanji7], {}, { characters: [SS.sanji9, SS.sangorou8] });
    playCard(g, SOBA);
    expect(charIds(g, 'p2')).toEqual([SS.sanji9, SS.sangorou8].sort());
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('does not return Soba Mask itself', () => {
    const g = start([SS.sanji7]);
    playCard(g, SOBA);
    expect(charIds(g, 'p1')).toContain(SOBA);
    expect(hand(g)).not.toContain(SOBA);
  });

  it('with no [Sanji] or [San-Gorou] in play it can be played at full cost and does nothing else', () => {
    const g = start([SS.thatch8]);
    expect(canPlay(g, at(g, 'p1', 'hand', SOBA))).toBe(true);
    playCard(g, SOBA);
    expect(waitingAtMain(g)).toBe(true);
    expect(charIds(g, 'p1')).toEqual([SOBA, SS.thatch8].sort());
    expect(donOf(g, 'p1').active).toBe(3);
    expect(hand(g)).toEqual([]);
  });

  it('after the qualifier returns to hand, a second Soba Mask in hand costs 7 again', () => {
    const g = start([SS.sanji7], { hand: [SOBA, SOBA] });
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(2);
    playCard(g, SOBA);
    expect(costIn(g, 'p1', 'hand', SOBA)).toBe(7);
  });

  it('a returned Character that had DON!! given gives it back to the cost area, rested (CR 3-1-6-1)', () => {
    const g = start([{ card: SS.sanji7, don: 2 }, SS.thatch8], {
      costArea: { active: 2, rested: 0 },
    });
    // 2 given DON!! on the Sanji; 2 active DON!! in the cost area pay Soba Mask's cost of 2.
    expect(donOf(g, 'p1').given).toBe(2);
    playCard(g, SOBA);
    const don = donOf(g, 'p1');
    expect(don.given).toBe(0);
    expect(don.rested).toBe(4);
    expect(don.active).toBe(0);
  });

  it('is played from a cost-reduced hand and the returned Sanji can be replayed at once', () => {
    const g = start([SS.sanji7], { costArea: { active: 9, rested: 0 } });
    playCard(g, SOBA);
    expect(hand(g)).toEqual([SS.sanji7]);
    expect(kind(g)).toBe('main');
    expect(canPlay(g, at(g, 'p1', 'hand', SS.sanji7))).toBe(true);
  });
});

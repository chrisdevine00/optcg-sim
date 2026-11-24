/**
 * EB05-033 Nico Robin (Character, Purple, cost 1, 2000, Counter +2000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] If your Leader has the {Straw Hat Crew} type and the number of DON!! cards on
 * your field is at least 6 less than the number on your opponent's field, draw 3 cards and trash 2
 * cards from your hand. Then, add up to 4 DON!! cards as rested from your DON!! deck."
 *
 * Rules: CR 8-3-3 (text after a failed "if" does not resolve, so "Then" is gated: M6b-Q13,
 * OPEN-QUESTIONS M4b-5), RL-24 ("DON!! on your field" counts the cost area and given DON!!), CR
 * 8-4-4-1 ("up to" may choose 0), CR 2-7-2 (the play cost is paid before the [On Play] resolves).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import { BLUE, CH, chars, don, drive, hand, LD, mine, outcomes, playCard, trash } from './kit-b.ts';

const ID = 'EB05-033';

function go(o: {
  leader?: string | { card: string; don: number };
  active?: number;
  rested?: number;
  opp?: number;
  hand?: string[];
  deck?: string[];
}) {
  const g = mine(
    o.leader ?? LD.shc,
    {
      hand: [ID, ...(o.hand ?? [])],
      deck: o.deck ?? [CH.marco, CH.sai, CH.thatch, ...fill(BLUE, 10)],
      costArea: { active: o.active ?? 1, rested: o.rested ?? 0 },
    },
    { costArea: { active: o.opp ?? 7, rested: 0 } },
  );
  playCard(g, ID);
  return g;
}

describe('EB05-033 Nico Robin [On Play]: 6+ fewer DON!! than the opponent: draw 3, trash 2, add up to 4 rested DON!!', () => {
  it('1 DON!! vs 7: draws 3, trashes 2 of the 3 cards chosen, then adds 4 rested DON!!', () => {
    const g = go({});
    drive(g, 'p1', { picks: [[g.find('p1', 'hand', CH.marco), g.find('p1', 'hand', CH.sai)]] });
    expect(hand(g)).toEqual([CH.thatch]);
    expect(trash(g)).toEqual([CH.marco, CH.sai].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(13 - 3);
    expect(don(g).rested).toBe(1 + 4);
    expect(don(g).active).toBe(0);
    expect(don(g).deck).toBe(10 - 1 - 4);
    expect(chars(g)).toEqual([ID]);
  });

  it('boundary: exactly 6 fewer works; only 5 fewer (1 vs 6) does nothing at all', () => {
    const six = go({ opp: 7 });
    drive(six, 'p1', {});
    expect(hand(six)).toHaveLength(1);
    const five = go({ opp: 6 });
    drive(five, 'p1', {});
    expect(hand(five)).toEqual([]);
    expect(trash(five)).toEqual([]);
    expect(don(five).deck).toBe(9);
    expect(don(five).rested).toBe(1);
  });

  it('CR 8-3-3: the "Then" (add DON!!) is gated by the same "if": nothing is added when it fails', () => {
    const g = go({ opp: 3 });
    drive(g, 'p1', {});
    expect(don(g).rested).toBe(1);
    expect(don(g).deck).toBe(9);
  });

  it('the Leader must have {Straw Hat Crew}: ST03-001 Crocodile does not qualify even with the DON!! gap', () => {
    const g = go({ leader: LD.bw });
    drive(g, 'p1', {});
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(don(g).deck).toBe(9);
  });

  it('a multi-type Leader that includes {Straw Hat Crew} qualifies (OP12-041 Sanji)', () => {
    const g = go({ leader: LD.vinsmoke });
    drive(g, 'p1', {});
    expect(hand(g)).toHaveLength(1);
  });

  it('RL-24: DON!! given to the Leader count as DON!! on my field (2 vs 7 fails, 2 vs 8 works)', () => {
    const fails = go({ leader: { card: LD.shc, don: 1 }, opp: 7 });
    drive(fails, 'p1', {});
    expect(hand(fails)).toEqual([]);
    const works = go({ leader: { card: LD.shc, don: 1 }, opp: 8 });
    drive(works, 'p1', {});
    expect(hand(works)).toHaveLength(1);
  });

  it('rested DON!! on my field count the same as active ones', () => {
    const g = go({ active: 1, rested: 2, opp: 9 });
    drive(g, 'p1', {});
    expect(hand(g)).toHaveLength(1);
    const no = go({ active: 1, rested: 2, opp: 8 });
    drive(no, 'p1', {});
    expect(hand(no)).toEqual([]);
  });

  it('exactly 2 cards are trashed from a hand that already held a card: hand ends at 1 + 3 - 2', () => {
    const g = go({ hand: [CH.mohji] });
    drive(g, 'p1', { picks: [[g.find('p1', 'hand', CH.mohji), g.find('p1', 'hand', CH.marco)]] });
    expect(hand(g)).toHaveLength(2);
    expect(trash(g)).toEqual([CH.mohji, CH.marco].sort());
  });

  // DISAGREEMENT B-1: the engine always adds all 4; "up to 4" (RD 15, CR 8-4-4-1) allows fewer.
  it('"up to 4": adding fewer DON!! (even none) is reachable, and never more than 4', () => {
    const g = go({});
    const rested = outcomes(g, 'p1', (x) => String(don(x, 'p1').rested));
    expect(rested.has('5')).toBe(true);
    expect(rested.has('1')).toBe(true);
    for (const r of rested) expect(Number(r)).toBeLessThanOrEqual(5);
  });
});

/**
 * EB03-037 Lim (Character, Purple, cost 4, 5000, Counter +2000, {ODYSSEY}).
 *
 * Card text: "[On Play] If you have 7 or more DON!! cards on your field, all of your {ODYSSEY} type
 * Leader and Character cards gain +1000 power until the end of your opponent's next End Phase."
 *
 * Rules: CR 3-9 (DON!! on the field includes DON!! given to cards), CR 2-4-3 (exact type),
 * "until the end of your opponent's next End Phase" (docs/research: created on my turn, ends at
 * the opponent's End Phase), CR 8-1-3 ("all of your" applies to the cards there at resolution).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence } from '../../helpers.ts';
import { atMain, C14, donSum, LB, mine, need, put } from './kit-eb03b.ts';

const ID = 'EB03-037';
const LUCCI = 'OP09-038'; // {CP9}/{ODYSSEY}, cost 4, 6000, vanilla
const MARCO = C14.marco; // not ODYSSEY, 5000

function start(o: {
  active?: number;
  mine?: (string | { card: string; don: number })[];
  p2?: string[];
  hand?: string[];
}) {
  return mine(
    LB.lim,
    {
      hand: [ID, ...(o.hand ?? [])],
      characters: o.mine ?? [],
      costArea: { active: o.active ?? 10, rested: 0 },
    },
    { characters: o.p2 ?? [] },
  );
}

describe("EB03-037 Lim: [On Play] with 7+ DON!!, all my {ODYSSEY} Leader and Characters gain +1000 until the end of the opponent's next End Phase", () => {
  it('with 7 DON!! on the field: the Leader, Lim itself and another {ODYSSEY} Character gain +1000; a non-{ODYSSEY} one does not', () => {
    const g = start({ active: 7, mine: [LUCCI, MARCO] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', LUCCI))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', MARCO))).toBe(5000);
  });

  it('with 6 DON!!: no effect (boundary below 7)', () => {
    const g = start({ active: 6, mine: [LUCCI] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', LUCCI))).toBe(6000);
  });

  it('playing Lim rests 4 DON!! but they stay on the field: exactly 7 is enough', () => {
    const g = start({ active: 7 });
    put(g, ID);
    const d = donSum(g);
    expect(d.rested).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('DON!! given to a Character count as on the field: 5 in the cost area + 2 given make 7', () => {
    const g = start({ active: 5, mine: [{ card: MARCO, don: 2 }, LUCCI] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', LUCCI))).toBe(7000);
    // Marco is not {ODYSSEY}: only the 2 given DON!! (+2000) count for it.
    expect(g.power(g.find('p1', 'characters', MARCO))).toBe(7000);
  });

  it('DON!! that were already rested count too (4 active + 3 rested = 7)', () => {
    const g = mine(LB.lim, { hand: [ID], costArea: { active: 4, rested: 3 } }, {});
    put(g, ID);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the opponent\'s {ODYSSEY} Character is not boosted ("all of your")', () => {
    const g = start({ active: 10, p2: [LUCCI] });
    put(g, ID);
    expect(g.power(g.find('p2', 'characters', LUCCI))).toBe(6000);
  });

  it("lasts through the opponent's turn: the boosted Leader survives a 5000 attack that would otherwise connect", () => {
    const g = start({ active: 10 });
    put(g, ID);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it("ends at the opponent's End Phase: back to the printed power on my next turn", () => {
    const g = start({ active: 10, mine: [LUCCI] });
    put(g, ID);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.find('p1', 'characters', LUCCI))).toBe(7000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', LUCCI))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('only the cards on the field when it resolves are boosted: an {ODYSSEY} Character played afterwards is not', () => {
    const g = start({ active: 10, hand: [LUCCI] });
    put(g, ID);
    put(g, LUCCI);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.find('p1', 'characters', LUCCI))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('asks nothing: [On Play] has no "you may" and no choice', () => {
    const g = start({ active: 10 });
    put(g, ID);
    expect(atMain(g)).toBe(true);
  });
});

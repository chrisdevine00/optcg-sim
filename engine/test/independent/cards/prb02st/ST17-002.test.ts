/**
 * ST17-002 Trafalgar Law (Character, cost 4, 5000, Counter +1000, {Heart Pirates}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[On Play] You may return 1 of your Characters to the owner's hand: If your Leader has
 * the "The Seven Warlords of the Sea" type, return up to 1 Character with a cost of 4 or less to the
 * owner's hand."
 *
 * Rules: the text before the colon is the cost (CR 8-3): one of MY Characters (this Character
 * included) returns to my hand. The "If" after the colon is an effect condition, so the cost is paid
 * even when the Leader does not qualify. The returned Character may belong to either player and
 * goes to ITS OWNER's hand. "Up to 1" may be answered with nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMainOf,
  canUse,
  chr,
  hand,
  kind,
  LDP,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  payCost,
  playRaw,
  SP,
  sorted,
  yes,
} from './kit-prb02sta.ts';

const LW = 'ST17-002';

function play(leader: string, mineChars: string[], p2chars: string[]) {
  const g = mine(leader, { hand: [LW], characters: mineChars }, { characters: p2chars });
  playRaw(g, LW);
  return g;
}

describe('ST17-002 Law: [On Play] you may return 1 of your Characters: if {Warlord} Leader, return up to 1 Character with cost 4 or less', () => {
  it('printed values: cost 4, 5000 power, Counter +1000', () => {
    const g = mine(LDP.warlord, { characters: [LW] });
    const i = at(g, 'p1', 'characters', LW);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 5000, 1000]);
  });

  it('the question is asked, usable even with Law alone on the field (he can return himself)', () => {
    const g = play(LDP.warlord, [], [SP.c1p3]);
    expect(canUse(g)).toBe(true);
  });

  it("the cost offers only MY Characters (Law himself included), never the opponent's", () => {
    const g = play(LDP.warlord, [SP.c1p3, SP.c5p7], [SP.c2p4]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LW, SP.c1p3, SP.c5p7].sort());
  });

  it('with a {Warlord} Leader: returns my other Character as the cost, then up to 1 Character with cost 4 or less (either side)', () => {
    const g = play(LDP.warlord, [SP.c3p5], [SP.c4p6, SP.c5p7, SP.c2p4]);
    yes(g, 'p1');
    payCost(g, [SP.c3p5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LW, SP.c2p4, SP.c4p6].sort());
  });

  it("the opponent's Character goes to the OPPONENT's hand; my cost Character goes to my hand", () => {
    const g = play(LDP.warlord, [SP.c3p5], [SP.c4p6]);
    yes(g, 'p1');
    payCost(g, [SP.c3p5]);
    pickInst(g, [chr(g, 'p2', SP.c4p6)]);
    expect(hand(g, 'p1')).toEqual([SP.c3p5]);
    expect(hand(g, 'p2')).toEqual([SP.c4p6]);
    expect(sorted(g, 'p2', 'characters')).toEqual([]);
    expect(atMainOf(g)).toBe(true);
  });

  it('cost 4 is the boundary: a cost-5 Character is not offered', () => {
    const g = play(LDP.warlord, [SP.c3p5], [SP.c5p7]);
    yes(g, 'p1');
    payCost(g, [SP.c3p5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LW]);
  });

  it('Law can return himself as the cost and the effect still resolves (his own cost-4 body is still a target if he is on the field)', () => {
    const g = play(LDP.warlord, [], [SP.c4p6]);
    yes(g, 'p1');
    payCost(g, [LW]);
    expect(hand(g, 'p1')).toEqual([LW]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c4p6]);
    pickInst(g, [chr(g, 'p2', SP.c4p6)]);
    expect(hand(g, 'p2')).toEqual([SP.c4p6]);
  });

  it('one of my own other Characters with cost 4 or less can be the returned target too', () => {
    const g = play(LDP.warlord, [SP.c1p3, SP.c2p4], []);
    yes(g, 'p1');
    payCost(g, [SP.c1p3]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LW, SP.c2p4].sort());
    pickInst(g, [chr(g, 'p1', SP.c2p4)]);
    expect(hand(g, 'p1')).toEqual([SP.c1p3, SP.c2p4].sort());
  });

  it('"up to 1": choosing nothing returns nothing more, but the cost Character has returned', () => {
    const g = play(LDP.warlord, [SP.c3p5], [SP.c4p6]);
    yes(g, 'p1');
    payCost(g, [SP.c3p5]);
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g, 'p1')).toEqual([SP.c3p5]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6]);
  });

  it('"you may": declining returns nothing at all', () => {
    const g = play(LDP.warlord, [SP.c3p5], [SP.c4p6]);
    no(g, 'p1');
    expect(hand(g, 'p1')).toEqual([]);
    expect(sorted(g, 'p1', 'characters')).toEqual([LW, SP.c3p5].sort());
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6]);
    expect(atMainOf(g)).toBe(true);
  });

  it('without a {Warlord} Leader: the cost is still paid, but no Character is returned and nothing more is asked', () => {
    const g = play(LDP.neutral, [SP.c3p5], [SP.c4p6]);
    yes(g, 'p1');
    payCost(g, [SP.c3p5]);
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p1')).toEqual([SP.c3p5]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(sorted(g, 'p2', 'characters')).toEqual([SP.c4p6]);
  });
});

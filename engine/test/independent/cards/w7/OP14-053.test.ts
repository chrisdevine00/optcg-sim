/**
 * OP14-053 Vista (Character, Blue, cost 3, 4000, Counter +1000, <Slash>, {Whitebeard Pirates}).
 *
 * Card text: "[Blocker] [Opponent's Turn] If you have 7 or less cards in your hand, this Character's
 * base power becomes the same as your Leader's base power."
 *
 * Rules used: [Opponent's Turn] is a condition that holds only during the opponent's turn; the
 * hand count is read live ("7 or less" includes 7); base power is the printed value (a +power
 * effect on the Leader this battle is not base power, M6b-Q84); [Blocker] is a keyword (the Blocker
 * rests and takes the attack).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers, cardIds } from '../../helpers.ts';
import { canCounterWith, useCounter } from '../kit.ts';
import { mine7, need, S7, theirs7 } from './kit-w7b.ts';

const VISTA = 'OP14-053';
const LEADER_6000 = S7.leader6000; // ST10-002: 6000 base power
const FILL = 'OP02-060';
const hand = (n: number, extra: string[] = []) => [
  ...extra,
  ...Array.from({ length: n - extra.length }, () => FILL),
];

/** p2's turn: p1 (Leader 6000) with Vista and a hand of `n` cards. */
function opp(n: number, p1 = {}) {
  return theirs7(LEADER_6000, { characters: [VISTA], hand: hand(n), ...p1 });
}
const vistaPower = (g: ReturnType<typeof opp>) => g.power(g.find('p1', 'characters', VISTA));

describe("OP14-053 Vista: [Blocker]; on the opponent's turn with 7 or less cards in hand its base power is my Leader's base power", () => {
  it('printed values: cost 3, 4000 power, Counter +1000, [Blocker]', () => {
    const g = mine7(LEADER_6000, { characters: [VISTA] });
    const v = g.card(g.find('p1', 'characters', VISTA));
    expect(v.cost).toBe(3);
    expect(v.power).toBe(4000);
    expect(v.counter).toBe(1000);
    expect(v.keywords).toContain('Blocker');
  });

  it("opponent's turn, 7 cards in hand: power equals the Leader's base power (6000)", () => {
    expect(vistaPower(opp(7))).toBe(6000);
  });

  it("opponent's turn, 0 cards in hand: 6000", () => {
    expect(vistaPower(opp(0))).toBe(6000);
  });

  it("opponent's turn, 8 cards in hand: stays at its own 4000", () => {
    expect(vistaPower(opp(8))).toBe(4000);
  });

  it('my own turn: 4000 even with an empty hand', () => {
    const g = mine7(LEADER_6000, { characters: [VISTA], hand: [] });
    expect(g.power(g.find('p1', 'characters', VISTA))).toBe(4000);
  });

  it("it is the Leader's power, not the opponent's: a 5000 opposing Leader against my 6000 Leader gives 6000", () => {
    expect(vistaPower(opp(5))).toBe(6000);
    const g = theirs7(S7.crocodile, { characters: [VISTA], hand: hand(5) });
    expect(g.power(g.find('p1', 'characters', VISTA))).toBe(5000);
  });

  it('as a Blocker against a 5000 attack: with 7 cards in hand (6000) it survives, with 8 cards (4000) it is K.O.d', () => {
    const seven = opp(7);
    attack(seven, seven.leader('p2'), seven.leader('p1'));
    need(seven, 'block', 'p1');
    expect(blockers(seven)).toContain(seven.find('p1', 'characters', VISTA));
    act(seven, { type: 'block', blocker: seven.find('p1', 'characters', VISTA) });
    act(seven, { type: 'endCounter' });
    expect(cardIds(seven, 'p1', 'characters')).toEqual([VISTA]);

    const eight = opp(8);
    attack(eight, eight.leader('p2'), eight.leader('p1'));
    act(eight, { type: 'block', blocker: eight.find('p1', 'characters', VISTA) });
    act(eight, { type: 'endCounter' });
    expect(cardIds(eight, 'p1', 'characters')).toEqual([]);
    expect(cardIds(eight, 'p1', 'trash')).toEqual([VISTA]);
  });

  it("the hand count is live: using an Event from an 8-card hand brings it to 7 and Vista takes the Leader's base power; a +3000 on the Leader is not base power", () => {
    const g = theirs7(LEADER_6000, {
      characters: [VISTA],
      hand: hand(8, [S7.gibson]),
      costArea: { active: 2, rested: 0 },
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    act(g, { type: 'block', blocker: g.find('p1', 'characters', VISTA) });
    need(g, 'counter', 'p1');
    expect(vistaPower(g)).toBe(4000);
    expect(canCounterWith(g, g.find('p1', 'hand', S7.gibson))).toBe(true);
    useCounter(g, g.find('p1', 'hand', S7.gibson), g.leader('p1'));
    expect(cardIds(g, 'p1', 'hand').length).toBe(7);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(vistaPower(g)).toBe(6000);
  });

  it("a Leader with 2 DON!! given: on the opponent's turn the DON!! add no power to the Leader, so Vista is 6000 (base power would not include them anyway)", () => {
    const g = theirs7(LEADER_6000, {
      leader: { card: LEADER_6000, don: 2 },
      characters: [VISTA],
      hand: hand(3),
    });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(vistaPower(g)).toBe(6000);
  });
});

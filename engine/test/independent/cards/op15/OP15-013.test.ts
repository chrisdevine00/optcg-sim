/**
 * OP15-013 Pincers (Character, Red, cost 4, 2000, Counter +2000, {Animal}/{Alabasta}, [Blocker]).
 *
 * Card text: "If your Leader has 0 power or less, give this card in your hand -2 cost. [Blocker]"
 *
 * Rules: CR 8-1-3-3 / CR 2-9 (a permanent effect in hand changes the card's cost), CR 10-1-4.
 * The only way to put a Leader at 0 power with cards on file is OP15-009 Koby's replacement
 * (-2000 each) on an OP13-004 Sabo Leader (4000 with 4 Life), during the opponent's turn
 * (API-GAPS-a.md, G1). The cost is read from the hand card (`CardView.cost`).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, endTurn, passBlock } from './kit-op15a.ts';
import {
  at,
  costOf,
  kw,
  LD15,
  leaderPower,
  need,
  opponentKOs,
  SC2,
  SCN,
  theirs,
  yes,
} from './kit-op15a.ts';

const PINCERS = 'OP15-013';
const KOBY = 'OP15-009';
const SABO = 'OP13-004';

/** p2's turn; my Sabo Leader (4000), Koby and two Characters Lightning can K.O.; Pincers in hand. */
function board(leader: string = SABO) {
  return theirs(
    leader,
    { hand: [PINCERS], characters: [KOBY, SCN.c3, SCN.c4, SCN.c2] },
    { hand: [SC2.lightning, SC2.lightning, SC2.lightning], characters: [SCN.c1] },
  );
}
/** p2 K.O.s each of these Characters with Gum-Gum Lightning; I accept Koby's replacement each time (-2000 each). */
function koReplaced(g: ReturnType<typeof board>, targets: string[]) {
  for (const t of targets) {
    opponentKOs(g, at(g, 'p1', 'characters', t));
    yes(g, 'p1');
  }
}
const cost = (g: ReturnType<typeof board>) => costOf(g, at(g, 'p1', 'hand', PINCERS));

describe('OP15-013 Pincers: -2 cost in hand while my Leader has 0 power or less', () => {
  it('printed values: cost 4, 2000, Counter +2000, [Blocker]', () => {
    const g = board();
    const c = g.card(at(g, 'p1', 'hand', PINCERS));
    expect(c.cost).toBe(4);
    expect(c.counter).toBe(2000);
    expect(leaderPower(g, 'p1')).toBe(4000);
  });

  it('with a Leader above 0 power (4000) the cost stays 4', () => {
    expect(cost(board())).toBe(4);
    expect(cost(board(LD15.luffy))).toBe(4);
  });

  it('boundary: Leader at 2000 power (after one Koby replacement) is still above 0: cost 4', () => {
    const g = board();
    koReplaced(g, [SCN.c3]);
    expect(leaderPower(g, 'p1')).toBe(2000);
    expect(cost(g)).toBe(4);
  });

  // Disagreement A-1 (fixed, OP15 fix round): the hand cost reads the fully derived Leader power.
  it('boundary: Leader at exactly 0 power (after two Koby replacements) gives cost 2', () => {
    const g = board();
    koReplaced(g, [SCN.c3, SCN.c4]);
    expect(leaderPower(g, 'p1')).toBe(0);
    expect(cost(g)).toBe(2);
  });

  it('"or less": a Leader below 0 power (-2000 after three Koby replacements) gives cost 2', () => {
    const g = board();
    koReplaced(g, [SCN.c3, SCN.c4, SCN.c2]);
    expect(leaderPower(g, 'p1')).toBe(-2000);
    expect(cost(g)).toBe(2);
  });

  it('the reduction ends with the turn: back to cost 4 once the Leader power is back', () => {
    const g = board();
    koReplaced(g, [SCN.c3, SCN.c4, SCN.c2]);
    expect(cost(g)).toBe(2);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(leaderPower(g, 'p1')).toBe(4000);
    expect(cost(g)).toBe(4);
  });

  it('it has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(LD15.luffy, { characters: [PINCERS] }, { characters: [SCN.c3] });
    expect(kw(g, at(g, 'p1', 'characters', PINCERS))).toContain('Blocker');
    attack(g, at(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', PINCERS)]);
    passBlock(g);
  });

  it('on the field its cost is the printed 4', () => {
    const g = theirs(LD15.luffy, { characters: [PINCERS] });
    expect(costOf(g, at(g, 'p1', 'characters', PINCERS))).toBe(4);
  });
});

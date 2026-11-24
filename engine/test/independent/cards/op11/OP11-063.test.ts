/**
 * OP11-063 Little Sadi (Purple Character, cost 2, 2000, Counter +2000, {Impel Down}).
 *
 * Card text: "[On Play] DON!! -1 (You may return the specified number of DON!! cards from your field to
 * your DON!! deck.): If your Leader has the {Impel Down} type, rest up to 1 of your opponent's
 * Characters with a cost of 3 or less."
 *
 * Rules: DON!! -1 is a cost paid before the effect (CR 8-3, 10-?): one DON!! (active or rested)
 * goes back to the DON!! deck. The "If" is checked afterwards. Cost 3 is in, 4 is out. "Up to 1"
 * may be none.
 */
import { describe, expect, it } from 'vitest';
import {
  answerIfAsked,
  at,
  C11,
  donOf,
  isRested,
  kind,
  L11,
  mine,
  need,
  no,
  none,
  offeredIds,
  payDon,
  pickInst,
  playCard,
  settleNoCandidates,
  yes,
} from './kit-op11b.ts';

const SADI = 'OP11-063';

function play(leader: string, opp: string[], active = 10) {
  const g = mine(leader, { hand: [SADI], costArea: { active, rested: 0 } }, { characters: opp });
  playCard(g, SADI);
  return g;
}

const field = (g: ReturnType<typeof play>) => {
  const d = donOf(g, 'p1');
  return d.active + d.rested + d.given;
};

describe('OP11-063 Little Sadi: [On Play] DON!! -1: with an {Impel Down} Leader, rest a cost-3-or-less Character', () => {
  it('with an {Impel Down} Leader it offers exactly the opposing Characters with cost 3 or less and rests the chosen one', () => {
    const g = play(L11.impel, [C11.c3, C11.c4, C11.c2]);
    need(g, 'optional', 'p1');
    yes(g);
    payDon(g, 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.c2, C11.c3].sort());
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(true);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c4))).toBe(false);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c2))).toBe(false);
  });

  it('DON!! -1 returns exactly 1 DON!! from the field to the DON!! deck', () => {
    const g = play(L11.impel, [C11.c3]);
    const before = field(g);
    yes(g);
    payDon(g, 1);
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    expect(field(g)).toBe(before - 1);
    expect(donOf(g, 'p1').deck).toBe(1);
  });

  it('the DON!! can come from the rested ones when no DON!! is active (exactly 2 DON!!, both spent on Sadi)', () => {
    const g = play(L11.impel, [C11.c3], 2);
    yes(g);
    payDon(g, 1);
    expect(donOf(g, 'p1').rested + donOf(g, 'p1').active).toBe(1);
    expect(donOf(g, 'p1').deck).toBe(9);
    pickInst(g, [at(g, 'p2', 'characters', C11.c3)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(true);
  });

  it('"up to 1": may rest nothing; the DON!! stays returned', () => {
    const g = play(L11.impel, [C11.c3]);
    yes(g);
    payDon(g, 1);
    need(g, 'choose', 'p1');
    none(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
    expect(donOf(g, 'p1').deck).toBe(1);
  });

  it('declining the cost: no DON!! returned and nothing rested', () => {
    const g = play(L11.impel, [C11.c3]);
    need(g, 'optional', 'p1');
    no(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
    expect(donOf(g, 'p1').deck).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('without an {Impel Down} Leader the cost is paid but nothing is rested', () => {
    const g = play(L11.mono, [C11.c3]);
    const before = field(g);
    if (answerIfAsked(g, true)) payDon(g, 1);
    expect(kind(g)).toBe('main');
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
    expect(field(g)).toBe(before - 1);
  });

  it('with only Characters above cost 3 on the opposing side nothing is rested', () => {
    const g = play(L11.impel, [C11.c4, C11.c5]);
    yes(g);
    payDon(g, 1);
    settleNoCandidates(g);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c4))).toBe(false);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c5))).toBe(false);
  });

  it('only one Character is rested even when two qualify', () => {
    const g = play(L11.impel, [C11.c2, C11.c3]);
    yes(g);
    payDon(g, 1);
    pickInst(g, [at(g, 'p2', 'characters', C11.c2)]);
    expect(isRested(g, at(g, 'p2', 'characters', C11.c3))).toBe(false);
    expect(kind(g)).toBe('main');
  });
});

/** OP12-048 Donquixote Rosinante. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, BLUE, decline, expectDecision, hand, pick, trash, V } from './helpers.ts';
import {
  BN,
  canAccept,
  ids,
  mine,
  NAVY_PURPLE,
  opp,
  plantOpponentEffect,
} from './helpers-op12g2.ts';

const ID = 'OP12-048';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

/** p2's turn; p2's effect K.O.s p1's `target` (a blue {Navy} Character by default). */
const byOpponent = (target: string = BN.c4, extra: Parameters<typeof mine>[0] = {}) => {
  const g = mine({ characters: [ID, target, V.c1], hand: [V.c2, V.c3], ...extra }, {}, opp);
  plantOpponentEffect(g, koOne);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};
const chars = (g: ReturnType<typeof mine>) => ids(g, 'p1', 'characters');

describe('OP12-048 Donquixote Rosinante', () => {
  it("rests Rosinante and trashes 1 card from your hand instead of removing your blue {Navy} Character by the opponent's effect", () => {
    const g = byOpponent();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(chars(g)).toContain(BN.c4);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(trash(g, 'p1')).toEqual([V.c2]);
    expect(hand(g, 'p1')).toEqual([V.c3]);
  });

  it('declining lets the removal happen and keeps Rosinante active', () => {
    const g = byOpponent();
    decline(g);
    expect(chars(g)).not.toContain(BN.c4);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(trash(g, 'p1')).toEqual([BN.c4]);
  });

  it('Rosinante is a blue {Navy} Character himself and may protect himself', () => {
    const g = mine({ characters: [ID], hand: [V.c2] }, {}, opp);
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', ID)]);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(chars(g)).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('must not protect a non-blue {Navy} Character or a blue non-{Navy} Character', () => {
    const a = byOpponent(NAVY_PURPLE);
    expectDecision(a, 'main', 'p2');
    expect(chars(a)).not.toContain(NAVY_PURPLE);
    const b = byOpponent(BLUE);
    expectDecision(b, 'main', 'p2');
    expect(chars(b)).not.toContain(BLUE);
  });

  it("must not apply on your own turn, to your own effects, or to a battle K.O. (not an effect of the opponent's)", () => {
    const own = mine({ characters: [ID, BN.c4], hand: [V.c2] });
    own.state = applyOp(own.state, {
      op: 'ko',
      card: own.find('p1', 'characters', BN.c4),
      by: 'p2',
    }).state;
    expect(chars(own)).not.toContain(BN.c4);

    const self = mine({ characters: [ID, BN.c4], hand: [V.c2] }, {}, opp);
    self.state = applyOp(self.state, {
      op: 'ko',
      card: self.find('p1', 'characters', BN.c4),
      by: 'p1',
    }).state;
    expect(chars(self)).not.toContain(BN.c4);
  });

  it('is not offered when Rosinante is already rested or the hand is empty', () => {
    const rested = byOpponent(BN.c4, { characters: [{ card: ID, rested: true }, BN.c4] });
    expect(chars(rested)).not.toContain(BN.c4);
    const empty = byOpponent(BN.c4, { hand: [] });
    // The replacement is shown but cannot be accepted (the trash cannot be paid).
    expectDecision(empty, 'optional', 'p1');
    expect(canAccept(empty)).toBe(false);
    decline(empty);
    expect(chars(empty)).not.toContain(BN.c4);
  });
});

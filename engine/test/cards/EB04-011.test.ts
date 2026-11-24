/** EB04-011 Scaled Neptunian. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, pick, play, trash } from './helpers.ts';
import {
  at,
  canAttack,
  MINK1,
  mk,
  NEP_A,
  NEP_B,
  NEP_C,
  PURPLE,
  RED_LEADER,
  V,
  BLUE,
} from './helpers-eb04g1.ts';

const ID = 'EB04-011';
const deck = [V.c1, V.c2, V.c3, V.c4, V.c5];

describe('EB04-011 Scaled Neptunian', () => {
  it('[On Play]: draws 1 per {Neptunian} Character (itself included: 3 here), then trashes the same number from the hand', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID, BLUE], characters: [NEP_A, NEP_B], deck });
    play(g, ID);
    // 3 drawn: V.c1, V.c2, V.c3; then the owner trashes 3 of the 4 cards in hand, one at a time.
    expect(hand(g, 'p1')).toHaveLength(4);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    pick(g, [g.find('p1', 'hand', V.c3)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(trash(g, 'p1')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('main');
  });

  it('alone it counts itself: draw 1, trash 1', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it("only YOUR {Neptunian} Characters count (non-{Neptunian} and the opponent's do not)", () => {
    const g = mk(
      { leader: RED_LEADER, hand: [ID], characters: [MINK1, V.c1], deck },
      { characters: [NEP_C, NEP_A] },
    );
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('the trash is mandatory ("Then" is not "if you do"): the drawn cards must be trashed', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], characters: [NEP_A], deck });
    play(g, ID);
    expect(hand(g, 'p1')).toHaveLength(2);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('prints [Rush: Character]: attacks Characters the turn it is played but not the Leader', () => {
    const g = mk(
      { leader: RED_LEADER, hand: [ID], deck: [PURPLE, PURPLE] },
      { characters: [{ card: V.c1, rested: true }] },
    );
    play(g, ID);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    const me = at(g, 'p1', 'characters', ID);
    expect(canAttack(g, me, at(g, 'p2', 'characters', V.c1))).toBe(true);
    expect(canAttack(g, me, g.leader('p2'))).toBe(false);
  });
});

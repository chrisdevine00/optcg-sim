/**
 * OP15-017 Morgan (Character, Red, cost 5, 6000, Counter +1000, {Navy}/{East Blue}).
 *
 * Card text: "[Blocker] [Activate: Main] [Once Per Turn] You may give 1 of your opponent's rested DON!!
 * cards to 1 of your opponent's Characters: Give up to 1 rested DON!! card to its owner's Leader
 * or 1 of their Characters."
 *
 * M6b-Q24 (whose DON!! is given) is open; see describeGiveCost in kit-w3.ts. Rules: [Blocker]
 * CR 10-1-4; a Blocker rests to block; the activation is a cost (CR 8-3-1).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  describeGiveCost,
  need,
  offeredNow,
  theirs,
  useAbility,
  W3C,
  W3L,
  pickInst,
} from './kit-w3.ts';

const MORGAN = 'OP15-017';

describeGiveCost(MORGAN);

describe('OP15-017 Morgan: [Blocker]', () => {
  it('has [Blocker] and blocks an attack on my Leader', () => {
    const g = theirs(W3L.kid, { characters: [MORGAN] }, { characters: [W3C.thatch] });
    const morgan = g.find('p1', 'characters', MORGAN);
    expect(g.card(morgan).keywords).toContain('Blocker');
    attack(g, g.find('p2', 'characters', W3C.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([morgan]);
    act(g, { type: 'block', blocker: morgan });
    expect(g.card(morgan).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('a Blocker that is rested cannot block', () => {
    const g = theirs(
      W3L.kid,
      { characters: [{ card: MORGAN, rested: true }] },
      { characters: [W3C.thatch] },
    );
    attack(g, g.find('p2', 'characters', W3C.thatch), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });

  it("the activation is a Main Phase ability only: it is not offered during the opponent's turn", () => {
    const g = theirs(
      W3L.kid,
      { characters: [MORGAN] },
      { characters: [W3C.thatch], costArea: { active: 2, rested: 3 } },
    );
    expect(offeredNow(g, g.find('p1', 'characters', MORGAN))).toBe(false);
    void useAbility;
    void pickInst;
  });
});

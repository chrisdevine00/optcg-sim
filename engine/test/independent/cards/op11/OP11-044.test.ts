/**
 * OP11-044 Vinsmoke Judge (Blue Character, cost 6, 8000, no Counter, {The Vinsmoke Family}/
 * {GERMA 66}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] You may trash 1 card from your hand: All of your
 * {GERMA 66} type Characters gain +1000 power during this turn."
 *
 * Rules: optional hand cost (exactly 1 card, any card), once per turn. Only my Characters with the
 * exact type {GERMA 66} (Judge himself included); not the Leader even if it has the type, not
 * other types. Lasts until the end of this turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  C11,
  E11,
  canUse,
  fill,
  hand,
  kind,
  L11,
  mine,
  offeredAbilities,
  payHand,
  toMyNextMain,
  trash,
  unusable,
  act,
  answerIfAsked,
} from './kit-op11b.ts';

const JUDGE = 'OP11-044';

function board(o: { hand?: string[]; chars?: string[]; leader?: string; p2chars?: string[] } = {}) {
  return mine(
    o.leader ?? L11.mono,
    { characters: [JUDGE, ...(o.chars ?? [])], hand: o.hand ?? [BLUE] },
    { characters: o.p2chars ?? [] },
  );
}

function use(g: ReturnType<typeof board>): void {
  const judge = at(g, 'p1', 'characters', JUDGE);
  const [ability] = offeredAbilities(g, judge);
  if (!ability) throw new Error('no ability offered');
  act(g, { type: 'activate', card: judge, ability });
  // Choosing to activate is choosing to pay: a "use" question may or may not be asked.
  answerIfAsked(g, true);
}

describe('OP11-044 Vinsmoke Judge: [Activate: Main] [Once Per Turn] trash 1 from hand: all {GERMA 66} Characters +1000', () => {
  it('trashing a card gives every {GERMA 66} Character +1000, Judge included', () => {
    const g = board({ chars: [C11.germa5], hand: [BLUE, C11.c3] });
    use(g);
    payHand(g, [C11.c3]);
    expect(g.power(at(g, 'p1', 'characters', JUDGE))).toBe(9000);
    expect(g.power(at(g, 'p1', 'characters', C11.germa5))).toBe(7000);
    expect(trash(g)).toEqual([C11.c3]);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('Characters of other types are not boosted', () => {
    const g = board({ chars: [C11.c3, C11.germa5], hand: [BLUE] });
    use(g);
    payHand(g, [BLUE]);
    expect(g.power(at(g, 'p1', 'characters', C11.c3))).toBe(5000);
  });

  it('the Leader is not a Character: a {GERMA 66} Leader (Vinsmoke Reiju) gets nothing', () => {
    const g = board({ leader: L11.vinsmoke });
    use(g);
    payHand(g, [BLUE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(at(g, 'p1', 'characters', JUDGE))).toBe(9000);
  });

  it("the opponent's {GERMA 66} Characters are not boosted", () => {
    const g = board({ p2chars: [C11.germa5] });
    use(g);
    payHand(g, [BLUE]);
    expect(g.power(at(g, 'p2', 'characters', C11.germa5))).toBe(6000);
  });

  it('with an empty hand the cost cannot be paid: no boost', () => {
    const g = board({ hand: [] });
    const judge = at(g, 'p1', 'characters', JUDGE);
    if (offeredAbilities(g, judge).length) {
      act(g, { type: 'activate', card: judge, ability: offeredAbilities(g, judge)[0]! });
      unusable(g, 'p1');
    }
    expect(kind(g)).toBe('main');
    expect(g.power(judge)).toBe(8000);
  });

  it('[Once Per Turn]: after it is used it is not offered again this turn', () => {
    const g = board({ hand: [BLUE, BLUE] });
    use(g);
    payHand(g, [BLUE]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', JUDGE))).toEqual([]);
    expect(g.power(at(g, 'p1', 'characters', JUDGE))).toBe(9000);
  });

  it('the boost lasts through this turn and is gone at my next turn', () => {
    const g = board({ hand: fill(BLUE, 2) });
    use(g);
    payHand(g, [BLUE]);
    expect(g.power(at(g, 'p1', 'characters', JUDGE))).toBe(9000);
    toMyNextMain(g);
    expect(g.power(at(g, 'p1', 'characters', JUDGE))).toBe(8000);
    expect(canUse(g)).toBe(false);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', JUDGE))).toHaveLength(1);
  });

  it('any card can be trashed as the cost, an Event for instance', () => {
    const g = board({ hand: [E11.culverin61] });
    use(g);
    payHand(g, [E11.culverin61]);
    expect(trash(g)).toEqual([E11.culverin61]);
    expect(g.power(at(g, 'p1', 'characters', JUDGE))).toBe(9000);
  });

  it('[Once Per Turn] is per card: a second Judge can still be used and its boost stacks', () => {
    const g = board({ chars: [JUDGE], hand: fill(BLUE, 2) });
    const first = at(g, 'p1', 'characters', JUDGE, 0);
    const second = at(g, 'p1', 'characters', JUDGE, 1);
    act(g, { type: 'activate', card: first, ability: offeredAbilities(g, first)[0]! });
    answerIfAsked(g, true);
    payHand(g, [BLUE]);
    expect(offeredAbilities(g, first)).toEqual([]);
    expect(offeredAbilities(g, second)).toHaveLength(1);
    act(g, { type: 'activate', card: second, ability: offeredAbilities(g, second)[0]! });
    answerIfAsked(g, true);
    payHand(g, [BLUE]);
    expect(g.power(first)).toBe(10000);
    expect(g.power(second)).toBe(10000);
  });
});

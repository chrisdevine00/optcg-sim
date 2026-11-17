/**
 * "a card with a [Trigger]" inside a cost clause is the keyword, not a [Trigger] header, so it must
 * not split the effect text into two units (M4b wave 2: OP09-062, OP16-117, OP17-109, OP17-111).
 */
import { describe, expect, it } from 'vitest';
import type { Ability } from '../src/dsl.ts';
import { optionalCostProblems } from '../src/optional-cost.ts';

const text =
  '[When Attacking] You may trash 1 card with a [Trigger] from your hand: Add up to 1 DON!! card from your DON!! deck and rest it.';
const ab = (cost: boolean): Ability => ({
  id: 'a',
  kind: 'auto',
  when: ['whenAttacking'],
  ...(cost ? { cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }] } : {}),
  effect: [{ do: { draw: 1 } }],
});
const card = { category: 'Leader', effectText: text, triggerText: null };

describe('[Trigger] inside a cost clause', () => {
  it('a cost on the ability agrees with the "you may ... :" clause', () => {
    expect(optionalCostProblems({ cardId: 'X', abilities: [ab(true)] }, card)).toEqual([]);
  });
  it('a missing cost is still reported', () => {
    expect(optionalCostProblems({ cardId: 'X', abilities: [ab(false)] }, card)).toHaveLength(1);
  });
});

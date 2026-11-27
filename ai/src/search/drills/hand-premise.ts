/**
 * M9-R6: a bank position gives the opponent no cards in hand, so "works against any hand" holds there
 * because nothing hidden is in play. The answer says so, and a rule that depends on it is worded as
 * conditional, so the drill does not teach a hand-dependent rule as if it held for any hand.
 */
import type { Explanation } from '../../explanation.ts';
import type { BoardItem } from './types.ts';

/** The sentence added to an answer whose text does not already state the premise. */
export const EMPTY_HAND_PREMISE =
  'They had no cards in hand, so nothing hidden adds to this. With cards in their hand, count what a Rush Character or an Event could add first.';

const STATES_IT = /no cards in hand|nothing in their hand/i;

/** The item's opponent has no cards in hand (every bank item's position). */
export const emptyOpponentHand = (item: BoardItem): boolean =>
  item.hand === 'harder' && (item.scenario.p2.hand ?? []).length === 0;

/**
 * `ex` with the empty-hand premise stated. `conditional` also rewrites `nextTime` as a rule that is
 * conditional on the empty hand (the take-at-high-Life class, whose bound reads their hand size).
 */
export function withHandPremise(
  ex: Explanation,
  item: BoardItem,
  conditional: boolean = false,
): Explanation {
  if (!emptyOpponentHand(item)) return ex;
  const said = ex.evidence.some((e) => STATES_IT.test(e.text));
  const out: Explanation = said
    ? ex
    : { ...ex, evidence: [...ex.evidence, { text: EMPTY_HAND_PREMISE }] };
  return conditional
    ? {
        ...out,
        nextTime: `With nothing in their hand, ${out.nextTime.charAt(0).toLowerCase()}${out.nextTime.slice(1)} Against a full hand, count what their hand could add first.`,
      }
    : out;
}

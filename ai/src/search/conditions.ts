/** Playbook conditions that read a determinized state (used by the move bias and by "Why?"). */
import { queries, type GameState, type PlayerId } from '@optcg/engine';
import type { Bias } from '../playbook.ts';

/** Does a `playOnlyIf` condition hold now? Public facts only (the AI's field, their Life). */
export function playOnlyIfMet(
  s: GameState,
  me: PlayerId,
  when: Extract<Bias, { kind: 'playOnlyIf' }>['when'],
): boolean {
  if (when.never) return false;
  if (when.ownBoard) {
    const n = queries
      .zone(s, me, 'characters')
      .filter((c) => when.ownBoard!.cards.includes(c.card)).length;
    if (n < when.ownBoard.min) return false;
  }
  if (
    when.oppLifeAtMost !== undefined &&
    queries.zone(s, me === 'p1' ? 'p2' : 'p1', 'life').length > when.oppLifeAtMost
  )
    return false;
  return true;
}

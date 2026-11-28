/** Playbook conditions that read a determinized state (used by the move bias and by "Why?"). */
import { queries, type GameState, type PlayerId } from '@optcg/engine';
import type { Card } from '@optcg/cards';
import type { ActivateWhen, Bias } from '../playbook.ts';

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

/**
 * Does an `activate` bias's `when` hold now (M11C-R5, R7)? Read from the AI's own field and hand
 * through the engine and the card data. `playedEarlier` lists hand cards the same candidate line
 * plays before the activation: a Character played first joins the field, a Stage played first
 * leaves the hand.
 */
export function activateWhenMet(
  s: GameState,
  me: PlayerId,
  cards: ReadonlyMap<string, Card>,
  when: ActivateWhen | undefined,
  playedEarlier: readonly string[] = [],
): boolean {
  if (!when) return true;
  if (when.kind === 'ownCharactersAllType') {
    const field = queries.zone(s, me, 'characters').map((c) => c.card);
    for (const id of playedEarlier) if (cards.get(id)?.category === 'Character') field.push(id);
    return field.length > 0 && field.every((id) => cards.get(id)?.types.includes(when.type));
  }
  const hand = queries.zone(s, me, 'hand').map((c) => c.card);
  for (const id of playedEarlier) {
    const at = hand.indexOf(id);
    if (at >= 0) hand.splice(at, 1);
  }
  return hand.some((id) => {
    const c = cards.get(id);
    return c?.category === 'Stage' && (c.cost ?? 99) <= when.maxCost;
  });
}

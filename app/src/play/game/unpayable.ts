/**
 * Events whose optional cost cannot be paid (review M4a-18). The engine is right that such an
 * Event is playable (B-1, RL-52), but it would play for no effect, and an Event [Counter] cannot
 * be taken back. So its control says so first and asks for a second press before it is wasted.
 * Only while the player's own hand is shown: payability reads the hand.
 */
import type { Action } from '@optcg/engine';
import type { G } from './ui.ts';

export const UNPAYABLE_NOTE = 'can’t pay its cost now · plays for no effect';

/** Is `action` an Event played or activated whose optional cost the player cannot pay? */
export function unpayable(g: G, handle: string, action: Action | null | undefined): boolean {
  if (!action || !g.mine || !g.ctl.revealed()) return false;
  if (g.cardOf(handle)?.card?.category !== 'Event') return false;
  return g.ctl.session.optionalCostPayable(g.me, action) === false;
}

let armed: { handle: string; at: number } | null = null;

/**
 * Run `run` now, or, when the Event is wasted, say why on the first press and run on the second
 * (within 6 s). The warning is spoken (polite) and shown as the board's why-popover.
 */
export function confirmWaste(
  g: G,
  handle: string,
  action: Action | null | undefined,
  run: () => void,
): void {
  if (!unpayable(g, handle, action)) return run();
  if (armed && armed.handle === handle && Date.now() - armed.at < 6000) {
    armed = null;
    return run();
  }
  armed = { handle, at: Date.now() };
  const text = `${g.nameOf(handle)}: its cost can’t be paid, so it would play for no effect. Press again to play it anyway.`;
  g.whyText(text);
  g.ctl.announce(text);
}

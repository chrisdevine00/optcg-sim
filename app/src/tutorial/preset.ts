/**
 * The first full game after the tutorial (flows F2 step 6): the coach explains in full (Learner)
 * and the lethal detector says "lethal on board" at tier 1 without being asked, for this one game.
 * `applyFirstGame` returns the profile to use for that game; the caller keeps it in memory and does
 * not save it (the coach saves the whole profile only when the player changes a coach setting).
 */
import type { CoachProfile } from '../play/coach/profile.ts';

export const FIRST_GAME_COACH = { verbosity: 'learner', alwaysOn: 1 } as const;

export function applyFirstGame(p: CoachProfile): CoachProfile {
  return { ...p, ...FIRST_GAME_COACH };
}

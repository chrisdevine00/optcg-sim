/**
 * The Lethal button's badge (learning-ui §2.1, §2.2): the only thing the coach shows unprompted, and
 * only when the player has switched the background detector on. A shape plus words, never colour
 * alone. "Unknown" is its own badge and never reads as "no lethal".
 */
import type { Coach } from './coach.ts';

export interface Badge {
  glyph: string;
  text: string;
}

export function lethalBadge(coach: Coach): Badge | null {
  const { lethal, profile } = coach;
  if (profile.alwaysOn === 0 || lethal.status !== 'ready' || !lethal.result || lethal.tier < 1)
    return null;
  const r = lethal.result;
  if (r.status === 'unknown') return { glyph: '?', text: 'Unchecked' };
  if (r.status === 'proven')
    return {
      glyph: '◆',
      text: lethal.tier >= 2 ? hitsText(r.facts.hitsNeeded) : 'Lethal',
    };
  return lethal.tier >= 2 ? { glyph: '', text: hitsText(r.facts.hitsNeeded) } : null;
}

/** "1 hit", "2 hits" (L-SR13). */
export const hitsText = (n: number): string => `${n} ${n === 1 ? 'hit' : 'hits'}`;

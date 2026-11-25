/**
 * The player's coach settings, kept in this browser (learning-ui §2.1 "Remembered per profile").
 * Every read and write is guarded: private windows and blocked storage must not break the game.
 */
import type { Verbosity } from './ExplanationView.tsx';
import { synced } from '../../store/open.ts';
import { LETHAL_KEY } from '../../store/validate.ts';

export type AlwaysOn = 0 | 1 | 2;

export type CoachTab = 'hint' | 'why' | 'lethal' | 'math' | 'tempo';
const TABS: readonly CoachTab[] = ['hint', 'why', 'lethal', 'math', 'tempo'];

export interface CoachProfile {
  /** The coach is expanded (open or tall) rather than collapsed to its strip. */
  expanded: boolean;
  /** The coach strip's tab (M7 WP4): Hint (the default), Why, Lethal, Math or Tempo. */
  tab: CoachTab;
  /** The lethal detector: 0 "Ask me" (default), 1 "Tier 1 always on", 2 "Tier 2 always on". */
  alwaysOn: AlwaysOn;
  verbosity: Verbosity;
  /** "DON!! math on the board" (learning-ui §2.7): "+X to stop" tags on legal targets. Default off. */
  donMath: boolean;
  /** Blunder warning before a commit (learning-ui §3.3, M7 WP5). Default off. */
  blunder: boolean;
  /** Blunder kinds the player has muted (BlunderKind strings). */
  muted: string[];
  /** The opponent's-turn threat alert (M7 WP3/WP4). Default off. */
  alerts: boolean;
  /** The first-game preset has been offered (true) or declined (false); absent: never asked (WP6). */
  firstGame?: boolean;
}

export const DEFAULT_PROFILE: CoachProfile = {
  expanded: false,
  tab: 'hint',
  alwaysOn: 0,
  verbosity: 'standard',
  donMath: false,
  blunder: false,
  muted: [],
  alerts: false,
};

const KEY = 'optcg.coach.v1';

export function loadProfile(): CoachProfile {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE, muted: [] };
    const p = JSON.parse(raw) as Partial<CoachProfile>;
    return {
      expanded: p.expanded === true,
      tab: TABS.includes(p.tab as CoachTab) ? (p.tab as CoachTab) : 'hint',
      alwaysOn: p.alwaysOn === 1 || p.alwaysOn === 2 ? p.alwaysOn : 0,
      verbosity: p.verbosity === 'learner' || p.verbosity === 'terse' ? p.verbosity : 'standard',
      donMath: p.donMath === true,
      blunder: p.blunder === true,
      muted: Array.isArray(p.muted)
        ? p.muted.filter((k): k is string => typeof k === 'string')
        : [],
      alerts: p.alerts === true,
      ...(typeof p.firstGame === 'boolean' ? { firstGame: p.firstGame } : {}),
    };
  } catch {
    return { ...DEFAULT_PROFILE, muted: [] };
  }
}

export function saveProfile(p: CoachProfile): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage is blocked or full: the setting lasts for this session only */
  }
}

const NOTES = 'optcg.coach.notes.v1';

/** How many times a battle rule footnote has been shown to this profile. */
export function noteCount(kind: string): number {
  try {
    const all = JSON.parse(window.localStorage.getItem(NOTES) ?? '{}') as Record<string, number>;
    return all[kind] ?? 0;
  } catch {
    return 0;
  }
}

export function bumpNote(kind: string): void {
  try {
    const all = JSON.parse(window.localStorage.getItem(NOTES) ?? '{}') as Record<string, number>;
    all[kind] = (all[kind] ?? 0) + 1;
    window.localStorage.setItem(NOTES, JSON.stringify(all));
  } catch {
    /* a footnote count is a convenience */
  }
}

/** How far a player needed to go to see a lethal (learning-ui §3.2 "Progress"). */
export type TierNeeded = 'tier1' | 'tier2' | 'count' | 'tier3';

const PROGRESS = 'optcg.progress.lethal.v1';

export interface LethalProgressEntry {
  game: number;
  turn: number;
  furthest: TierNeeded;
}

const ORDER: TierNeeded[] = ['tier1', 'tier2', 'count', 'tier3'];

/** Remember the furthest step used on one lethal opportunity (a turn of a game). */
export function recordLethalProgress(game: number, turn: number, step: TierNeeded): void {
  try {
    const all = readLethalProgress();
    const at = all.findIndex((e) => e.game === game && e.turn === turn);
    if (at >= 0) {
      if (ORDER.indexOf(step) > ORDER.indexOf(all[at]!.furthest)) all[at]!.furthest = step;
    } else all.push({ game, turn, furthest: step });
    const keep = all.slice(-200);
    if (synced.progress) synced.progress.set(LETHAL_KEY, keep);
    else window.localStorage.setItem(PROGRESS, JSON.stringify(keep));
  } catch {
    /* progress is a convenience */
  }
}

/** IndexedDB `progress` since M8 (read into memory at boot); localStorage if it is unavailable. */
export function readLethalProgress(): LethalProgressEntry[] {
  try {
    if (synced.progress) {
      const v = synced.progress.get(LETHAL_KEY);
      return Array.isArray(v) ? (v as LethalProgressEntry[]) : [];
    }
    return JSON.parse(window.localStorage.getItem(PROGRESS) ?? '[]') as LethalProgressEntry[];
  } catch {
    return [];
  }
}

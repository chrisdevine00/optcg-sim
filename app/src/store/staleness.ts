/**
 * Is a saved game still live? (M8 WP5, flows F16 step 6, ARCHITECTURE §2.9.)
 *
 * Live when `verifyReplay` replays the record from its start and every `TurnSnapshot.hash` matches,
 * with the game's own card data and scripts versions unchanged. With this build's engine string that
 * is the plain case (`via: 'versions'`); with another engine string it is an engine bump that did
 * not change this game (`via: 'hashes'`). Otherwise it is read-only: Overview from the stored
 * review, Study from the turn-start snapshots; Play from here and Practice are disabled with
 * `STALE_COPY`. Liveness is always computed from the record, never read from a stored flag, so an
 * imported file cannot claim it.
 */
import { verifyReplay, type CardLookup } from '@optcg/engine';
import type { SessionRecord } from '../session/index.ts';

export const STALE_COPY =
  'This game was played on an older version. You can read the review, but not replay it.';

export type StaleReason = 'cards' | 'scripts' | 'hash' | 'broken' | 'large';

/**
 * A record with more actions than this is not replayed on the main thread to ask if it is live: an
 * imported 20,000-action record would freeze the tab (M8-R12). Real games are a few hundred.
 */
export const LIVENESS_MAX_ACTIONS = 4000;

export const LARGE_COPY =
  'This game is too long to replay here. You can read the review, but not replay it.';

/** The note for a game that is read-only: the version one, or the too-long one. */
export const staleCopyOf = (l: Liveness): string =>
  !l.live && l.reason === 'large' ? LARGE_COPY : STALE_COPY;

/** The short chip beside the title and in the status line. */
export const readOnlyWord = (l: Liveness): string =>
  !l.live && l.reason === 'large' ? 'Read-only: too long to replay' : 'Read-only: older version';

export type Liveness =
  { live: true; via: 'versions' | 'hashes' } | { live: false; reason: StaleReason; detail: string };

const DETAIL: Record<StaleReason, string> = {
  cards: 'card data for a card in this game has changed',
  scripts: 'a card effect in this game has been rewritten',
  hash: 'replaying it no longer reaches the same positions',
  broken: 'its record cannot be replayed',
  large: 'it has too many moves to replay here',
};

/** `lookup` must resolve every card in the game (WP6 loads them by id before asking). */
export function liveness(record: SessionRecord, lookup: CardLookup): Liveness {
  if (record.actions.length > LIVENESS_MAX_ACTIONS)
    return { live: false, reason: 'large', detail: DETAIL.large };
  const v = verifyReplay(record, lookup);
  if (v.ok) return { live: true, via: v.engineDiffers ? 'hashes' : 'versions' };
  const reason: StaleReason =
    v.reason === 'error' || v.reason === 'no-snapshots' ? 'broken' : v.reason;
  return { live: false, reason, detail: DETAIL[reason] };
}

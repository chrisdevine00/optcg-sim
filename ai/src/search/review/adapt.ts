/** `LethalFlag` (the L-slice missed-lethal flag) as the M8 contracts. */
import type { Move } from '../../explanation.ts';
import type { LethalFlag } from '../lethal/review.ts';
import { flagId, type ReviewFlag, type ReviewMarker, type TurnResult } from './types.ts';

/** The flag a `missed-lethal` LethalFlag becomes; a `not-fully-checked` one is a marker, so null. */
export function lethalToReviewFlag(f: LethalFlag, did: Move[] = []): ReviewFlag | null {
  if (f.kind !== 'missed-lethal' || f.severity === 'marker') return null;
  return {
    id: flagId('missed-lethal', f.turn, f.actionIndex),
    kind: 'missed-lethal',
    turn: f.turn,
    player: f.player,
    restoreIndex: f.actionIndex,
    decisionIndex: f.actionIndex,
    severity: f.severity,
    certainty: f.explanation.certainty,
    explanation: f.explanation,
    did,
    practice: { judge: 'win-this-turn', turn: f.turn },
  };
}

export function lethalToMarker(f: LethalFlag): ReviewMarker | null {
  if (f.kind !== 'not-fully-checked') return null;
  return {
    turn: f.turn,
    kind: 'missed-lethal',
    reason: 'search-incomplete',
    explanation: f.explanation,
  };
}

/** One turn's `TurnResult` from the L-slice flags of that turn. */
export function lethalToTurnResult(
  turn: number,
  flags: LethalFlag[],
  did: Move[] = [],
): TurnResult {
  const mine = flags.filter((f) => f.turn === turn);
  const marker = mine.map(lethalToMarker).find((m) => m !== null);
  return {
    itemId: `missed-lethal:${turn}:${mine[0]?.actionIndex ?? 0}`,
    turn,
    flags: mine.map((f) => lethalToReviewFlag(f, did)).filter((f): f is ReviewFlag => f !== null),
    notes: [],
    ...(marker ? { marker } : {}),
  };
}

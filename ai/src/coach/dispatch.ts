/**
 * The worker's queue order and the coach request stubs (M7 WP0). Pure, so a test can check them
 * without a worker. WP1 to WP3 replace `answerCoach` with the real searches.
 */
import type { AiRequest, AiResponse } from '../protocol.ts';
import { NOT_IMPLEMENTED } from './types.ts';

export type CoachRequest = Extract<AiRequest, { type: 'hint' | 'score' | 'threat' }>;

/** Requests the worker queues and runs one at a time. */
export type Work = Extract<
  AiRequest,
  { type: 'planTurn' | 'decide' | 'lethal' | 'hint' | 'score' | 'threat' }
>;

/**
 * Lower runs first: the turn's own search 1 (`decide`, `planTurn`), a pressed Hint, Threat or
 * Lethal 2, Score 3, review 3, the background Lethal detector 4. First come first served within
 * one priority.
 */
export function priorityOf(w: Work): number {
  switch (w.type) {
    case 'lethal':
      return w.priority ?? 2;
    case 'hint':
    case 'threat':
      return 2;
    case 'score':
      return 3;
    default:
      return 1;
  }
}

/** The WP0 answer: typed, valid, and honest that nothing is built yet. */
export function answerCoach(req: CoachRequest, ms = 0): AiResponse {
  switch (req.type) {
    case 'hint':
      return { type: 'hint', id: req.id, result: NOT_IMPLEMENTED, ms };
    case 'score':
      return { type: 'score', id: req.id, result: NOT_IMPLEMENTED, ms };
    case 'threat':
      return { type: 'threat', id: req.id, result: NOT_IMPLEMENTED, ms };
  }
}

/**
 * Answering a `lethal` request (ARCHITECTURE §4.1): the worker calls this; tests call it directly.
 * A `public` request is answered from the request's `SearchView` and the public card data; it never
 * sees a game state.
 */
import type { Card } from '@optcg/cards';
import type { AiRequest, AiResponse } from '../protocol.ts';
import { lethal } from './lethal.ts';

/** Put `item` in `queue` behind every item of equal or higher priority (lower number), ahead of the rest. */
export function insertByPriority<T>(queue: T[], item: T, priority: (t: T) => number): void {
  const at = queue.findIndex((q) => priority(q) > priority(item));
  queue.splice(at === -1 ? queue.length : at, 0, item);
}

export type LethalRequest = Extract<AiRequest, { type: 'lethal' }>;

/** Default wall-clock cap: bounds how long a running search delays the next request. */
export const DEFAULT_CAP_MS = 1500;

export function answerLethal(
  req: LethalRequest,
  cards: ReadonlyMap<string, Card>,
): Extract<AiResponse, { type: 'lethal' }> {
  const t0 = performance.now();
  const cap = {
    ...(req.nodes !== undefined ? { nodes: req.nodes } : {}),
    // A node cap makes the answer repeatable; the wall clock applies only when it is the only cap.
    ...(req.nodes === undefined ? { ms: req.capMs ?? DEFAULT_CAP_MS } : {}),
  };
  const result =
    req.mode === 'public'
      ? lethal({ mode: 'public', view: req.view }, cards, cap)
      : lethal(
          { mode: 'actual', state: req.state, ...(req.attacker ? { attacker: req.attacker } : {}) },
          cards,
          cap,
        );
  return { type: 'lethal', id: req.id, result, ms: performance.now() - t0 };
}

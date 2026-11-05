/// <reference lib="webworker" />
/**
 * The review worker: the missed-lethal check over a finished game (learning-ui §4.2). It receives
 * the whole record and every card of the game, which is fine only because the game is over.
 */
import { reviewInline, type ReviewInput, type ReviewMessage } from './analyse.ts';

const post = (m: ReviewMessage) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

self.onmessage = (e: MessageEvent<ReviewInput>) => {
  try {
    post({ type: 'flags', flags: reviewInline(e.data) });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};

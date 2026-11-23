/// <reference lib="webworker" />
/**
 * The review worker: the missed-lethal check over a finished game (learning-ui §4.2). It receives
 * the whole record and every card of the game, which is fine only because the game is over.
 */
import { loadScripts } from '@optcg/cards';
import { reviewInline, type ReviewInput, type ReviewMessage } from './analyse.ts';

const post = (m: ReviewMessage) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);

self.onmessage = async (e: MessageEvent<ReviewInput>) => {
  try {
    // Scripts load per set (M6b-0): this worker has its own copy of the registry.
    await loadScripts(e.data.cards.map((c) => c.id));
    post({ type: 'flags', flags: reviewInline(e.data) });
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};

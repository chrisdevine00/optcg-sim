/// <reference lib="webworker" />
/**
 * The review worker (M8 WP1): a `ReviewJob` behind `onmessage`. It receives the whole record and
 * every card of the game, which is fine only because the game is over. `start` plans and runs the
 * review item by item, yielding a macrotask between items, so a `cancel`, `prioritise` ("Analyse
 * now") or `deeper` that arrives mid-review is handled before the next item. Results stream back as
 * `items`, with `progress`, and a final `done` with the "Not fully checked" markers.
 */
import { loadScripts } from '@optcg/cards';
import { ReviewJob } from '@optcg/ai/review';
import type { ReviewRequest, ReviewResponse } from '@optcg/ai';

const post = (m: ReviewResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);
const job = new ReviewJob(post);

self.onmessage = async (e: MessageEvent<ReviewRequest>) => {
  const req = e.data;
  // A `puzzle` for a stored review brings its own cards: replaying the record needs their scripts.
  if (req.type === 'puzzle' && req.cards) {
    try {
      await loadScripts(req.cards.map((c) => c.id));
    } catch (err) {
      return post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
    return job.handle(req);
  }
  if (req.type !== 'start') return job.handle(req);
  try {
    // Scripts load per set (M6b-0): this worker has its own copy of the registry.
    await loadScripts(req.cards.map((c) => c.id));
  } catch (err) {
    return post({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
  await job.start(req);
};

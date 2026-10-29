/// <reference lib="webworker" />
/**
 * The AI worker (ARCHITECTURE §4.1). It receives player views only, never game state. One request
 * runs at a time; `cancel` drops the answer of a request that is no longer wanted.
 */
import type { Card } from '@optcg/cards';
import { chooseAction } from './choose.ts';
import type { AiRequest, AiResponse } from './protocol.ts';

const cards = new Map<string, Card>();
const cancelled = new Set<number>();
const post = (r: AiResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(r);

self.onmessage = (e: MessageEvent<AiRequest>) => {
  const req = e.data;
  if (req.type === 'init') {
    for (const c of req.cards) cards.set(c.id, c);
    return;
  }
  if (req.type === 'cancel') {
    cancelled.add(req.id);
    return;
  }
  const t0 = performance.now();
  try {
    const d = chooseAction(req.view, { tier: req.tier, seed: req.seed, cards });
    if (cancelled.delete(req.id)) return;
    post({ type: 'decision', id: req.id, ...d, ms: performance.now() - t0 });
  } catch (err) {
    post({ type: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) });
  }
};

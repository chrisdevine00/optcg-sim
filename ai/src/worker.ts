/// <reference lib="webworker" />
/**
 * The AI worker (ARCHITECTURE §4.1). It receives the AI's own views only, never game state. One
 * request runs at a time; `cancel` drops the answer of a request that is no longer wanted. The
 * session (and its turn plan) lives here, so planning can run while the board animates.
 */
import type { Card } from '@optcg/cards';
import { chooseAction } from './choose.ts';
import type { AiRequest, AiResponse, GameInfo } from './protocol.ts';
import { AiSession } from './session.ts';

const cards = new Map<string, Card>();
const cancelled = new Set<number>();
let game: GameInfo | null = null;
let session: AiSession | null = null;
const post = (r: AiResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(r);

function ensureSession(): AiSession | null {
  if (!game) return null;
  session ??= new AiSession({
    tier: game.tier,
    ownDeck: game.ownDeck,
    cards,
    leader: game.leader,
    opponentLeader: game.opponentLeader,
    budgets: game.budgets ?? 'ms',
  });
  return session;
}

self.onmessage = (e: MessageEvent<AiRequest>) => {
  const req = e.data;
  if (req.type === 'init') {
    for (const c of req.cards) cards.set(c.id, c);
    game = req.game ?? null;
    session = null;
    return;
  }
  if (req.type === 'cards') {
    for (const c of req.cards) cards.set(c.id, c);
    return;
  }
  if (req.type === 'cancel') {
    cancelled.add(req.id);
    return;
  }
  const t0 = performance.now();
  try {
    if (req.type === 'planTurn') {
      const r = ensureSession()?.planTurn(req.view, req.seed, req.budget) ?? {
        steps: 0,
        rollouts: 0,
      };
      if (cancelled.delete(req.id)) return;
      post({ type: 'planned', id: req.id, ...r, ms: performance.now() - t0 });
      return;
    }
    const s = ensureSession();
    const d = s
      ? s.decide(req.view, req.seed)
      : { ...chooseAction(req.view, { tier: req.tier, seed: req.seed, cards }), stats: undefined };
    if (cancelled.delete(req.id)) return;
    post({ type: 'decision', id: req.id, ...d, ms: performance.now() - t0 });
  } catch (err) {
    post({ type: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) });
  }
};

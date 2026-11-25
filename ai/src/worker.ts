/// <reference lib="webworker" />
/**
 * The AI worker (ARCHITECTURE §4.1). It receives the AI's own views only; the one exception is a `lethal` request in `actual` mode (review, open hands), which carries a full state. One
 * request runs at a time; `cancel` drops the answer of a request that is no longer wanted. The
 * session (and its turn plan) lives here, so planning can run while the board animates.
 */
import { loadScripts, type Card } from '@optcg/cards';
import { chooseAction } from './choose.ts';
import { answerLethal, insertByPriority } from './search/lethal/request.ts';
import type { AiRequest, AiResponse, GameInfo } from './protocol.ts';
import { AiSession } from './session.ts';
import { answerScore } from './coach/blunder.ts';
import { answerCoach, priorityOf, type Work } from './coach/dispatch.ts';

const cards = new Map<string, Card>();
/** Scripts of the cards received so far (they load per set, M6b-0); work waits for them. */
let ready: Promise<void> = Promise.resolve();
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

/**
 * Requests queue and run one at a time on a later task, so a `cancel` that arrives behind a request
 * is read before that request starts and the stale work never runs (review M5a-12).
 */
const queue: Work[] = [];
let running = false;

function run(req: Work): void {
  const t0 = performance.now();
  try {
    if (req.type === 'lethal') {
      const res = answerLethal(req, cards);
      if (cancelled.delete(req.id)) return;
      post(res);
      return;
    }
    if (req.type === 'score') {
      const res = answerScore(req, cards, game);
      if (cancelled.delete(req.id)) return;
      post(res);
      return;
    }
    if (req.type === 'hint' || req.type === 'threat') {
      // WP0 stub: WP1 (hint) and WP3 (threat) replace this.
      const res = answerCoach(req, performance.now() - t0);
      if (cancelled.delete(req.id)) return;
      post(res);
      return;
    }
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
    post({
      type: 'decision',
      id: req.id,
      action: d.action,
      explanation: d.explanation,
      ...(d.stats ? { stats: d.stats } : {}),
      ms: performance.now() - t0,
    });
  } catch (err) {
    post({ type: 'error', id: req.id, message: err instanceof Error ? err.message : String(err) });
  }
}

function drain(): void {
  // Each item waits for the scripts of every card received before it (they load per set, M6b-0).
  void ready.then(() => {
    const req = queue.shift();
    if (!req) {
      running = false;
      return;
    }
    if (!cancelled.delete(req.id)) run(req);
    setTimeout(drain, 0);
  });
}

self.onmessage = (e: MessageEvent<AiRequest>) => {
  const req = e.data;
  switch (req.type) {
    case 'init':
      for (const c of req.cards) cards.set(c.id, c);
      ready = Promise.all([ready, loadScripts(req.cards.map((c) => c.id))]).then(() => undefined);
      game = req.game ?? null;
      session = null;
      return;
    case 'cards':
      for (const c of req.cards) cards.set(c.id, c);
      ready = Promise.all([ready, loadScripts(req.cards.map((c) => c.id))]).then(() => undefined);
      return;
    case 'cancel':
      cancelled.add(req.id);
      return;
    case 'reset':
      session?.reset();
      return;
    default:
      // By priority, first come first served within one: a background Lethal check never waits
      // ahead of the AI's own turn or of a press of the Lethal button.
      insertByPriority(queue, req, priorityOf);
      if (!running) {
        running = true;
        setTimeout(drain, 0);
      }
  }
};

/**
 * The AI worker client (ARCHITECTURE §4.1, §5). One worker per game. Requests carry an id; a request
 * that is no longer wanted (rewind, new game) is cancelled. If the worker fails, it is restarted
 * once and the request re-sent (flows G8).
 *
 * The worker receives only public card data (the AI's own deck, its opponent's archetype prior and
 * cards that have become visible) and the AI seat's own view (review M3-09, ADR 0005).
 */
import type { Card } from '@optcg/cards';
import type { AiRequest, AiResponse, AiTier, Decided, GameInfo } from '@optcg/ai';
import type { PlayerView, SearchView } from '@optcg/engine';

export interface AiDecision extends Decided {
  /** Worker time for this decision. */
  ms: number;
  stats?: { rollouts: number; actions: number; planned: boolean };
}

type Req = Extract<AiRequest, { type: 'decide' } | { type: 'planTurn' }>;

interface Pending {
  resolve: (r: AiResponse) => void;
  reject: (e: Error) => void;
  req: Req;
  retried: boolean;
}

export class AiClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private cards: Card[];
  private readonly game: GameInfo | undefined;
  /** Card ids the worker holds (all public). */
  private readonly sent = new Set<string>();

  constructor(cards: Card[], game?: GameInfo) {
    this.cards = cards;
    this.game = game;
    this.worker = this.spawn();
  }

  private spawn(): Worker {
    const w = new Worker(new URL('./ai-worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<AiResponse>) => this.receive(e.data);
    w.onerror = () => this.crashed();
    const init = {
      type: 'init',
      cards: this.cards,
      ...(this.game ? { game: this.game } : {}),
    } satisfies AiRequest;
    w.postMessage(init);
    for (const c of this.cards) this.sent.add(c.id);
    return w;
  }

  private receive(r: AiResponse): void {
    const p = this.pending.get(r.id);
    if (!p) return;
    this.pending.delete(r.id);
    if (r.type === 'error') p.reject(new Error(r.message));
    else p.resolve(r);
  }

  private crashed(): void {
    this.worker.terminate();
    this.sent.clear();
    this.worker = this.spawn();
    for (const [id, p] of this.pending) {
      if (p.retried) {
        this.pending.delete(id);
        p.reject(new Error('The AI stopped responding.'));
      } else {
        p.retried = true;
        this.worker.postMessage(p.req);
      }
    }
  }

  /** Public card data for cards that have become visible to the AI seat (by card id). */
  reveal(cards: Iterable<Card>): void {
    const fresh = [...cards].filter((c) => !this.sent.has(c.id));
    if (fresh.length === 0) return;
    for (const c of fresh) this.sent.add(c.id);
    this.cards = [...this.cards, ...fresh];
    this.worker.postMessage({ type: 'cards', cards: fresh } satisfies AiRequest);
  }

  private send(req: Req): Promise<AiResponse> {
    const result = new Promise<AiResponse>((resolve, reject) => {
      this.pending.set(req.id, { resolve, reject, req, retried: false });
    });
    this.worker.postMessage(req satisfies AiRequest);
    return result;
  }

  /** Plan the AI's turn ahead (the worker keeps the plan for the decisions that follow). */
  planTurn(view: SearchView, seed: number): { id: number; result: Promise<void> } {
    const id = this.nextId++;
    const result = this.send({ type: 'planTurn', id, view, seed }).then(() => undefined);
    return { id, result };
  }

  decide(
    view: PlayerView | SearchView,
    tier: AiTier,
    seed: number,
  ): { id: number; result: Promise<AiDecision> } {
    const id = this.nextId++;
    const result = this.send({ type: 'decide', id, view, tier, seed, budgetMs: 400 }).then((r) => {
      if (r.type !== 'decision') throw new Error('The AI answered the wrong request.');
      return {
        action: r.action,
        explanation: r.explanation,
        alternatives: [],
        ms: r.ms,
        ...(r.stats ? { stats: r.stats } : {}),
      };
    });
    return { id, result };
  }

  cancel(id: number): void {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    this.worker.postMessage({ type: 'cancel', id } satisfies AiRequest);
    p.reject(new Error('cancelled'));
  }

  /** Forget the turn plan and battle memory (a rewind). */
  reset(): void {
    this.worker.postMessage({ type: 'reset' } satisfies AiRequest);
  }

  terminate(): void {
    for (const id of [...this.pending.keys()]) this.cancel(id);
    this.worker.terminate();
  }
}

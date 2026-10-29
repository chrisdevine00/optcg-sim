/**
 * The AI worker client (ARCHITECTURE §4.1, §5). One worker per game. Requests carry an id; a request
 * that is no longer wanted (rewind, new game) is cancelled. If the worker fails, it is restarted
 * once and the request re-sent (flows G8).
 */
import type { Card } from '@optcg/cards';
import type { AiRequest, AiResponse, AiTier, Decided } from '@optcg/ai';
import type { PlayerView } from '@optcg/engine';

interface Pending {
  resolve: (d: Decided) => void;
  reject: (e: Error) => void;
  req: Extract<AiRequest, { type: 'decide' }>;
  retried: boolean;
}

export class AiClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private cards: Card[];

  constructor(cards: Card[]) {
    this.cards = cards;
    this.worker = this.spawn();
  }

  private spawn(): Worker {
    const w = new Worker(new URL('./ai-worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<AiResponse>) => this.receive(e.data);
    w.onerror = () => this.crashed();
    w.postMessage({ type: 'init', cards: this.cards } satisfies AiRequest);
    return w;
  }

  private receive(r: AiResponse): void {
    const p = this.pending.get(r.id);
    if (!p) return;
    this.pending.delete(r.id);
    if (r.type === 'decision')
      p.resolve({ action: r.action, explanation: r.explanation, alternatives: r.alternatives });
    else p.reject(new Error(r.message));
  }

  private crashed(): void {
    this.worker.terminate();
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

  decide(view: PlayerView, tier: AiTier, seed: number): { id: number; result: Promise<Decided> } {
    const id = this.nextId++;
    const req = { type: 'decide', id, view, tier, seed, budgetMs: 400 } as const;
    const result = new Promise<Decided>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, req, retried: false });
    });
    this.worker.postMessage(req satisfies AiRequest);
    return { id, result };
  }

  cancel(id: number): void {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    this.worker.postMessage({ type: 'cancel', id } satisfies AiRequest);
    p.reject(new Error('cancelled'));
  }

  terminate(): void {
    for (const id of [...this.pending.keys()]) this.cancel(id);
    this.worker.terminate();
  }
}

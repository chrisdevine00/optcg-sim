/**
 * The game controller against the Pirate (M5a), with the worker replaced by the same AI code run
 * in process. Checks what reaches the AI (ARCHITECTURE §4.1, ADR 0005; review M3-09):
 * - every request carries the AI seat's own search view, exactly as the store projects it, and
 *   nothing of the human's hidden cards;
 * - card data: the AI's own list and the public prior for the human's Leader at the start, then
 *   only cards the AI's view shows;
 * and that each AI move with a choice stores its Explanation for "Why?" (flows F10).
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { AiSession, priorCardIds, type GameInfo } from '@optcg/ai';
import type { Action, PlayerView, ProjectedView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap, metaDecks } from './support.ts';

const settle = (ms = 60) => new Promise((r) => setTimeout(r, ms));

class InProcessAi implements AiPort {
  readonly views: { view: PlayerView | SearchView; expected: SearchView }[] = [];
  readonly cards = new Map<string, Card>();
  readonly initial: string[];
  readonly revealed: { ids: string[]; visible: Set<string> }[] = [];
  ctl: GameController | null = null;
  private readonly session: AiSession;
  private n = 1;

  constructor(cards: Card[], game: GameInfo) {
    for (const c of cards) this.cards.set(c.id, c);
    this.initial = cards.map((c) => c.id);
    this.session = new AiSession({
      tier: game.tier,
      ownDeck: game.ownDeck,
      cards: this.cards,
      leader: game.leader,
      opponentLeader: game.opponentLeader,
      budgets: 'iterations',
    });
  }

  private note(view: PlayerView | SearchView) {
    this.views.push({ view, expected: this.ctl!.session.searchView('p2') });
  }

  planTurn(view: SearchView, seed: number) {
    this.note(view);
    this.session.planTurn(view, seed);
    return { id: this.n++, result: Promise.resolve() };
  }

  decide(view: PlayerView | SearchView, _tier: string, seed: number) {
    this.note(view);
    const d = this.session.decide(view, seed);
    return { id: this.n++, result: Promise.resolve({ ...d, ms: 0 }) };
  }

  reveal(cards: Iterable<Card>) {
    const list = [...cards].filter((c) => !this.cards.has(c.id));
    for (const c of list) this.cards.set(c.id, c);
    if (list.length) {
      const v = this.ctl!.session.view('p2') as ProjectedView;
      const visible = new Set<string>();
      for (const p of ['p1', 'p2'] as const)
        for (const z of Object.values(v.zones[p]))
          for (const c of z) if (c.card) visible.add(c.card);
      for (const c of [...v.resolving, ...v.looking]) if (c.card) visible.add(c.card);
      for (const id of Object.values(v.known)) visible.add(id);
      this.revealed.push({ ids: list.map((c) => c.id), visible });
    }
  }

  cancel() {}
  terminate() {}
}

describe('the controller against the Pirate (M5a)', () => {
  it('sends only the AI seat’s own view and public card data, and keeps a "Why?" per move', async () => {
    const { mode: _m, ...late } = SCENARIOS.late!;
    // The AI (Kaido, p2) moves first: its turn, then the human answers plainly.
    const spec = { ...late, turn: 8, activePlayer: 'p2' as const };
    const kaido = metaDecks().find((d) => d.leader === 'OP17-058')!.main;
    let port: InProcessAi | null = null;
    const ctl = new GameController(
      cardMap(),
      { scenario: spec },
      {
        mode: 'ai',
        human: 'p1',
        names: { p1: 'You', p2: 'Kaido' },
        tier: 'pirate',
        autoSkip: true,
        alwaysSkip: true,
        speed: 4,
        aiCardIds: [spec.p2.leader as string, ...kaido],
        aiDeck: kaido,
        aiPort: (cards, game) => (port = new InProcessAi(cards, game)),
      },
    );
    port!.ctl = ctl;
    ctl.start();
    for (let i = 0; i < 200; i++) {
      await settle(20);
      const v = ctl.view();
      if (v.result || (v.turn.activePlayer === 'p1' && v.decision?.kind === 'main')) break;
      if (v.decision?.player === 'p1') {
        const a = ctl.actions();
        const plain =
          a.find((x) => x.type === 'block' && x.blocker === null) ??
          a.find((x) => x.type === 'endCounter') ??
          a.find((x) => x.type === 'trigger' && !x.activate) ??
          a.find((x) => x.type === 'optional' && !x.accept) ??
          a.find((x) => x.type !== 'concede');
        if (plain) ctl.act(plain as Action);
      }
    }
    const ai = port!;
    expect(ai.views.length).toBeGreaterThan(3);
    for (const { view, expected } of ai.views) {
      // Exactly the store's projection for the AI seat: nothing else reaches the worker.
      expect(view.player).toBe('p2');
      expect(JSON.stringify(view)).toBe(JSON.stringify(expected));
      // The human's hand is face-down placeholders.
      expect(view.zones.p1.hand.every((c) => c.card === null)).toBe(true);
    }
    // Card data: its own list and the public prior for the human's Leader, then only seen cards.
    const allowed = new Set(['OP17-058', ...kaido, 'OP17-039', ...priorCardIds('OP17-039')]);
    for (const id of ai.initial) expect(allowed.has(id), id).toBe(true);
    for (const r of ai.revealed) for (const id of r.ids) expect(r.visible.has(id), id).toBe(true);
    // Every AI move with a choice has its explanation, on the move's first log line.
    const lines = ctl.logLines().filter((l) => l.kind === 'move' && l.actor === 'p2' && !l.auto);
    const withWhy = lines.filter((l) => ctl.whyAt(l.index));
    expect(withWhy.length).toBeGreaterThan(0);
    for (const l of withWhy) expect(ctl.whyAt(l.index)!.claim.length).toBeGreaterThan(0);
    expect(ctl.lastWhy()).not.toBeNull();
    ctl.dispose();
  }, 60_000);
});

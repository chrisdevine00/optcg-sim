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

/** Log lines that start a move by `p` (a "Hit" line can be credited to the attacker, but it is
 * part of the defender's move). */
const movesBy = (ctl: GameController, p: 'p1' | 'p2') => {
  const actions = ctl.session.exportRecord().actions;
  return ctl.logLines().filter((l) => l.kind === 'move' && actions[l.index]?.player === p);
};

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
  reset() {}
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
    // Every AI move has its explanation, on the move's first log line (review M5a-01).
    const lines = movesBy(ctl, 'p2');
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(ctl.whyAt(l.index)?.claim.length ?? 0, l.text).toBeGreaterThan(0);
    expect(ctl.lastWhy()).not.toBeNull();
    ctl.dispose();
  }, 60_000);
});

/**
 * A stand-in AI that plays the plain public answer (no block, no counter, no [Trigger], declines
 * "you may", first option) and explains it with the real builder, so two games can be held in
 * step while only the AI's hidden cards differ.
 */
class PlainAi implements AiPort {
  private readonly session: AiSession;
  private n = 1;
  constructor(cards: Card[], game: GameInfo) {
    const map = new Map(cards.map((c) => [c.id, c] as const));
    for (const [id, c] of cardMap()) if (!map.has(id)) map.set(id, c);
    this.session = new AiSession({
      tier: 'pirate',
      ownDeck: game.ownDeck,
      cards: map,
      leader: game.leader,
      opponentLeader: game.opponentLeader,
      budgets: 'iterations',
    });
  }
  planTurn() {
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView) {
    const acts = view.actions.filter((a) => a.type !== 'concede');
    const action =
      acts.find((a) => a.type === 'block' && a.blocker === null) ??
      acts.find((a) => a.type === 'endCounter') ??
      acts.find((a) => a.type === 'trigger' && !a.activate) ??
      acts.find((a) => a.type === 'optional' && !a.accept) ??
      acts.find((a) => a.type === 'endTurn') ??
      acts[0]!;
    const explanation = this.session.explain(view as SearchView, action);
    return {
      id: this.n++,
      result: Promise.resolve({ action, explanation, alternatives: [], ms: 0 }),
    };
  }
  reveal() {}
  cancel() {}
  reset() {}
  terminate() {}
}

/** Run the late-game position with the AI's hidden cards changed by `edit`; record what shows. */
type P2 = NonNullable<(typeof SCENARIOS)['late']>['p2'];

async function twin(edit: (p2: P2) => P2) {
  const { mode: _m, ...late } = SCENARIOS.late!;
  const spec = { ...late, p2: edit(late.p2) };
  const kaido = metaDecks().find((d) => d.leader === 'OP17-058')!.main;
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'Kaido' },
      tier: 'pirate',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
      aiCardIds: [spec.p2.leader as string, ...kaido],
      aiDeck: kaido,
      aiPort: (cards, game) => new PlainAi(cards, game),
    },
  );
  const spoken: string[] = [];
  let seq = -1;
  const off = ctl.subscribe(() => {
    if (ctl.polite.seq !== seq) {
      seq = ctl.polite.seq;
      spoken.push(ctl.polite.text);
    }
  });
  ctl.start();
  // The player attacks the AI's Leader with every attacker, then ends the turn.
  for (let i = 0; i < 400; i++) {
    await settle(15);
    const v = ctl.view();
    if (
      v.result ||
      (v.turn.number > spec.turn && v.decision?.player === 'p1' && v.decision.kind === 'main')
    )
      break;
    if (v.decision?.player !== 'p1') continue;
    const a = ctl.actions();
    const attack = a.find((x) => x.type === 'attack' && x.target === v.zones.p2.leader[0]!.handle);
    const plain =
      (v.decision.kind === 'main' ? (attack ?? a.find((x) => x.type === 'endTurn')) : undefined) ??
      a.find((x) => x.type === 'optional' && !x.accept) ??
      a.find((x) => x.type !== 'concede');
    if (plain) ctl.act(plain as Action);
  }
  off();
  const lines = ctl.logLines();
  const out = {
    log: lines.map((l) => `${l.actor}:${l.text}`),
    why: movesBy(ctl, 'p2').map((l) => JSON.stringify(ctl.whyAt(l.index))),
    // Every AI action, logged or not (W reaches a window with no line of its own).
    whyAll: ctl.session
      .exportRecord()
      .actions.map((a, i) => (a.player === 'p2' ? JSON.stringify(ctl.whyAt(i)) : '-')),
    last: JSON.stringify(ctl.lastWhy() === null ? null : ctl.whyAt(ctl.lastWhy()!)),
    spoken,
  };
  ctl.dispose();
  return out;
}

describe('"Why?" shows nothing the player cannot know (review M5a-01)', () => {
  it('a Life card with or without a usable [Trigger]: the same chips, words and announcements', async () => {
    // Gum-Gum Lightning's [Trigger] (add an active DON!!) is free; Yamato has none.
    const a = await twin((p2) => ({ ...p2, life: ['OP09-077', ...p2.life!.slice(1)] }));
    const b = await twin((p2) => ({ ...p2, life: ['OP17-074', ...p2.life!.slice(1)] }));
    expect(a.log.length).toBeGreaterThan(3);
    expect(b).toEqual(a);
    expect(a.why.every((w) => w !== 'null')).toBe(true);
  }, 60_000);

  it('a hand with or without a Counter: the same chips, words and announcements', async () => {
    // Basil Hawkins has a +2000 Counter; the other cards have none.
    const a = await twin((p2) => ({
      ...p2,
      hand: ['OP17-073', 'OP17-062', 'OP17-061', 'ST34-004'],
    }));
    const b = await twin((p2) => ({
      ...p2,
      hand: ['OP17-063', 'OP17-062', 'OP17-061', 'ST34-004'],
    }));
    expect(b).toEqual(a);
  }, 60_000);
});

describe('every AI move is announced (review M5a-03)', () => {
  it('each final AI log line, follow-up picks and DON!! groups included, reached the live region', async () => {
    const { mode: _m, ...late } = SCENARIOS.late!;
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
        alwaysSkip: false,
        speed: 4,
        aiCardIds: [spec.p2.leader as string, ...kaido],
        aiDeck: kaido,
        aiPort: (cards, game) => (port = new InProcessAi(cards, game)),
      },
    );
    port!.ctl = ctl;
    const said = new Set<string>();
    let seq = -1;
    const off = ctl.subscribe(() => {
      if (ctl.polite.seq !== seq) {
        seq = ctl.polite.seq;
        said.add(ctl.polite.text);
      }
    });
    ctl.start();
    for (let i = 0; i < 600; i++) {
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
    off();
    const ai = movesBy(ctl, 'p2');
    expect(ai.length).toBeGreaterThan(3);
    const heard = [...said].join(' ');
    for (const l of ai) expect(heard, l.text).toContain(ctl.spoken(l));
    ctl.dispose();
  }, 60_000);
});

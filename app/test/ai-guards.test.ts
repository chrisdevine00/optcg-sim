/**
 * Guards for three M5a fixes that had no test failing on revert (review M5a-18):
 * (a) "thinking" shows only on the AI's own turn (its presence on the player's turn would depend on
 *     whether the AI had a choice, M5a-01);
 * (b) a rewind makes the worker forget its plan (`reset`);
 * (c) a rewind cancels the turn plan in flight (`cancel`).
 * The stand-in port answers slowly, so the timers that show "thinking" can fire.
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { AiSession, type GameInfo } from '@optcg/ai';
import type { PlayerView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class SlowAi implements AiPort {
  readonly calls: string[] = [];
  readonly cancelled: number[] = [];
  readonly planIds: number[] = [];
  private readonly session: AiSession;
  private n = 1;
  constructor(
    cards: Card[],
    game: GameInfo,
    private readonly delay: { decide: number; plan: number },
  ) {
    this.session = new AiSession({
      tier: game.tier,
      ownDeck: game.ownDeck,
      cards: new Map(cards.map((c) => [c.id, c])),
      leader: game.leader,
      opponentLeader: game.opponentLeader,
      budgets: 'iterations',
    });
  }
  planTurn(view: SearchView, seed: number) {
    this.calls.push('planTurn');
    const id = this.n++;
    this.planIds.push(id);
    this.session.planTurn(view, seed);
    return { id, result: sleep(this.delay.plan).then(() => undefined) };
  }
  decide(view: PlayerView | SearchView, _tier: string, seed: number) {
    this.calls.push('decide');
    const d = this.session.decide(view, seed);
    return { id: this.n++, result: sleep(this.delay.decide).then(() => ({ ...d, ms: 0 })) };
  }
  reveal() {}
  cancel(id: number) {
    this.cancelled.push(id);
  }
  reset() {
    this.calls.push('reset');
  }
  terminate() {}
}

function start(name: string, delay: { decide: number; plan: number }) {
  const { mode: _m, ...spec } = SCENARIOS[name]!;
  let port: SlowAi | null = null;
  const ctl = new GameController(
    cardMap(),
    { scenario: spec },
    {
      mode: 'ai',
      human: 'p1',
      names: { p1: 'You', p2: 'AI' },
      tier: 'pirate',
      autoSkip: true,
      alwaysSkip: false,
      speed: 4,
      aiCardIds: [spec.p2.leader as string, ...((spec.p2.deck as string[]) ?? [])],
      aiDeck: (spec.p2.deck as string[]) ?? [],
      aiPort: (cards, game) => (port = new SlowAi(cards, game, delay)),
    },
  );
  return { ctl, port: () => port! };
}

describe('AI controller guards (M5a-18)', () => {
  it('shows "thinking" on the AI’s own turn when its answer is slow (control)', async () => {
    const { ctl } = start('skip', { decide: 900, plan: 0 });
    ctl.start();
    await sleep(600);
    expect(ctl.thinking).toBe(true);
    ctl.dispose();
  });

  it('never shows "thinking" while the AI answers on the player’s turn', async () => {
    const { ctl } = start('lethal', { decide: 900, plan: 0 });
    ctl.start();
    await sleep(100);
    const v = ctl.view();
    const attack = ctl
      .actions()
      .find(
        (a) =>
          a.type === 'attack' &&
          a.attacker === v.zones.p1.leader[0]!.handle &&
          a.target === v.zones.p2.leader[0]!.handle,
      );
    expect(attack).toBeDefined();
    expect(ctl.act(attack!)).toBe(true);
    // The AI's block decision is pending in the worker for 900 ms.
    for (let i = 0; i < 8; i++) {
      await sleep(100);
      expect(ctl.thinking).toBe(false);
      expect(ctl.activity).not.toMatch(/thinking/);
    }
    ctl.dispose();
  });

  it('a rewind cancels the turn plan in flight and makes the worker forget it', async () => {
    const { ctl, port } = start('late', { decide: 0, plan: 5000 });
    ctl.start();
    await sleep(100);
    const end = ctl.actions().find((a) => a.type === 'endTurn');
    expect(end).toBeDefined();
    expect(ctl.act(end!)).toBe(true);
    await sleep(300);
    const ai = port();
    expect(ai.planIds.length).toBeGreaterThan(0);
    const plan = ai.planIds.at(-1)!;
    expect(ai.cancelled).not.toContain(plan);
    const before = ai.calls.filter((c) => c === 'reset').length;
    expect(ctl.rewindMove()).toBe(true);
    expect(ai.cancelled).toContain(plan);
    expect(ai.calls.filter((c) => c === 'reset').length).toBeGreaterThan(before);
    ctl.dispose();
  });
});

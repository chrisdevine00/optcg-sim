/**
 * L fix round (docs/reviews/l-review.md): puzzle judging and retry (L-06), the always-on check
 * staying out of a puzzle (L-10 M9), the battle panel's hand bound (L-10 M16) and its extra Counter
 * effects (L-08).
 */
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { chooseAction, lethal } from '@optcg/ai';
import type { PlayerView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import type { LethalPort } from '../src/play/game/ai-client.ts';
import { counterExtras, theyCouldHave } from '../src/play/coach/BattleExtras.tsx';
import { unknownBound } from '../src/play/coach/Coach.tsx';
import { prefixOf, reviewInline } from '../src/play/review/analyse.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class Rookie implements AiPort {
  private n = 1;
  planTurn() {
    return { id: this.n++, result: Promise.resolve() };
  }
  decide(view: PlayerView | SearchView, _t: string, seed: number) {
    const d = chooseAction(view, { tier: 'rookie', seed, cards: cardMap() });
    return { id: this.n++, result: Promise.resolve({ ...d, alternatives: [], ms: 0 }) };
  }
  reveal(_c: Iterable<Card>) {}
  cancel() {}
  reset() {}
  terminate() {}
}

class Port implements LethalPort {
  requests = 0;
  lethal(view: SearchView) {
    this.requests++;
    const result = lethal({ mode: 'public', view }, cardMap(), { nodes: 20000 });
    return { id: this.requests, result: Promise.resolve({ result, ms: 1 }) };
  }
  reveal() {}
  cancel() {}
  terminate() {}
}

const { mode: _m, ...spec } = SCENARIOS.lethalDemo!;
const config = (port?: Port) => ({
  mode: 'ai' as const,
  human: 'p1' as const,
  names: { p1: 'You', p2: 'Rocks' },
  tier: 'rookie' as const,
  autoSkip: true,
  alwaysSkip: false,
  speed: 4 as const,
  aiCardIds: ['OP17-039'],
  aiDeck: [] as string[],
  aiPort: () => new Rookie(),
  ...(port ? { coachPort: () => port } : {}),
});

async function puzzle(turn?: number, port?: Port) {
  const g = new GameController(cardMap(), { scenario: spec }, config());
  g.start();
  await sleep(60);
  g.act({ type: 'concede', player: 'p1' });
  await sleep(60);
  const record = g.session.exportRecord();
  const f = reviewInline({ record, cards: [...g.cards.values()], seats: ['p1'] })[0]!;
  const p = new GameController(g.cards, record.start, {
    ...config(port),
    restore: { record: prefixOf(record, f.actionIndex), puzzle: { turn: turn ?? f.turn } },
  });
  p.start();
  await sleep(80);
  return { p, f };
}

const play = async (p: GameController, actions: unknown[]) => {
  for (const a of actions) {
    for (let i = 0; i < 200 && !p.myDecision(); i++) await sleep(20);
    expect(p.act(a as never)).toBe(true);
  }
  for (let i = 0; i < 200 && !p.view().result; i++) await sleep(20);
};

describe('L-06: puzzle judging', () => {
  it('a win on another turn than the puzzle’s is not "solved"', async () => {
    const { p, f } = await puzzle(7);
    await play(p, f.public.viewActions!);
    expect(p.view().result).toMatchObject({ winner: 'p1' });
    expect(p.puzzleState()).toBe('failed');
  });

  it('a retry after Rewind is announced again', async () => {
    const { p, f } = await puzzle();
    const said = new Set<string>();
    p.subscribe(() => said.add(p.polite.text));
    expect(p.act({ type: 'endTurn', player: 'p1' })).toBe(true);
    await sleep(120);
    expect(p.puzzleState()).toBe('failed');
    expect(p.toast).toMatch(/Not this time/);
    expect(p.rewindMove()).toBe(true);
    expect(p.toast ?? '').not.toMatch(/Not this time/);
    await sleep(120);
    expect(p.puzzleState()).toBe('open');
    await play(p, f.public.viewActions!);
    expect(p.puzzleState()).toBe('solved');
    // The second attempt is spoken too (the first result was "Not this time"). Polite lines are
    // spaced out (L-SR20), so it may come a moment later.
    for (let i = 0; i < 100 && !said.has('Solved: you found lethal.'); i++) await sleep(50);
    expect([...said].join(' | ')).toContain('Solved: you found lethal.');
  }, 20_000);
});

describe('L-10: the always-on check stays out of a puzzle (M9)', () => {
  it('sends no request on its own, but a press still answers', async () => {
    const port = new Port();
    const { p } = await puzzle(undefined, port);
    p.coach.setAlwaysOn(2);
    await sleep(80);
    expect(port.requests).toBe(0);
    p.coach.press();
    await sleep(80);
    expect(port.requests).toBe(1);
  });
});

describe('the battle panel’s bound (M16, L-08)', () => {
  it('counts the cards in their hand and multiplies by the prior’s biggest Counter', () => {
    const g = new GameController(cardMap(), { scenario: spec }, config());
    const two = theyCouldHave(g.view(), 'p2', g.cards);
    expect(two).toMatchObject({ hand: 2, perCard: 2000, total: 4000, blockers: [] });
    const { mode: _x, ...s3 } = SCENARIOS.lethalDemo!;
    const g3 = new GameController(
      cardMap(),
      { scenario: { ...s3, p2: { ...s3.p2, hand: ['OP17-056', 'OP17-055', 'OP17-056'] } } },
      config(),
    );
    expect(theyCouldHave(g3.view(), 'p2', g3.cards)).toMatchObject({ hand: 3, total: 6000 });
  });

  it('says when their Counters can also rest a Character or draw', () => {
    // Kaido's sourced lists run [Counter] Events that rest a Character (L-08).
    const k = counterExtras('OP17-058', cardMap());
    expect(k.rests || k.draws).toBe(true);
  });

  it('the panel itself carries those extras for a Kaido defender (re-review L-14)', () => {
    const { mode: _x, ...s3 } = SCENARIOS.lethalDemo!;
    const g = new GameController(
      cardMap(),
      { scenario: { ...s3, p2: { ...s3.p2, leader: 'OP17-058', hand: ['OP17-056'] } } },
      config(),
    );
    const they = theyCouldHave(g.view(), 'p2', g.cards);
    expect(they.extras.rests || they.extras.draws).toBe(true);
  });

  it('on Unknown the coach states the public defence bound (L-03)', () => {
    const f = {
      handSize: 3,
      maxPerCard: 2000,
      blockers: ['x'],
      noPrior: false,
      defenceExtras: { rests: true, draws: false },
    };
    expect(unknownBound(f)).toBe(
      'Their 3 cards in hand could add up to +6000 (+2000 each, their usual lists’ biggest); 1 active Blocker stops one attack. Their Counters can also rest one of your Characters.',
    );
    expect(unknownBound({ ...f, handSize: 0, blockers: [] })).toBe('They have no cards in hand.');
  });
});

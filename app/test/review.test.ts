/**
 * The missed-lethal review, end to end in the app (learning-ui §4): a planted game where the player
 * had lethal and gave it away is flagged `any-hand` with a correct line; its position restores
 * exactly (Study, read-only); "Practice this" opens it as a puzzle the player can solve against the
 * engine; and `actual` mode appears only here, after the game, never in a live game.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Card } from '@optcg/cards';
import { chooseAction } from '@optcg/ai';
import type { Action, PlayerView, SearchView } from '@optcg/engine';
import { GameController, type AiPort } from '../src/play/game/controller.ts';
import { SCENARIOS } from '../src/play/setup/scenarios.ts';
import { prefixOf, reviewInline } from '../src/play/review/analyse.ts';
import { lineRefs } from '../src/play/coach/coach.ts';
import { cardMap } from './support.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Rookie in process: random legal moves that always defend a lethal attack. */
class RookiePort implements AiPort {
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

const config = {
  mode: 'ai' as const,
  human: 'p1' as const,
  names: { p1: 'You', p2: 'Rocks' },
  tier: 'rookie' as const,
  autoSkip: true,
  alwaysSkip: false,
  speed: 4 as const,
  aiCardIds: ['OP17-039'],
  aiDeck: [] as string[],
  aiPort: () => new RookiePort(),
};

function spec() {
  const { mode: _m, ...s } = SCENARIOS.lethalDemo!;
  return s;
}

/** The player gives the lethal turn away: they concede in their Main Phase with the win in hand. */
async function missed() {
  const ctl = new GameController(cardMap(), { scenario: spec() }, config);
  ctl.start();
  await sleep(60);
  expect(ctl.act({ type: 'concede', player: 'p1' })).toBe(true);
  await sleep(60);
  expect(ctl.view().result).toMatchObject({ winner: 'p2' });
  return ctl;
}

describe('the missed-lethal review', () => {
  it('flags the planted turn with certainty any-hand and a correct line', async () => {
    const ctl = await missed();
    const flags = reviewInline({
      record: ctl.session.exportRecord(),
      cards: [...ctl.cards.values()],
      seats: ['p1'],
    });
    expect(flags).toHaveLength(1);
    const f = flags[0]!;
    expect(f).toMatchObject({
      kind: 'missed-lethal',
      turn: 9,
      player: 'p1',
      severity: 'severe',
      actionIndex: 0,
    });
    expect(f.explanation.certainty).toBe('any-hand');
    expect(f.explanation.claim).toBe('You had lethal this turn.');
    expect(f.explanation.line!.length).toBeGreaterThan(1);
    expect(f.public.status).toBe('proven');
    // It checks only the human's turns, and the timeline names turn 9 as yours.
    expect(ctl.session.turns()[0]).toEqual({
      turn: 9,
      player: 'p1',
    });
    ctl.dispose();
  });

  it('Study restores the board at that decision, read-only', async () => {
    const ctl = await missed();
    const record = ctl.session.exportRecord();
    const f = reviewInline({ record, cards: [...ctl.cards.values()], seats: ['p1'] })[0]!;
    const study = new GameController(ctl.cards, record.start, {
      ...config,
      restore: { record: prefixOf(record, f.actionIndex), readOnly: true },
    });
    const v = study.view();
    expect(v.turn).toMatchObject({ number: 9, activePlayer: 'p1' });
    expect(v.result).toBeNull();
    expect(v.zones.p2.life).toHaveLength(1);
    expect(v.zones.p1.characters).toHaveLength(1);
    // Nothing can be played on it.
    expect(study.myDecision()).toBe(false);
    expect(study.actions()).toEqual([]);
    expect(study.act({ type: 'endTurn', player: 'p1' })).toBe(false);
    // The line's cards can be lit on this board: the handles the proof used are this board's.
    const refs = lineRefs(f.public, v);
    const handles = new Set(Object.values(v.zones.p1).flatMap((z) => z.map((c) => c.handle)));
    expect(
      refs
        .flat()
        .filter((h) => h.startsWith('p1'))
        .every((h) => handles.has(h)),
    ).toBe(true);
    study.dispose();
    ctl.dispose();
  });

  it('Practice this opens the moment as a puzzle that the line solves against the engine', async () => {
    const ctl = await missed();
    const record = ctl.session.exportRecord();
    const f = reviewInline({ record, cards: [...ctl.cards.values()], seats: ['p1'] })[0]!;
    const puzzle = new GameController(ctl.cards, record.start, {
      ...config,
      restore: { record: prefixOf(record, f.actionIndex), puzzle: { turn: f.turn } },
    });
    puzzle.start();
    await sleep(80);
    expect(puzzle.myDecision()).toBe(true);
    expect(puzzle.puzzleState()).toBe('open');
    // The player's line from the review: the search's own view actions.
    for (const a of f.public.viewActions!) {
      // The AI defends between attacks; the next move waits for the player's turn to come back.
      for (let i = 0; i < 200 && !puzzle.myDecision(); i++) await sleep(20);
      expect(puzzle.act(a as Action), JSON.stringify(a)).toBe(true);
    }
    for (let i = 0; i < 200 && !puzzle.view().result; i++) await sleep(20);
    expect(puzzle.view().result).toMatchObject({ winner: 'p1' });
    expect(puzzle.puzzleState()).toBe('solved');
    puzzle.dispose();
    ctl.dispose();
  });

  it('a puzzle fails when its turn ends without a win', async () => {
    const ctl = await missed();
    const record = ctl.session.exportRecord();
    const f = reviewInline({ record, cards: [...ctl.cards.values()], seats: ['p1'] })[0]!;
    const puzzle = new GameController(ctl.cards, record.start, {
      ...config,
      restore: { record: prefixOf(record, f.actionIndex), puzzle: { turn: f.turn } },
    });
    puzzle.start();
    await sleep(80);
    expect(puzzle.act({ type: 'endTurn', player: 'p1' })).toBe(true);
    await sleep(100);
    expect(puzzle.puzzleState()).toBe('failed');
    expect(puzzle.toast).toMatch(/Not this time/);
    puzzle.dispose();
    ctl.dispose();
  });

  it('actual mode is used only in review: nothing else in the app asks for it', () => {
    // `actual` reads the opponent's real hand, so it may run only after a game, in `review/`
    // (the L done criterion). The live game's detector and the battle panel use `public` only.
    const root = new URL('../src/', import.meta.url);
    const hits: string[] = [];
    const walk = (dir: URL) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const u = new URL(e.name + (e.isDirectory() ? '/' : ''), dir);
        if (e.isDirectory()) walk(u);
        else if (
          /\.tsx?$/.test(e.name) &&
          /'actual'|reviewMissedLethal/.test(readFileSync(u, 'utf8'))
        )
          hits.push(u.pathname.split('/src/')[1]!);
      }
    };
    walk(root);
    expect(hits.every((h) => h.startsWith('play/review/'))).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });
});

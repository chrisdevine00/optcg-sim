/**
 * M8 WP4: tuning and checking `TARGET_GAP` on a corpus of Warlord's own attacks (the blunder-corpus
 * method, ai/test/blunder-corpus.test.ts). Seeded Warlord-vs-Warlord games on the pinned meta lists;
 * at every attack a Warlord declared, its own view is judged exactly as the review judges a human's
 * attack, and the flag's rate is counted. Under 2% of its attacks may be flagged.
 *
 * `TARGET_GAMES=40 TARGET_REPORT=path npx vitest run ai/test/review/target-corpus.test.ts` runs the
 * larger corpus used to pick `TARGET_GAP` and writes the gap distribution as JSON. The default is
 * small (CI); the false-positive bound holds on both.
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { Action, SearchView } from '@optcg/engine';
import { cardMap, metaDecks } from '../support.ts';
import { playMatch } from '../support/match.ts';
import { expectRateAtMost } from '../support/rate.ts';
import {
  judgeTarget,
  targetSetup,
  TARGET_GAP,
  worthFlagging,
} from '../../src/search/review/target.ts';

vi.setConfig({ testTimeout: 1_800_000 });

const GAMES = Number(process.env.TARGET_GAMES ?? 4);
const FROM = Number(process.env.TARGET_FROM ?? 0);
const cards = cardMap();

interface Row {
  game: number;
  turn: number;
  targets: number;
  gap: number;
  /** `worthFlagging`: what the review would say about this attack. */
  flag: boolean;
  /** The best target is a Character and the chosen one the Leader, or the reverse. */
  kind: 'board-over-face' | 'face-over-board' | 'characters' | 'same';
}

function runCorpus(): { rows: Row[]; attacks: number; ms: number[] } {
  const decks = metaDecks();
  const rows: Row[] = [];
  const ms: number[] = [];
  let attacks = 0;
  for (let g = FROM; g < FROM + GAMES; g++) {
    const a = decks[(g * 3) % decks.length]!;
    const b = decks[(g * 3 + 1 + (g % 2)) % decks.length]!;
    playMatch({
      seed: 9000 + g,
      decks: { p1: a, p2: b },
      tiers: { p1: 'warlord', p2: 'warlord' },
      budgets: 'iterations',
      cap: 700,
      onDecision: (d) => {
        if (d.action.type !== 'attack' || !('skeleton' in d.view)) return;
        const view = d.view as SearchView;
        attacks++;
        const deck = d.player === 'p1' ? a : b;
        if (process.env.TARGET_DUMP)
          appendFileSync(
            process.env.TARGET_DUMP,
            JSON.stringify({ view, action: d.action, deck: deck.main }) + '\n',
          );
        const t0 = performance.now();
        const v = judgeTarget(
          view,
          d.action as Extract<Action, { type: 'attack' }>,
          targetSetup(view, deck.main, cards),
          { iterations: 120 },
        );
        ms.push(performance.now() - t0);
        if (v.status !== 'judged' || !v.best) return;
        const flag = worthFlagging(view, v, cards);
        const opp = d.player === 'p1' ? 'p2' : 'p1';
        const leader = view.zones[opp].leader[0]!.handle;
        const bestT = (v.best as Extract<Action, { type: 'attack' }>).target;
        const chosenT = (d.action as Extract<Action, { type: 'attack' }>).target;
        const kind =
          bestT === chosenT
            ? 'same'
            : chosenT === leader
              ? 'board-over-face'
              : bestT === leader
                ? 'face-over-board'
                : 'characters';
        rows.push({
          game: g,
          turn: view.turn.number,
          targets: view.actions.filter(
            (x) =>
              x.type === 'attack' && x.attacker === (d.action as { attacker: string }).attacker,
          ).length,
          gap: v.gap,
          flag,
          kind,
        });
      },
    });
  }
  return { rows, attacks, ms };
}

describe("Warlord's own attacks are almost never flagged", () => {
  let corpus: ReturnType<typeof runCorpus> | null = null;
  const get = () => (corpus ??= runCorpus());

  it('judges a real corpus', () => {
    expect(get().rows.length).toBeGreaterThan(GAMES * 3);
  });

  it('flags under 2% of its attacks at TARGET_GAP', () => {
    const { rows, attacks, ms } = get();
    const flagged = rows.filter((r) => r.flag);
    const gaps = rows.map((r) => r.gap).sort((x, y) => x - y);
    const q = (p: number) => gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))];
    const rate = (gap: number) => rows.filter((r) => r.gap >= gap).length / attacks;
    if (process.env.TARGET_REPORT)
      writeFileSync(
        process.env.TARGET_REPORT,
        JSON.stringify(
          {
            games: GAMES,
            attacks,
            multiTarget: rows.length,
            flagged: flagged.length,
            byKind: Object.fromEntries(
              ['board-over-face', 'face-over-board', 'characters'].map((k) => [
                k,
                flagged.filter((r) => r.kind === k).length,
              ]),
            ),
            gapQuantiles: { p50: q(0.5), p90: q(0.9), p95: q(0.95), p99: q(0.99), max: q(1) },
            rateAt: Object.fromEntries([0.4, 0.6, 0.8, 1, 1.2, 1.5, 2, 3].map((g) => [g, rate(g)])),
            threshold: TARGET_GAP,
            judgeMs: {
              p50: [...ms].sort((x, y) => x - y)[Math.floor(ms.length / 2)],
              max: Math.max(...ms),
            },
          },
          null,
          1,
        ),
      );
    // A false-positive ceiling, judged by confidence interval (docs/runbooks/testing.md).
    expectRateAtMost(flagged.length, attacks, 0.02, { label: 'Warlord attacks flagged, of all' });
    expectRateAtMost(flagged.length, rows.length, 0.02, {
      label: 'Warlord attacks flagged, of multi-target attacks',
    });
  });
});

/**
 * M7 WP2: tuning and checking the blunder thresholds on a corpus of Warlord's own choices
 * (learning-ui §2.8.6: clear mistakes only). Seeded Warlord-vs-Warlord games on the pinned meta
 * lists; every decision a Warlord made is scored from its own view and the table is asked about the
 * action it took. Under 1% of its choices may be flagged, in every kind and in all.
 *
 * `BLUNDER_GAMES=40 npx vitest run ai/test/blunder-corpus.test.ts` runs the larger corpus used to
 * pick `GAP_THRESHOLD`; `BLUNDER_REPORT=path` writes the numbers (the gap distribution) as JSON.
 */
import { writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { GAP_THRESHOLD, scoreDecision } from '../src/coach/blunder.ts';
import { actionKey, type BlunderKind } from '../src/coach/types.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch } from './support/match.ts';
import { expectRateAtMost } from './support/rate.ts';
import type { SearchView } from '@optcg/engine';

vi.setConfig({ testTimeout: 1_800_000 });

const GAMES = Number(process.env.BLUNDER_GAMES ?? 4);
const FROM = Number(process.env.BLUNDER_FROM ?? 0);
const cards = cardMap();

interface Row {
  game: number;
  kind: string;
  chosen: BlunderKind[];
  gap: number | null;
  options: number;
}

function runCorpus(): { rows: Row[]; decisions: number; ms: number[] } {
  const decks = metaDecks();
  const rows: Row[] = [];
  const ms: number[] = [];
  let decisions = 0;
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
        if (!('skeleton' in d.view)) return;
        const view = d.view as SearchView;
        const opts = view.actions.filter((x) => x.type !== 'concede');
        if (opts.length < 2) return; // a forced move is never a mistake and is never asked about
        const deck = d.player === 'p1' ? a : b;
        const opp = d.player === 'p1' ? b : a;
        const t0 = performance.now();
        const table = scoreDecision(view, {
          cards,
          game: { ownDeck: deck.main, leader: deck.leader, opponentLeader: opp.leader },
          budget: { iterations: 120 },
          lethalCap: { nodes: 6000 },
        });
        ms.push(performance.now() - t0);
        decisions++;
        const key = actionKey(d.action);
        const best = table.values[table.best];
        const mine = table.values[key];
        rows.push({
          game: g,
          kind: view.decision?.kind ?? '',
          chosen: table.kinds[key] ?? [],
          gap: best !== undefined && mine !== undefined ? best - mine : null,
          options: opts.length,
        });
      },
    });
  }
  return { rows, decisions, ms };
}

describe("Warlord's own choices are almost never flagged", () => {
  let corpus: ReturnType<typeof runCorpus> | null = null;
  const get = () => (corpus ??= runCorpus());

  it('scores a real corpus', () => {
    expect(get().decisions).toBeGreaterThan(GAMES * 20);
  });

  it('flags under 1% of its choices, overall and by kind', () => {
    const { rows, decisions, ms } = get();
    const count = (k: BlunderKind) => rows.filter((r) => r.chosen.includes(k)).length;
    const any = rows.filter((r) => r.chosen.length > 0).length;
    if (process.env.BLUNDER_REPORT) {
      const gaps = rows
        .filter((r) => r.gap !== null && ['choose', 'optional', 'trigger'].includes(r.kind))
        .map((r) => r.gap!)
        .sort((x, y) => x - y);
      const q = (p: number) => gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))];
      writeFileSync(
        process.env.BLUNDER_REPORT,
        JSON.stringify(
          {
            games: GAMES,
            decisions,
            flagged: any,
            byKind: {
              'missed-lethal': count('missed-lethal'),
              'unused-don': count('unused-don'),
              gap: count('gap'),
            },
            gapEligible: gaps.length,
            gapQuantiles: { p50: q(0.5), p90: q(0.9), p95: q(0.95), p99: q(0.99), max: q(1) },
            threshold: GAP_THRESHOLD,
            scoreMs: {
              p50: [...ms].sort((x, y) => x - y)[Math.floor(ms.length / 2)],
              max: Math.max(...ms),
            },
          },
          null,
          1,
        ),
      );
    }
    // A false-positive ceiling, judged by confidence interval (docs/runbooks/testing.md).
    expectRateAtMost(any, decisions, 0.01, { label: 'Warlord choices flagged, any kind' });
    for (const k of ['missed-lethal', 'unused-don', 'gap'] as const)
      expectRateAtMost(count(k), decisions, 0.01, { label: `Warlord choices flagged: ${k}` });
  });
});

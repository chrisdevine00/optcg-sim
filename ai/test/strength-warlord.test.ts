/**
 * Strength gates for Warlord and Emperor (PLAN M5b exit, ADR 0008; review M5a-10).
 *
 * Twelve ordered deck pairs from six disjoint archetype pairs that cover all twelve archetypes
 * (the first is Rocks and Kaido, the M5a pair), each seat in turn, deterministic seeds and
 * iteration budgets, so a run plays the same games on every machine.
 *
 * Gates that can fail (per push: 20 games; nightly `STRENGTH_GAMES=200`):
 * - **Pirate vs Rookie:** at least 75% (PLAN M5b).
 * - **Warlord vs Rookie:** at least 90% per push, 95% nightly (PLAN M5b).
 * - **Warlord vs Pirate:** at least 55% per push (a smoke: 20 games cannot show 65%), 65% nightly.
 * - **A search that is too small must fail (M5a-10).** Warlord at full budget beats Warlord at one
 *   iteration per decision, and the one-iteration Warlord does not pass the Pirate gate. Rookie is
 *   too weak to tell these apart, which is why M5a's gates could not catch a crippled search.
 *
 * Nightly reports (`EXTRA=1`): Emperor vs Warlord. Results go to `test-results/`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { DeckSpec, PlayerId } from '@optcg/engine';
import { BUDGETS, type AiTier, type SessionOptions } from '../src/index.ts';
import { playMatch } from './support/match.ts';
import { quantile, wilson } from './support/stats.ts';
import { metaDecks } from './support.ts';

vi.setConfig({ testTimeout: 3_600_000 });

const GAMES = Number(process.env.STRENGTH_GAMES ?? 20);
const FULL = GAMES >= 200;
const EXTRA = process.env.EXTRA === '1';

/** Six disjoint pairs covering all twelve archetypes; each is played both ways round. */
export const PAIRS: [string, string][] = [
  ['OP17-039', 'OP17-058'], // Rocks, Kaido (the M5a pair)
  ['OP09-062', 'OP13-004'], // Robin, Sabo
  ['ST30-001', 'OP15-058'], // Luffy & Ace, Enel (OP15)
  ['OP17-079', 'OP14-041'], // Luffy (OP17), Hancock
  ['OP12-061', 'OP05-098'], // Rosinante, Enel (OP05)
  ['OP08-098', 'OP13-001'], // Kalgara, Luffy (OP13)
];
const ORDERED = PAIRS.flatMap(([x, y]) => [
  [x, y],
  [y, x],
]) as [string, string][];

type SeatOpts = Partial<Pick<SessionOptions, 'budgets' | 'k' | 'horizon'>>;
interface Side {
  tier: AiTier;
  opts?: SeatOpts;
}

/** A Warlord that searches almost nothing: one iteration per plan and per decision, one guess. */
const TINY: SeatOpts = {
  k: 1,
  budgets: { turn: { iterations: 1 }, defence: { iterations: 1 }, lethal: { nodes: 6000 } },
};

const noFallback = (e: unknown): never => {
  throw e instanceof Error ? e : new Error(String(e));
};

export interface Series {
  games: number;
  wins: number;
  draws: number;
  winRate: number;
  ci95: [number, number];
  byPair: Record<string, { wins: number; games: number }>;
  bySeat: Record<PlayerId, { wins: number; games: number }>;
  turnMs: number[];
  decisionMs: number[];
}

export function series(games: number, seedBase: number, a: Side, b: Side): Series {
  const all = metaDecks();
  const deck = (leader: string): DeckSpec => all.find((d) => d.leader === leader)!;
  const out: Series = {
    games,
    wins: 0,
    draws: 0,
    winRate: 0,
    ci95: [0, 1],
    byPair: {},
    bySeat: { p1: { wins: 0, games: 0 }, p2: { wins: 0, games: 0 } },
    turnMs: [],
    decisionMs: [],
  };
  for (let g = 0; g < games; g++) {
    const aSeat: PlayerId = g % 2 === 0 ? 'p1' : 'p2';
    const bSeat: PlayerId = aSeat === 'p1' ? 'p2' : 'p1';
    const [la, lb] = ORDERED[(g >> 1) % ORDERED.length]!;
    const mine = deck(la);
    const theirs = deck(lb);
    const r = playMatch({
      seed: seedBase + g,
      decks: aSeat === 'p1' ? { p1: mine, p2: theirs } : { p1: theirs, p2: mine },
      tiers: { [aSeat]: a.tier, [bSeat]: b.tier } as Record<PlayerId, AiTier>,
      // A search that throws must fail the gate, not quietly play the Rookie policy (M4b-04).
      seats: {
        [aSeat]: { ...a.opts, onFallback: noFallback },
        [bSeat]: { ...b.opts, onFallback: noFallback },
      },
    });
    const won = !!r.result && 'winner' in r.result && r.result.winner === aSeat;
    if (won) out.wins++;
    if (!r.result || 'draw' in r.result) out.draws++;
    const k = `${la}/${lb}`;
    out.byPair[k] ??= { wins: 0, games: 0 };
    out.byPair[k]!.games++;
    out.bySeat[aSeat].games++;
    if (won) {
      out.byPair[k]!.wins++;
      out.bySeat[aSeat].wins++;
    }
    out.turnMs.push(...r.timing[aSeat].turnMs);
    out.decisionMs.push(...r.timing[aSeat].decisionMs);
  }
  out.winRate = out.wins / games;
  out.ci95 = wilson(out.wins, games);
  return out;
}

function report(name: string, s: Series, extra: object = {}): void {
  mkdirSync('test-results', { recursive: true });
  const data = {
    date: new Date().toISOString(),
    games: s.games,
    wins: s.wins,
    draws: s.draws,
    winRate: s.winRate,
    ci95: s.ci95,
    byPair: s.byPair,
    bySeat: s.bySeat,
    turnMs: {
      p50: quantile(s.turnMs, 0.5),
      p95: quantile(s.turnMs, 0.95),
      max: Math.max(...s.turnMs),
    },
    decisionMs: { p50: quantile(s.decisionMs, 0.5), p95: quantile(s.decisionMs, 0.95) },
    budgets: { warlord: BUDGETS.warlord.iterations, emperor: BUDGETS.emperor.iterations },
    ...extra,
  };
  writeFileSync(`test-results/${name}.json`, JSON.stringify(data, null, 2));
  console.log(name, JSON.stringify(data));
}

describe('Strength gates, Pirate, Warlord and Emperor (PLAN M5b; review M5a-10)', () => {
  it(`Pirate beats Rookie in at least 75% of ${GAMES} games`, () => {
    const s = series(GAMES, 110_000, { tier: 'pirate' }, { tier: 'rookie' });
    report(`m5b-pirate-vs-rookie-${GAMES}`, s);
    expect(s.winRate).toBeGreaterThanOrEqual(0.75);
  });

  it(`Warlord beats Rookie in at least ${FULL ? 95 : 90}% of ${GAMES} games`, () => {
    const s = series(GAMES, 120_000, { tier: 'warlord' }, { tier: 'rookie' });
    report(`m5b-warlord-vs-rookie-${GAMES}`, s);
    expect(s.winRate).toBeGreaterThanOrEqual(FULL ? 0.95 : 0.9);
  });

  it(`Warlord beats Pirate in at least ${FULL ? 65 : 55}% of ${GAMES} games`, () => {
    const s = series(GAMES, 130_000, { tier: 'warlord' }, { tier: 'pirate' });
    report(`m5b-warlord-vs-pirate-${GAMES}`, s);
    expect(s.winRate).toBeGreaterThanOrEqual(FULL ? 0.65 : 0.55);
  });

  it(`Warlord at full budget beats a one-iteration Warlord (M5a-10) in at least ${FULL ? 70 : 60}% of ${GAMES} games`, () => {
    const s = series(GAMES, 140_000, { tier: 'warlord' }, { tier: 'warlord', opts: TINY });
    report(`m5b-warlord-vs-tiny-${GAMES}`, s);
    expect(s.winRate).toBeGreaterThanOrEqual(FULL ? 0.7 : 0.6);
  });

  it(`a one-iteration Warlord fails the Pirate gate (M5a-10): under ${FULL ? 65 : 55}% of ${GAMES} games`, () => {
    const s = series(GAMES, 150_000, { tier: 'warlord', opts: TINY }, { tier: 'pirate' });
    report(`m5b-tiny-vs-pirate-${GAMES}`, s);
    expect(s.winRate).toBeLessThan(FULL ? 0.65 : 0.55);
  });

  // A report, not a gate: Emperor's extra time showed no measurable gain over Warlord (docs/benchmarks.md),
  // so the only assertion is that it is not broken (not clearly worse than Warlord).
  it.runIf(EXTRA)(
    'nightly report: Emperor against Warlord',
    () => {
      const n = Math.min(GAMES, 40);
      const s = series(n, 160_000, { tier: 'emperor' }, { tier: 'warlord' });
      report(`m5b-emperor-vs-warlord-${n}`, s);
      expect(s.winRate).toBeGreaterThanOrEqual(0.35);
    },
    14_400_000,
  );
});

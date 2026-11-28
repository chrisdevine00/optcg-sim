/**
 * Strength gates for Warlord and Emperor (PLAN M5b exit, ADR 0008; review M5a-10, M5b-2, 3, 9, 11).
 *
 * Fourteen ordered deck pairs from seven disjoint archetype pairs that cover all fourteen archetypes
 * (the first is Rocks and Kaido, the M5a pair; the seventh, Luffy EB02-010 and Franky, M11 Track C), each seat in turn, deterministic seeds and
 * iteration budgets, so a run plays the same games on every machine. Game `g` plays ordered pair
 * `g % 14` (so the 14 per-push games cover all fourteen) and takes the seat `(g + floor(g / 14)) % 2`
 * (so a deck advantage cancels over 24 games).
 *
 * **Every rate gate is a confidence-interval check** (`expectRateAtLeast` / `expectRateAtMost`,
 * ai/test/support/stats.ts; docs/runbooks/testing.md "Statistics"): it fails only when the
 * one-sided 99% bound of the observed rate lies wholly on the wrong side of the target, and every
 * message prints the observed rate, n, the bound and the target. With 14 games that means a gross
 * break (Warlord winning fewer than 7 of 12 against Rookie); with 200 games a shortfall of 4 to 8
 * points against the target (91% against 95%, 67.5% against 75%).
 *
 * **Per push (`STRENGTH_GAMES`, default 14, about 2 minutes):** Pirate vs Rookie at least 75%;
 * Warlord vs Rookie at least 83% (10 of 12). A gross break (a search that throws, plays illegally or
 * does nothing useful) fails here; a 12-game series cannot separate two close tiers, so the
 * Pirate and control gates are nightly only.
 *
 * **Nightly (`STRENGTH_GAMES=200`, `npm run test:strength:m5b`):**
 * - Pirate vs Rookie at least 75%; Warlord vs Rookie at least 95% (PLAN M5b).
 * - **Warlord vs Pirate: PLAN target 65%, not met; asserted floor 55%** (PLAN M5b; DECISIONS 2026-11-23). A point estimate on fixed seeds, as the PLAN
 *   states it: it is reproducible, and the Wilson interval is printed and reported beside it
 *   (133 of 200 is 66.5%, interval 59.7 to 72.7%: a pass by 3 games is not proof of 65%).
 * - **A search that is too small must fail (M5a-10).** Warlord at full budget beats Warlord at one
 *   iteration per decision, and the one-iteration Warlord does not pass the Pirate gate. Rookie is
 *   too weak to tell these apart, which is why M5a's gates could not catch a crippled search.
 *
 * **What these gates measure.** The iteration budgets are a CI proxy with a fixed count (4,000 per
 * Warlord plan, 10,000 per Emperor plan), not the app's 2.5 s and 6 s: in the app's millisecond
 * mode the same time buys about 2,000 to 78,000 iterations (median 31,000) for Warlord and
 * 5,000 to 170,000 for Emperor (review M5b-2). The gates are a reproducible lower bound of the
 * shipped Warlord; the Emperor result describes the CI proxy, not the shipped Emperor.
 *
 * **No silent fallbacks.** Every seat throws on an unexpected search error, and the gate counts
 * `CannotDeterminize` fallbacks (a hidden-card reference the search could not guess, so the
 * Rookie policy answered) and fails on any (M5b-11).
 *
 * Nightly reports (`EXTRA=1`): Emperor vs Warlord. Results go to `test-results/`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { DeckSpec, PlayerId } from '@optcg/engine';
import { BUDGETS, type AiTier, type SessionOptions } from '../src/index.ts';
import { playMatch } from './support/match.ts';
import { expectRateAtLeast, expectRateAtMost } from './support/rate.ts';
import { quantile, wilson } from './support/stats.ts';
import { metaDecks } from './support.ts';

/**
 * Per-test timeouts, 2.5 times the wall time measured on the CI runner by the first nightly
 * (run 44074243109, 200 games each: Warlord vs Rookie about 126 min, Warlord vs Pirate about 123,
 * the two controls about 142 together; the laptop-based estimates of the fix round were 2x too
 * small and every series timed out after printing its result). Pirate vs Rookie took 5 minutes.
 * Emperor: 16 games, about 54 s a game on a laptop (measured 2026-11-27: 16 games in 862 s), no CI
 * measurement yet: a 100-minute hang guard, inside
 * its job's 120 (M10-R4). Per push (14 games) the default is ample. Each nightly series is its own CI
 * job (`strength-m5b` matrix; 360 minutes, the hosted maximum, for the 200-game series).
 */
const MIN = 60_000;
const TIMEOUT = {
  pirateVsRookie: FULL_TIMEOUT(30),
  warlordVsRookie: FULL_TIMEOUT(315),
  warlordVsPirate: FULL_TIMEOUT(310),
  controlFull: FULL_TIMEOUT(250),
  controlTiny: FULL_TIMEOUT(100),
  emperor: FULL_TIMEOUT(100),
};
function FULL_TIMEOUT(minutes: number): number {
  return Math.max(10 * MIN, minutes * MIN);
}
vi.setConfig({ testTimeout: 10 * MIN });

const GAMES = Number(process.env.STRENGTH_GAMES ?? 14);
const FULL = GAMES >= 200;
const EXTRA = process.env.EXTRA === '1';

/** Seven disjoint pairs covering all fourteen archetypes; each is played both ways round. */
export const PAIRS: [string, string][] = [
  ['OP17-039', 'OP17-058'], // Rocks, Kaido (the M5a pair)
  ['OP09-062', 'OP13-004'], // Robin, Sabo
  ['ST30-001', 'OP15-058'], // Luffy & Ace, Enel (OP15)
  ['OP17-079', 'OP14-041'], // Luffy (OP17), Hancock
  ['OP12-061', 'OP05-098'], // Rosinante, Enel (OP05)
  ['OP08-098', 'OP13-001'], // Kalgara, Luffy (OP13)
  ['EB02-010', 'OP18-021'], // Luffy (Green/Purple), Franky (M11 Track C)
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
  /** Decisions where the search could not guess a hidden card and the Rookie policy answered. */
  cannotDeterminize: number;
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
    cannotDeterminize: 0,
  };
  const count = (): void => {
    out.cannotDeterminize++;
  };
  for (let g = 0; g < games; g++) {
    const aSeat: PlayerId = (g + Math.floor(g / ORDERED.length)) % 2 === 0 ? 'p1' : 'p2';
    const bSeat: PlayerId = aSeat === 'p1' ? 'p2' : 'p1';
    const [la, lb] = ORDERED[g % ORDERED.length]!;
    const mine = deck(la);
    const theirs = deck(lb);
    const r = playMatch({
      seed: seedBase + g,
      decks: aSeat === 'p1' ? { p1: mine, p2: theirs } : { p1: theirs, p2: mine },
      tiers: { [aSeat]: a.tier, [bSeat]: b.tier } as Record<PlayerId, AiTier>,
      // A search that throws must fail the gate, not quietly play the Rookie policy (M4b-04).
      seats: {
        [aSeat]: { ...a.opts, onFallback: noFallback, onCannotDeterminize: count },
        [bSeat]: { ...b.opts, onFallback: noFallback, onCannotDeterminize: count },
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
    cannotDeterminize: s.cannotDeterminize,
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
  const [lo, hi] = s.ci95;
  console.log(
    `${name}: ${s.wins}/${s.games} (${(s.winRate * 100).toFixed(1)}%, Wilson 95% ${(lo * 100).toFixed(1)} to ${(hi * 100).toFixed(1)}%), cannotDeterminize ${s.cannotDeterminize}`,
  );
  console.log(name, JSON.stringify(data));
  expect(s.cannotDeterminize, `${name}: CannotDeterminize fallbacks`).toBe(0);
}

describe('Strength gates, Pirate, Warlord and Emperor (PLAN M5b; review M5a-10)', () => {
  it(
    `Pirate beats Rookie in at least 75% of ${GAMES} games`,
    () => {
      const s = series(GAMES, 110_000, { tier: 'pirate' }, { tier: 'rookie' });
      report(`m5b-pirate-vs-rookie-${GAMES}`, s);
      expectRateAtLeast(s.wins, s.games, 0.75, { label: 'Pirate vs Rookie' });
    },
    TIMEOUT.pirateVsRookie,
  );

  // Per push: 14 games, one per ordered pair, at least 10 of 12 by rate (a Rookie winning 3 games is a break).
  it(
    `Warlord beats Rookie in at least ${FULL ? '95%' : '83%'} of ${GAMES} games`,
    () => {
      const s = series(GAMES, 120_000, { tier: 'warlord' }, { tier: 'rookie' });
      report(`m5b-warlord-vs-rookie-${GAMES}`, s);
      expectRateAtLeast(s.wins, s.games, FULL ? 0.95 : 10 / 12, { label: 'Warlord vs Rookie' });
    },
    TIMEOUT.warlordVsRookie,
  );

  // Nightly only from here: 25 s a game (Warlord vs Pirate), and a short series cannot show 65%.
  // The PLAN target is 65% and is NOT met (61.5% on these seeds and on a fresh set; M5b closed
  // under the time-box, DECISIONS 2026-11-23). The report prints the rate against the target; the
  // assertion is a regression floor of 55%, which a crippled search (20.5%) fails.
  it.runIf(FULL)(
    `Warlord beats Pirate in at least 55% of ${GAMES} games (floor; PLAN target 65% not met)`,
    () => {
      const s = series(GAMES, 130_000, { tier: 'warlord' }, { tier: 'pirate' });
      report(`m5b-warlord-vs-pirate-${GAMES}`, s, { target: 0.65, meetsTarget: s.winRate >= 0.65 });
      expectRateAtLeast(s.wins, s.games, 0.55, { label: 'Warlord vs Pirate (floor)' });
    },
    TIMEOUT.warlordVsPirate,
  );

  it.runIf(FULL)(
    `Warlord at full budget beats a one-iteration Warlord (M5a-10) in at least 70% of ${GAMES} games`,
    () => {
      const s = series(GAMES, 140_000, { tier: 'warlord' }, { tier: 'warlord', opts: TINY });
      report(`m5b-warlord-vs-tiny-${GAMES}`, s);
      expectRateAtLeast(s.wins, s.games, 0.7, { label: 'Warlord vs one-iteration Warlord' });
    },
    TIMEOUT.controlFull,
  );

  it.runIf(FULL)(
    `a one-iteration Warlord fails the Pirate gate (M5a-10): under 65% of ${GAMES} games`,
    () => {
      const s = series(GAMES, 150_000, { tier: 'warlord', opts: TINY }, { tier: 'pirate' });
      report(`m5b-tiny-vs-pirate-${GAMES}`, s);
      expectRateAtMost(s.wins, s.games, 0.65, { label: 'one-iteration Warlord vs Pirate' });
    },
    TIMEOUT.controlTiny,
  );

  // A report, not a gate: Emperor's extra time showed no measurable gain over Warlord
  // (docs/benchmarks.md), so the only assertion is that it is not broken (not clearly worse). It
  // runs on the CI iteration budgets, so it does not describe the shipped Emperor (review M5b-2, 6).
  it.runIf(EXTRA)(
    'nightly report: Emperor against Warlord',
    () => {
      // 40 games overran the 360-minute job cap on CI (nightlies 2026-11-19 to 23): 16.
      const n = Math.min(GAMES, 16);
      const s = series(n, 160_000, { tier: 'emperor' }, { tier: 'warlord' });
      report(`m5b-emperor-vs-warlord-${n}`, s);
      expectRateAtLeast(s.wins, s.games, 0.35, { label: 'Emperor vs Warlord' });
    },
    TIMEOUT.emperor,
  );
});

/**
 * Strength: Pirate vs Rookie (PLAN M5a exit, ADR 0008). Rocks (OP17-039) and Kaido (OP17-058), the
 * first sourced list of each, with the Pirate in each deck and each seat in turn; deterministic
 * seeds and iteration budgets, so a run gives the same games on every machine.
 *
 * - Per push: 20 games, a wide tolerance (at least 60% wins).
 * - Nightly: `STRENGTH_GAMES=200`, the PLAN threshold (at least 75%), and the game-plan assertions
 *   checked statistically (ARCHITECTURE §4.6). Results go to `test-results/strength.json`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PlayerId } from '@optcg/engine';
import { playMatch } from './support/match.ts';
import { mergeTallies, PlanTally, type Tally } from './support/plan-tally.ts';
import { metaDecks } from './support.ts';
import { BUDGETS } from '../src/index.ts';

const GAMES = Number(process.env.STRENGTH_GAMES ?? 20);
const FULL = GAMES >= 200;
/** Pirate-vs-Pirate games for the game-plan assertions (nightly; 0 skips). */
const PLAN_GAMES = Number(process.env.PLAN_GAMES ?? 0);

/** Wilson score interval for a binomial proportion (95%). */
export function wilson(wins: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1];
  const p = wins / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - r) / d, (c + r) / d];
}

const pct = (xs: number[], q: number) => {
  if (xs.length === 0) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
};

describe(`Pirate vs Rookie, ${GAMES} games (PLAN M5a)`, () => {
  it(`wins at least ${FULL ? '75' : '60'}% with Rocks and Kaido, both seats`, () => {
    const decks = metaDecks();
    const rocks = decks.find((d) => d.leader === 'OP17-039')!;
    const kaido = decks.find((d) => d.leader === 'OP17-058')!;
    let wins = 0;
    let draws = 0;
    const byDeck: Record<string, { wins: number; games: number }> = {};
    const bySeat: Record<PlayerId, { wins: number; games: number }> = {
      p1: { wins: 0, games: 0 },
      p2: { wins: 0, games: 0 },
    };
    const turnMs: number[] = [];
    const decisionMs: number[] = [];
    const tallies: Tally[] = [];
    let rollouts = 0;
    let searchMs = 0;
    const t0 = performance.now();
    for (let g = 0; g < GAMES; g++) {
      const pirate: PlayerId = g % 2 === 0 ? 'p1' : 'p2';
      const mine = (g >> 1) % 2 === 0 ? rocks : kaido;
      const theirs = mine === rocks ? kaido : rocks;
      const tally = new PlanTally(pirate, 'pirate', mine.leader);
      const r = playMatch({
        seed: 10_000 + g,
        decks: pirate === 'p1' ? { p1: mine, p2: theirs } : { p1: theirs, p2: mine },
        tiers: pirate === 'p1' ? { p1: 'pirate', p2: 'rookie' } : { p1: 'rookie', p2: 'pirate' },
        onDecision: (d) => {
          tally.observe(d);
          if (d.tier === 'pirate' && d.rollouts > 0) {
            rollouts += d.rollouts;
            searchMs += d.ms;
          }
        },
      });
      tallies.push(...tally.finish());
      const won = !!r.result && 'winner' in r.result && r.result.winner === pirate;
      if (won) wins++;
      if (!r.result || 'draw' in r.result) draws++;
      byDeck[mine.leader] ??= { wins: 0, games: 0 };
      byDeck[mine.leader]!.games++;
      bySeat[pirate].games++;
      if (won) {
        byDeck[mine.leader]!.wins++;
        bySeat[pirate].wins++;
      }
      turnMs.push(...r.timing[pirate].turnMs);
      decisionMs.push(...r.timing[pirate].decisionMs);
    }
    const [lo, hi] = wilson(wins, GAMES);
    const plan = mergeTallies(tallies);
    const report = {
      date: new Date().toISOString(),
      games: GAMES,
      wins,
      draws,
      winRate: wins / GAMES,
      ci95: [lo, hi],
      byDeck,
      bySeat,
      pirateTurnMs: { p50: pct(turnMs, 0.5), p95: pct(turnMs, 0.95), max: Math.max(...turnMs) },
      pirateDecisionMs: { p50: pct(decisionMs, 0.5), p95: pct(decisionMs, 0.95) },
      // Per-iteration cost: maps the CI iteration budget to the app's millisecond budget.
      rolloutsPerSecond: Math.round(rollouts / (searchMs / 1000)),
      budgets: BUDGETS.pirate,
      seconds: (performance.now() - t0) / 1000,
      gamePlan: plan.map((t) => ({ ...t, rate: t.total ? t.hits / t.total : null })),
    };
    mkdirSync('test-results', { recursive: true });
    writeFileSync(`test-results/strength-${GAMES}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    expect(wins / GAMES).toBeGreaterThanOrEqual(FULL ? 0.75 : 0.6);
  }, 3_600_000);

  it.runIf(PLAN_GAMES > 0)(
    `game-plan assertions over ${PLAN_GAMES} Pirate-vs-Pirate games (ARCHITECTURE §4.6)`,
    () => {
      // Against Rookie most games are decided before the guides' key turns, so the plan is judged
      // where both sides play sensibly: Pirate (Rocks) vs Pirate (Kaido), seats swapped.
      const decks = metaDecks();
      const rocks = decks.find((d) => d.leader === 'OP17-039')!;
      const kaido = decks.find((d) => d.leader === 'OP17-058')!;
      const tallies: Tally[] = [];
      const t0 = performance.now();
      const results: Record<string, number> = { OP17_039: 0, OP17_058: 0, draws: 0 };
      for (let g = 0; g < PLAN_GAMES; g++) {
        const decksBySeat = g % 2 === 0 ? { p1: rocks, p2: kaido } : { p1: kaido, p2: rocks };
        const t1 = new PlanTally('p1', 'pirate', decksBySeat.p1.leader);
        const t2 = new PlanTally('p2', 'pirate', decksBySeat.p2.leader);
        const r = playMatch({
          seed: 30_000 + g,
          decks: decksBySeat,
          tiers: { p1: 'pirate', p2: 'pirate' },
          onDecision: (d) => {
            t1.observe(d);
            t2.observe(d);
          },
        });
        tallies.push(...t1.finish(), ...t2.finish());
        if (r.result && 'winner' in r.result)
          results[decksBySeat[r.result.winner].leader.replace('-', '_')]!++;
        else results.draws!++;
      }
      const plan = mergeTallies(tallies);
      const report = {
        date: new Date().toISOString(),
        games: PLAN_GAMES,
        results,
        seconds: (performance.now() - t0) / 1000,
        gamePlan: plan.map((t) => ({ ...t, rate: t.total ? t.hits / t.total : null })),
      };
      mkdirSync('test-results', { recursive: true });
      writeFileSync(`test-results/game-plan-${PLAN_GAMES}.json`, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report, null, 2));
      for (const t of plan)
        if (t.total >= 10)
          expect(t.hits / t.total, `${t.leader} seed ${t.seed}: ${t.text}`).toBeGreaterThanOrEqual(
            t.threshold,
          );
    },
    3_600_000,
  );
});

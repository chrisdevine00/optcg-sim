/**
 * Strength (PLAN M5a exit, ADR 0008; review M5a-10). Rocks (OP17-039) and Kaido (OP17-058), the
 * first sourced list of each, with the Pirate in each deck and each seat in turn; deterministic
 * seeds and iteration budgets, so a run gives the same games on every machine.
 *
 * Gates that can fail:
 * - **vs Rookie:** 20 games per push at 90% or more; 200 nightly at 95% or more (the PLAN's floor
 *   is 75%). Rookie is very weak, so this alone cannot catch a search regression.
 * - **vs a shallow Pirate** (the same player scoring each move by the position right after it, with
 *   no rollout): 20 games per push and 100 nightly, at 60% or more. A Pirate whose rollouts break
 *   becomes this player and scores about 50%; the nightly control run measures exactly that.
 * Nightly also reports (`EXTRA=1`): Rookie games where the Pirate's prior leaves out the
 * opponent's actual list; the shallow-vs-shallow control; A/B runs of the playbook biases and of
 * two tuned heuristic weights; and the game-plan assertions over Pirate-vs-Pirate games, with and
 * without the biases (ARCHITECTURE §4.6). Reports go to `test-results/`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { DeckSpec, PlayerId } from '@optcg/engine';
import { BUDGETS, type SessionOptions } from '../src/index.ts';
import { playMatch, type MatchOptions } from './support/match.ts';
import { mergeTallies, PlanTally, type Tally } from './support/plan-tally.ts';
import { metaDecks } from './support.ts';

const GAMES = Number(process.env.STRENGTH_GAMES ?? 20);
const FULL = GAMES >= 200;
const SHALLOW_GAMES = Number(process.env.SHALLOW_GAMES ?? 20);
const EXTRA = process.env.EXTRA === '1';
/** Pirate-vs-Pirate games for the game-plan assertions (nightly; 0 skips). */
const PLAN_GAMES = Number(process.env.PLAN_GAMES ?? 0);
const AB_GAMES = Number(process.env.AB_GAMES ?? 0);

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

type SeatOpts = Partial<
  Pick<SessionOptions, 'budgets' | 'k' | 'biases' | 'priorWithout' | 'weights' | 'shallow'>
>;

function decks() {
  const all = metaDecks();
  return {
    rocks: all.find((d) => d.leader === 'OP17-039')!,
    kaido: all.find((d) => d.leader === 'OP17-058')!,
  };
}

/** The date of an archetype's first sourced list (the strength games' list). */
function firstListDate(leader: string): string {
  const meta = JSON.parse(
    readFileSync(new URL('../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
  ) as { archetypes: { leaderId: string; lists: { date: string }[] }[] };
  return meta.archetypes.find((a) => a.leaderId === leader)!.lists[0]!.date;
}

interface Series {
  games: number;
  wins: number;
  draws: number;
  winRate: number;
  ci95: [number, number];
  byDeck: Record<string, { wins: number; games: number }>;
  bySeat: Record<PlayerId, { wins: number; games: number }>;
  turnMs: number[];
  decisionMs: number[];
  rollouts: number;
  searchMs: number;
  tallies: Tally[];
}

/**
 * `games` games of player A (always a Pirate) against B, A in each deck and each seat in turn.
 * `opts(aSeat, aDeck)` gives each seat's options.
 */
function series(
  games: number,
  seedBase: number,
  b: { tier: 'rookie' | 'pirate'; seat?: (aDeck: DeckSpec) => SeatOpts },
  a: (aDeck: DeckSpec) => SeatOpts = () => ({}),
  observe?: (g: number, aSeat: PlayerId, aDeck: DeckSpec) => MatchOptions['onDecision'],
): Series {
  const { rocks, kaido } = decks();
  const out: Series = {
    games,
    wins: 0,
    draws: 0,
    winRate: 0,
    ci95: [0, 1],
    byDeck: {},
    bySeat: { p1: { wins: 0, games: 0 }, p2: { wins: 0, games: 0 } },
    turnMs: [],
    decisionMs: [],
    rollouts: 0,
    searchMs: 0,
    tallies: [],
  };
  for (let g = 0; g < games; g++) {
    const aSeat: PlayerId = g % 2 === 0 ? 'p1' : 'p2';
    const bSeat: PlayerId = aSeat === 'p1' ? 'p2' : 'p1';
    const mine = (g >> 1) % 2 === 0 ? rocks : kaido;
    const theirs = mine === rocks ? kaido : rocks;
    const inner = observe?.(g, aSeat, mine);
    const r = playMatch({
      seed: seedBase + g,
      decks: aSeat === 'p1' ? { p1: mine, p2: theirs } : { p1: theirs, p2: mine },
      tiers: { [aSeat]: 'pirate', [bSeat]: b.tier } as Record<PlayerId, 'pirate' | 'rookie'>,
      seats: { [aSeat]: a(mine), [bSeat]: b.seat?.(mine) ?? {} },
      onDecision: (d) => {
        inner?.(d);
        if (d.player === aSeat && d.rollouts > 0) {
          out.rollouts += d.rollouts;
          out.searchMs += d.ms;
        }
      },
    });
    const won = !!r.result && 'winner' in r.result && r.result.winner === aSeat;
    if (won) out.wins++;
    if (!r.result || 'draw' in r.result) out.draws++;
    const k = mine.leader;
    out.byDeck[k] ??= { wins: 0, games: 0 };
    out.byDeck[k]!.games++;
    out.bySeat[aSeat].games++;
    if (won) {
      out.byDeck[k]!.wins++;
      out.bySeat[aSeat].wins++;
    }
    out.turnMs.push(...r.timing[aSeat].turnMs);
    out.decisionMs.push(...r.timing[aSeat].decisionMs);
  }
  out.winRate = out.wins / games;
  out.ci95 = wilson(out.wins, games);
  return out;
}

function report(name: string, data: unknown): void {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/${name}.json`, JSON.stringify(data, null, 2));
  console.log(name, JSON.stringify(data));
}

const summary = (s: Series) => ({
  games: s.games,
  wins: s.wins,
  draws: s.draws,
  winRate: s.winRate,
  ci95: s.ci95,
  byDeck: s.byDeck,
  bySeat: s.bySeat,
});

const SHALLOW: SeatOpts = { shallow: true };

describe('Pirate strength (PLAN M5a; review M5a-10)', () => {
  it(`beats Rookie in at least ${FULL ? 95 : 90}% of ${GAMES} games`, () => {
    const t0 = performance.now();
    const s = series(GAMES, 10_000, { tier: 'rookie' });
    report(`strength-${GAMES}`, {
      date: new Date().toISOString(),
      ...summary(s),
      pirateTurnMs: {
        p50: pct(s.turnMs, 0.5),
        p95: pct(s.turnMs, 0.95),
        max: Math.max(...s.turnMs),
      },
      pirateDecisionMs: { p50: pct(s.decisionMs, 0.5), p95: pct(s.decisionMs, 0.95) },
      // Per-iteration cost: maps the CI iteration budget to the app's millisecond budget.
      rolloutsPerSecond: Math.round(s.rollouts / (s.searchMs / 1000)),
      budgets: BUDGETS.pirate,
      seconds: (performance.now() - t0) / 1000,
    });
    expect(s.winRate).toBeGreaterThanOrEqual(FULL ? 0.95 : 0.9);
  }, 3_600_000);

  it(`beats a shallow Pirate (no rollouts) in at least 60% of ${SHALLOW_GAMES} games`, () => {
    const s = series(SHALLOW_GAMES, 20_000, { tier: 'pirate', seat: () => SHALLOW });
    report(`shallow-${SHALLOW_GAMES}`, { date: new Date().toISOString(), ...summary(s) });
    expect(s.winRate).toBeGreaterThanOrEqual(0.6);
  }, 3_600_000);

  it.runIf(EXTRA)(
    'nightly reports: a non-prior list, the shallow control, and A/B runs',
    () => {
      // The Pirate's prior leaves out the list the opponent actually plays.
      const nonPrior = series(100, 40_000, { tier: 'rookie' }, (aDeck) => {
        const { rocks, kaido } = decks();
        const opp = aDeck.leader === rocks.leader ? kaido : rocks;
        return { priorWithout: firstListDate(opp.leader) };
      });
      // The control: a shallow Pirate against another, so the 60% gate can be seen to fail.
      const control = series(40, 20_000, { tier: 'pirate', seat: () => SHALLOW }, () => SHALLOW);
      const ab = (a: SeatOpts, b: SeatOpts) =>
        summary(series(AB_GAMES || 40, 60_000, { tier: 'pirate', seat: () => b }, () => a));
      report('strength-extra', {
        date: new Date().toISOString(),
        nonPriorVsRookie: summary(nonPrior),
        shallowVsShallow: summary(control),
        biasesOnVsOff: ab({}, { biases: false }),
        restedExposed015Vs035: ab({}, { weights: { restedExposed: 0.35 } }),
        lifeTableVsM5a: ab({}, { weights: { lifeMine: [0, 3.0, 6.2, 7.7, 8.8, 9.8, 10.7, 11.5] } }),
      });
      expect(nonPrior.winRate).toBeGreaterThanOrEqual(0.95);
    },
    3_600_000,
  );

  it.runIf(PLAN_GAMES > 0)(
    `game-plan assertions over ${PLAN_GAMES} Pirate-vs-Pirate games, with and without the biases`,
    () => {
      const run = (biases: boolean) => {
        const tallies: Tally[] = [];
        const results: Record<string, number> = {};
        const exempt: Record<string, { finishing: number; turns: number }> = {};
        const { rocks, kaido } = decks();
        for (let g = 0; g < PLAN_GAMES; g++) {
          const bySeat = g % 2 === 0 ? { p1: rocks, p2: kaido } : { p1: kaido, p2: rocks };
          const t1 = new PlanTally('p1', 'pirate', bySeat.p1.leader);
          const t2 = new PlanTally('p2', 'pirate', bySeat.p2.leader);
          const r = playMatch({
            seed: 30_000 + g,
            decks: bySeat,
            tiers: { p1: 'pirate', p2: 'pirate' },
            seats: { p1: { biases }, p2: { biases } },
            onDecision: (d) => {
              t1.observe(d);
              t2.observe(d);
            },
          });
          tallies.push(...t1.finish(), ...t2.finish());
          for (const [t, deck] of [
            [t1, bySeat.p1],
            [t2, bySeat.p2],
          ] as const) {
            const e = (exempt[deck.leader] ??= { finishing: 0, turns: 0 });
            e.finishing += t.exempt.finishing;
            e.turns += t.exempt.turns;
          }
          const w = r.result && 'winner' in r.result ? bySeat[r.result.winner].leader : 'draw';
          results[w] = (results[w] ?? 0) + 1;
        }
        const plan = mergeTallies(tallies);
        return {
          results,
          finishingTurnsExempted: exempt,
          plan: plan.map((t) => ({ ...t, rate: t.total ? t.hits / t.total : null })),
        };
      };
      const withBias = run(true);
      const noBias = run(false);
      report(`game-plan-${PLAN_GAMES}`, { date: new Date().toISOString(), withBias, noBias });
      for (const t of withBias.plan)
        if (t.total >= 10)
          expect(t.rate!, `${t.leader} seed ${t.seed}: ${t.text}`).toBeGreaterThanOrEqual(
            t.threshold,
          );
    },
    3_600_000,
  );
});

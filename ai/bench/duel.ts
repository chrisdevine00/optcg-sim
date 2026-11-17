/**
 * A/B duel runner for tuning and measurement:
 * `npx tsx ai/bench/duel.ts A B games [seedBase] [pairs]` where A and B are `tier[:key=value,...]`
 * (keys: turn, defence, k, horizon, shallow) and pairs is `LEADER/LEADER,...` (A's deck first).
 * Prints A's wins with a Wilson interval, per-seat and per-deck splits, and decision times.
 */
import type { DeckSpec, PlayerId } from '@optcg/engine';
import { BUDGETS, type AiTier, type SessionOptions } from '../src/index.ts';
import { TUNE } from '../src/search/mcts.ts';
import { playMatch } from '../test/support/match.ts';
import { metaDecks } from '../test/support.ts';

const [aSpec = 'warlord', bSpec = 'pirate', gamesArg = '20', seedArg = '70000', pairsArg = ''] =
  process.argv.slice(2);

type Its = { iterations: number };

function parse(spec: string): { tier: AiTier; opts: Partial<SessionOptions> } {
  const [tier, rest] = spec.split(':') as [AiTier, string | undefined];
  const kv = Object.fromEntries(
    (rest ?? '')
      .split(',')
      .filter(Boolean)
      .map((x) => x.split('=')),
  );
  const base =
    tier === 'warlord' || tier === 'emperor' ? BUDGETS[tier].iterations : BUDGETS.pirate.iterations;
  const opts: Partial<SessionOptions> = {};
  if (kv.turn || kv.defence || kv.lethal)
    opts.budgets = {
      ...(base as object),
      turn: { iterations: Number(kv.turn ?? (base.turn as Its).iterations) },
      defence: { iterations: Number(kv.defence ?? (base.defence as Its).iterations) },
      ...(kv.lethal ? { lethal: { nodes: Number(kv.lethal) } } : {}),
    } as never;
  for (const key of Object.keys(TUNE) as (keyof typeof TUNE)[])
    if (kv[key]) TUNE[key] = Number(kv[key]);
  if (kv.k) opts.k = Number(kv.k);
  if (kv.horizon) opts.horizon = Number(kv.horizon) as 1 | 2;
  if (kv.shallow) opts.shallow = true;
  if (kv.qp) opts.quickPlays = kv.qp === '1';
  return { tier, opts };
}

export const wilson = (w: number, n: number, z = 1.96): [number, number] => {
  const p = w / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - r) / d, (c + r) / d];
};

const all = metaDecks();
/** `LEADER` is that archetype's first list; `LEADER#2` its third (0-based). */
const pick = (l: string): DeckSpec => {
  const [leader, j] = l.split('#');
  return all.filter((d) => d.leader === leader)[Number(j ?? 0)]!;
};
const PAIRS: [string, string][] = pairsArg
  ? pairsArg.split(',').map((p) => p.split('/') as [string, string])
  : [
      ['OP17-039', 'OP17-058'],
      ['OP17-058', 'OP17-039'],
    ];
const A = parse(aSpec);
const B = parse(bSpec);
const games = Number(gamesArg);
const seedBase = Number(seedArg);
let wins = 0;
let draws = 0;
const seat: Record<string, [number, number]> = { p1: [0, 0], p2: [0, 0] };
const deck: Record<string, [number, number]> = {};
const ms: number[] = [];
const turnMs: number[] = [];
const t0 = performance.now();
for (let g = 0; g < games; g++) {
  const aSeat: PlayerId = g % 2 === 0 ? 'p1' : 'p2';
  const bSeat: PlayerId = aSeat === 'p1' ? 'p2' : 'p1';
  const [la, lb] = PAIRS[(g >> 1) % PAIRS.length]!;
  const mine: DeckSpec = pick(la);
  const theirs: DeckSpec = pick(lb);
  const r = playMatch({
    seed: seedBase + g,
    decks: aSeat === 'p1' ? { p1: mine, p2: theirs } : { p1: theirs, p2: mine },
    tiers: { [aSeat]: A.tier, [bSeat]: B.tier } as Record<PlayerId, AiTier>,
    seats: { [aSeat]: A.opts, [bSeat]: B.opts },
  });
  const won = !!r.result && 'winner' in r.result && r.result.winner === aSeat;
  if (won) wins++;
  if (!r.result || 'draw' in r.result) draws++;
  seat[aSeat]![1]++;
  const k = `${la}/${lb}`;
  deck[k] ??= [0, 0];
  deck[k]![1]++;
  if (won) {
    seat[aSeat]![0]++;
    deck[k]![0]++;
  }
  ms.push(...r.timing[aSeat].decisionMs);
  turnMs.push(...r.timing[aSeat].turnMs);
}
const q = (xs: number[], p: number) =>
  xs.slice().sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))] ?? 0;
const [lo, hi] = wilson(wins, games);
console.log(
  JSON.stringify({
    a: aSpec,
    b: bSpec,
    games,
    wins,
    draws,
    rate: +(wins / games).toFixed(3),
    ci95: [+lo.toFixed(3), +hi.toFixed(3)],
    seat,
    deck,
    turnMs: {
      p50: Math.round(q(turnMs, 0.5)),
      p95: Math.round(q(turnMs, 0.95)),
      max: Math.round(Math.max(...turnMs)),
    },
    decisionMs: {
      p50: Math.round(q(ms, 0.5)),
      p95: Math.round(q(ms, 0.95)),
      max: Math.round(Math.max(...ms)),
    },
    seconds: Math.round((performance.now() - t0) / 1000),
  }),
);

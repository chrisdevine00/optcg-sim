/**
 * The review bench (M8 WP1): runs the whole pipeline on the 300-decision fixture with the app's real
 * (wall-clock) caps and prints phase times and the marker rate.
 * `npx tsx ai/bench/review.ts [seats=p1|p2|both] [deadlineMs] [seed]`
 * The marker rate is the share of the reviewed seats' turns that carry a "Not fully checked" marker
 * (target: 10% or less). The time is single-threaded; the app's pool divides the search phases.
 */
import { performance } from 'node:perf_hooks';
import type { PlayerId } from '@optcg/engine';
import { reviewRecord } from '../src/index.ts';
import { makeFixture } from '../../scripts/review-fixture.ts';

const [seatArg = 'p1', deadlineArg = '55000', seedArg] = process.argv.slice(2);
const seats: PlayerId[] = seatArg === 'both' ? ['p1', 'p2'] : [seatArg as PlayerId];
const fixture = makeFixture(seedArg ? { seed: Number(seedArg) } : {});
const t0 = performance.now();
const r = reviewRecord(fixture.record, fixture.cards, { seats, deadlineMs: Number(deadlineArg) });
const ms = performance.now() - t0;
const reviewedTurns = new Set<number>();
for (const it of r.plan.items) reviewedTurns.add(it.turn);
const marked = new Set(r.markers.map((m) => m.turn));
const flags = r.results.flatMap((x) => x.flags);
console.log(
  JSON.stringify({
    seed: fixture.seed,
    decisions: fixture.decisions,
    seats,
    items: r.plan.items.length,
    ms: Math.round(ms),
    phaseMs: Object.fromEntries(Object.entries(r.phaseMs).map(([k, v]) => [k, Math.round(v)])),
    phaseItems: r.phaseItems,
    flags: flags.length,
    markers: r.markers.map((m) => `${m.turn}:${m.kind}:${m.reason}`),
    markerRate: +(marked.size / Math.max(1, reviewedTurns.size)).toFixed(3),
  }),
);

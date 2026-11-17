/**
 * Two-turn simulation throughput (PLAN M4a exit criterion, ADR 0008): how many random two-turn
 * playouts per second the engine runs on the scripted Rocks (OP17-039) vs Kaido (OP17-058) decks,
 * measured inside a `worker_threads` worker, as the AI's search would run in a Web Worker.
 *
 *   npm run bench:two-turn            (defaults: 4 s per run, 3 runs)
 *   BENCH_SECONDS=10 BENCH_RUNS=5 npm run bench:two-turn
 *   BENCH_MATCHUPS=OP13-004:OP17-039,OP15-058:OP17-058 npm run bench:two-turn
 *
 * Without BENCH_MATCHUPS, the M4a matchup (Rocks vs Kaido) and four M4b archetypes (each against
 * Rocks): Sabo OP13-004, Luffy & Ace ST30-001, Enel OP15-058, Boa Hancock OP14-041. Each matchup
 * is its own set of worker runs and its own median.
 *
 * Method:
 * 1. Start positions: 40 seeded random Rocks-vs-Kaido games (both seatings), keeping the state at
 *    the start of every Main Phase from turn 3 on: about 400 positions with real boards, hands,
 *    DON!! and pending effect state.
 * 2. One simulation: from a start position, pick uniformly weighted legal actions (the policy of
 *    the property tests: no concession, ending the turn less likely while other moves exist) and
 *    `reduce` until two turns have ended or the game is over. Every scripted effect, cost, choice
 *    and replacement on the way is resolved by the same random policy.
 * 3. The worker runs simulations round-robin over the positions for the time budget and reports
 *    simulations, actions and elapsed time. `legalActions` is called once per action, as a search
 *    would; nothing is cached across simulations.
 */
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import {
  createGame,
  legalActions,
  nextInt,
  queries,
  reduce,
  seedRng,
  type Action,
  type GameState,
} from '../src/index.ts';
import { cards } from '../test/fixtures/index.ts';
import { metaDecks } from '../test/support/decks.ts';

interface Result {
  sims: number;
  actions: number;
  ms: number;
  positions: number;
}

function pick(legal: Action[], rng: number): [Action, number] {
  const options = legal.filter((a) => a.type !== 'concede');
  const weights = options.map((a) => (a.type === 'endTurn' ? 1 : a.type === 'giveDon' ? 2 : 4));
  const total = weights.reduce((x, y) => x + y, 0);
  let v: number;
  [v, rng] = nextInt(rng, total);
  for (let i = 0; i < options.length; i++) {
    v -= weights[i]!;
    if (v < 0) return [options[i]!, rng];
  }
  return [options.at(-1)!, rng];
}

function startPositions(leaderA: string, leaderB: string): GameState[] {
  const all = metaDecks();
  const rocks = all.find((d) => d.leader === leaderA)!;
  const kaido = all.find((d) => d.leader === leaderB)!;
  const out: GameState[] = [];
  for (let seed = 1; seed <= 40; seed++) {
    const [a, b] = seed % 2 ? [rocks, kaido] : [kaido, rocks];
    let s = createGame({ seed, cards: cards(), decks: { p1: a, p2: b } }).state;
    let rng = seedRng(seed * 7919);
    let lastTurn = -1;
    for (let n = 0; n < 3000; n++) {
      const legal = legalActions(s);
      if (legal.every((x) => x.type === 'concede')) break;
      const t = queries.turn(s);
      if (t.number >= 3 && t.phase === 'main' && t.number !== lastTurn && !t.battleStep) {
        out.push(s);
        lastTurn = t.number;
      }
      let action: Action;
      [action, rng] = pick(legal, rng);
      s = reduce(s, action).state;
    }
  }
  return out;
}

function run(seconds: number, a: string, b: string): Result {
  const positions = startPositions(a, b);
  let rng = seedRng(12345);
  let sims = 0;
  let actions = 0;
  const t0 = performance.now();
  const deadline = t0 + seconds * 1000;
  while (performance.now() < deadline) {
    for (let k = 0; k < 50; k++) {
      let s = positions[sims % positions.length]!;
      const endTurn = queries.turn(s).number + 2;
      for (;;) {
        if (queries.result(s) || queries.turn(s).number >= endTurn) break;
        const legal = legalActions(s);
        let a: Action;
        [a, rng] = pick(legal, rng);
        s = reduce(s, a).state;
        actions++;
      }
      sims++;
    }
  }
  return { sims, actions, ms: performance.now() - t0, positions: positions.length };
}

if (!isMainThread) {
  {
    const w = workerData as { seconds: number; a: string; b: string };
    parentPort!.postMessage(run(w.seconds, w.a, w.b));
  }
} else {
  const seconds = Number(process.env.BENCH_SECONDS ?? 4);
  const runs = Number(process.env.BENCH_RUNS ?? 3);
  const matchups = (
    process.env.BENCH_MATCHUPS ??
    'OP17-039:OP17-058,OP13-004:OP17-039,ST30-001:OP17-039,OP15-058:OP17-039,OP14-041:OP17-039'
  )
    .split(',')
    .map((m) => m.split(':') as [string, string]);
  for (const [a, b] of matchups) {
    const results: Result[] = [];
    for (let i = 0; i < runs; i++) {
      const r = await new Promise<Result>((resolve, reject) => {
        const w = new Worker(new URL(import.meta.url), {
          workerData: { seconds, a, b },
          execArgv: ['--import', 'tsx'],
        });
        w.once('message', resolve);
        w.once('error', reject);
      });
      results.push(r);
      console.log(
        `${a} vs ${b} run ${i + 1}: ${r.sims} two-turn sims in ${(r.ms / 1000).toFixed(2)} s = ${Math.round(
          (r.sims * 1000) / r.ms,
        )}/s; ${Math.round((r.actions * 1000) / r.ms)} actions/s; ${(r.actions / r.sims).toFixed(
          1,
        )} actions per sim; ${r.positions} start positions`,
      );
    }
    const rates = results.map((r) => (r.sims * 1000) / r.ms).sort((x, y) => x - y);
    console.log(
      `${a} vs ${b} median: ${Math.round(rates[Math.floor(rates.length / 2)]!)} two-turn sims/s`,
    );
  }
}

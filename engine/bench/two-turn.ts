/**
 * Two-turn simulation throughput (PLAN M4a exit criterion, ADR 0008): how many random two-turn
 * playouts per second the engine runs on the scripted Rocks (OP17-039) vs Kaido (OP17-058) decks,
 * measured inside a `worker_threads` worker, as the AI's search would run in a Web Worker.
 *
 *   npm run bench:two-turn            (defaults: 4 s per run, 3 runs)
 *   BENCH_SECONDS=10 BENCH_RUNS=5 npm run bench:two-turn
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

function startPositions(): GameState[] {
  const all = metaDecks();
  const rocks = all.find((d) => d.leader === 'OP17-039')!;
  const kaido = all.find((d) => d.leader === 'OP17-058')!;
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

function run(seconds: number): Result {
  const positions = startPositions();
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
  parentPort!.postMessage(run((workerData as { seconds: number }).seconds));
} else {
  const seconds = Number(process.env.BENCH_SECONDS ?? 4);
  const runs = Number(process.env.BENCH_RUNS ?? 3);
  const results: Result[] = [];
  for (let i = 0; i < runs; i++) {
    const r = await new Promise<Result>((resolve, reject) => {
      const w = new Worker(new URL(import.meta.url), {
        workerData: { seconds },
        execArgv: ['--import', 'tsx'],
      });
      w.once('message', resolve);
      w.once('error', reject);
    });
    results.push(r);
    console.log(
      `run ${i + 1}: ${r.sims} two-turn sims in ${(r.ms / 1000).toFixed(2)} s = ${Math.round(
        (r.sims * 1000) / r.ms,
      )}/s; ${Math.round((r.actions * 1000) / r.ms)} actions/s; ${(r.actions / r.sims).toFixed(
        1,
      )} actions per sim; ${r.positions} start positions`,
    );
  }
  const rates = results.map((r) => (r.sims * 1000) / r.ms).sort((a, b) => a - b);
  console.log(`median: ${Math.round(rates[Math.floor(rates.length / 2)]!)} two-turn sims/s`);
}

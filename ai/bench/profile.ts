/**
 * Warlord search throughput and transposition rate (review L-03): plans real Main positions from
 * Pirate-vs-Rookie games at a fixed iteration budget and reports iterations per second, the share of
 * a plan spent in `summaryHash` if each expanded state were keyed by it, and how many expanded
 * (node, determinization) states repeat one reached by another order of moves.
 *
 * `npx tsx ai/bench/profile.ts [positions] [iterations]`; add `node --cpu-prof` for a profile.
 */
import '../../test-setup/scripts.ts'; // every effect script (they load per set; M6b-0)
import { projectForSearch, summaryHash } from '@optcg/engine';
import { AiSession } from '../src/index.ts';
import { Mcts, type TreeNode } from '../src/search/mcts.ts';
import { simContext, type PirateSetup } from '../src/search/pirate.ts';
import { determinizations } from '../src/search/sample.ts';
import { cardMap, metaDecks } from '../test/support.ts';
import { playMatch } from '../test/support/match.ts';

const N = Number(process.argv[2] ?? 12);
const ITS = Number(process.argv[3] ?? 3000);
const all = metaDecks();
const rocks = all.find((d) => d.leader === 'OP17-039')!;
const kaido = all.find((d) => d.leader === 'OP17-058')!;
const positions: ReturnType<typeof projectForSearch>[] = [];
const boards: Parameters<typeof projectForSearch>[0][] = [];
playMatch({
  seed: 31,
  decks: { p1: kaido, p2: rocks },
  tiers: { p1: 'pirate', p2: 'rookie' },
  onDecision: (d) => {
    if (
      d.player === 'p1' &&
      d.view.decision?.kind === 'main' &&
      d.view.turn.number >= 3 &&
      boards.length < N
    ) {
      boards.push(d.before);
      positions.push(projectForSearch(d.before, 'p1'));
    }
  },
});
let its = 0;
let ms = 0;
let nodes = 0;
let states = 0;
let dup = 0;
let hashMs = 0;
for (const [i, view] of positions.entries()) {
  const s = new AiSession({
    tier: 'warlord',
    ownDeck: kaido.main,
    cards: cardMap(),
    leader: kaido.leader,
    opponentLeader: rocks.leader,
    budgets: 'iterations',
  });
  const setup = (s as unknown as { setup: PirateSetup }).setup;
  const dets = determinizations(view, setup, 8, i + 1);
  const m = new Mcts({ me: 'p1', ctx: simContext(view, setup), setup, dets, horizon: 2 });
  const t0 = performance.now();
  m.search({ iterations: ITS });
  ms += performance.now() - t0;
  its += m.iterations;
  const seen = new Set<string>();
  const walk = (nd: TreeNode) => {
    nodes++;
    nd.states.forEach((st, d) => {
      if (!st) return;
      states++;
      const h0 = performance.now();
      const key = `${d}|${summaryHash(st)}`;
      hashMs += performance.now() - h0;
      if (seen.has(key)) dup++;
      else seen.add(key);
    });
    nd.kids.forEach(walk);
  };
  walk(m.root);
}
console.log(
  JSON.stringify({
    positions: positions.length,
    iterationsPerSecond: Math.round(its / (ms / 1000)),
    nodes,
    states,
    transposed: dup,
    transposedShare: +(dup / states).toFixed(3),
    summaryHashUsPerState: +((hashMs * 1000) / states).toFixed(1),
    searchUsPerIteration: +((ms * 1000) / its).toFixed(1),
  }),
);

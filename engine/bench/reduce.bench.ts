/**
 * Engine throughput (PLAN §5, ADR 0008). Target: median `reduce` under 20 µs for non-effect actions.
 * Run with `npm run bench`. Inputs are (state, action) pairs from seeded random meta-deck games.
 */
import { bench, describe } from 'vitest';
import { legalActions, project, reduce, type Action, type GameState } from '../src/index.ts';
import { playRandomGame } from '../test/support/random-game.ts';

const pairs: [GameState, Action][] = [];
for (let seed = 1; pairs.length < 20000; seed++) {
  const g = playRandomGame({ seed, keepStates: true, invariants: false });
  g.record.actions.forEach((a, i) => pairs.push([g.states[i]!, a]));
}
const byType = (t: Action['type']) => pairs.filter(([, a]) => a.type === t);
const mains = pairs.filter(([s]) => legalActions(s).some((a) => a.type === 'endTurn'));

let i = 0;
const loop = (list: [GameState, Action][]) => () => {
  const [s, a] = list[i++ % list.length]!;
  reduce(s, a);
};

describe('reduce', () => {
  bench('any action from random games', loop(pairs));
  bench('giveDon', loop(byType('giveDon')));
  bench('playCard', loop(byType('playCard')));
  bench('attack (declare through the Block Step)', loop(byType('attack')));
  bench('endCounter (Damage Step and End of Battle)', loop(byType('endCounter')));
  bench('endTurn (End, Refresh, Draw, DON!! Phases)', loop(byType('endTurn')));
});

describe('queries', () => {
  let j = 0;
  bench('legalActions in the Main Phase', () => {
    legalActions(mains[j++ % mains.length]![0]);
  });
  bench('project', () => {
    project(pairs[j++ % pairs.length]![0], 'p1');
  });
});

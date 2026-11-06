/**
 * Lethal search on positions from real games (not planted): it must never throw, a proof in `actual`
 * mode is a proof against every defence (so playing it out against three different defenders must win),
 * and a `public` proof is never contradicted by the real hand (`actual` does not refute it).
 *
 * `LETHAL_GAMES` (default 2; `LETHAL_NODES` sets the per-search cap, default 8,000) sets the number of games; the nightly run uses more.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { attackersPossible, lethal, type LethalResult } from '../src/index.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch } from './support/match.ts';
import { refuteLineOrNull } from './support/refute.ts';

vi.setConfig({ testTimeout: 600_000 });

const cards = cardMap();
const GAMES = Number(process.env.LETHAL_GAMES ?? 2);
const CAP = { nodes: Number(process.env.LETHAL_NODES ?? 8_000) };

type Policy = 'greedy' | 'thrifty' | 'never';

function defend(s: GameState, policy: Policy): Action {
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  const value = (a: Action): number => {
    if (a.type === 'counter') return queries.card(s, a.card).counter ?? 0;
    if (a.type === 'activate' && a.ability === 'counter') return 2000;
    return 0;
  };
  const blocker =
    policy === 'never' ? undefined : acts.find((a) => a.type === 'block' && a.blocker);
  if (blocker) return blocker;
  const counters = acts.filter((a) => value(a) > 0).sort((x, y) => value(y) - value(x));
  let counter: Action | undefined;
  if (policy === 'greedy') counter = counters[0];
  if (policy === 'thrifty' && counters.length > 0) {
    const b = queries.battle(s);
    if (b) {
      const need =
        (queries.card(s, b.attacker).power ?? 0) - (queries.card(s, b.target).power ?? 0) + 1000;
      if (counters.reduce((t, c) => t + value(c), 0) >= need) counter = counters[0];
    }
  }
  return (
    counter ??
    (policy !== 'never' ? acts.find((a) => a.type === 'optional' && a.accept) : undefined) ??
    acts.find((a) => a.type === 'optional' && !a.accept) ??
    acts.find((a) => a.type === 'trigger' && !a.activate) ??
    acts.find((a) => a.type === 'pick') ??
    acts.find((a) => a.type === 'block' && a.blocker === null) ??
    acts.find((a) => a.type === 'endCounter') ??
    acts.find((a) => a.type === 'done') ??
    acts[0]!
  );
}

function plays(s0: GameState, seat: PlayerId, actions: Action[], policy: Policy): boolean {
  let s = s0;
  const queue = [...actions];
  for (let i = 0; i < 500 && !queries.result(s); i++) {
    const dec = queries.decision(s);
    if (!dec) break;
    if (dec.player === seat) {
      const a = queue.shift();
      if (!a) break;
      s = reduce(s, a).state;
    } else s = reduce(s, defend(s, policy)).state;
  }
  const r = queries.result(s);
  return !!r && 'winner' in r && r.winner === seat;
}

describe('lethal on positions from real games', () => {
  it('never throws, and its proofs hold when played out', () => {
    const decks = metaDecks();
    const rocks = decks.find((d) => d.leader === 'OP17-039')!;
    const kaido = decks.find((d) => d.leader === 'OP17-058')!;
    const seen = new Set<string>();
    const stats = { total: 0, searched: 0, proven: 0, refuted: 0, unknown: 0, publicProven: 0 };
    for (let g = 0; g < GAMES; g++) {
      const lastTurn: Record<PlayerId, number> = { p1: -1, p2: -1 };
      playMatch({
        seed: 700 + g,
        decks: g % 2 === 0 ? { p1: rocks, p2: kaido } : { p1: kaido, p2: rocks },
        tiers: { p1: 'rookie', p2: 'rookie' },
        onDecision: (d) => {
          if (d.view.decision?.kind !== 'main') return;
          const turn = queries.turn(d.before).number;
          if (lastTurn[d.player] === turn) return;
          lastTurn[d.player] = turn;
          stats.total++;
          if (!attackersPossible(d.before, d.player, cards)) return;
          stats.searched++;
          const act: LethalResult = lethal(
            { mode: 'actual', state: d.before, attacker: d.player },
            cards,
            CAP,
          );
          stats[act.status]++;
          // An adaptive proof (not oblivious) is a strategy, not a fixed line: only fixed lines replay.
          if (act.status === 'proven' && act.oblivious) {
            for (const p of ['greedy', 'thrifty', 'never'] as const)
              expect(plays(d.before, d.player, act.actions!, p), `${g}:${turn} ${p}`).toBe(true);
            // ... and against every defender answer at once (the full-information claim).
            expect(
              refuteLineOrNull(d.before, act.actions!, d.player, 100_000, true),
              `actual proof beaten, ${g}:${turn}`,
            ).toBeNull();
          }
          const view = projectForSearch(d.before, d.player);
          const pub = lethal({ mode: 'public', view }, cards, CAP);
          seen.add(pub.status);
          if (pub.status === 'proven') {
            stats.publicProven++;
            // The public claim, against every answer of the real hand in this real position.
            if (pub.oblivious && pub.viewActions)
              expect(
                refuteLineOrNull(d.before, pub.viewActions, d.player, 100_000),
                `public proof beaten by the real hand, ${g}:${turn}`,
              ).toBeNull();
            expect(act.status, `public proven but the real hand refutes it, ${g}:${turn}`).not.toBe(
              'refuted',
            );
          }
        },
      });
    }
    // The property is only worth something if the search ran.
    expect(stats.searched).toBeGreaterThan(0);
    // ... and it must decide a fair share, not pass by answering "unknown" (L-10): a position the
    // attackers bound refutes counts as decided, a searched one only if proven or refuted.
    const decided = stats.total - stats.searched + stats.proven + stats.refuted;
    expect(decided / stats.total, `decided ${decided} of ${stats.total}`).toBeGreaterThanOrEqual(
      Number(process.env.LETHAL_MIN_DECIDED ?? 0.5),
    );
    if (process.env.LETHAL_LOG) process.stdout.write(`lethal games: ${JSON.stringify(stats)}\n`);
  });
});

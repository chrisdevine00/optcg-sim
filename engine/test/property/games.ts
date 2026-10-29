/**
 * The random-game property (PLAN §5): random legal games with real meta decks (effects inert until
 * M4), invariants after every action, replay hash equals live hash, every listed action reduces, and
 * sampled unlisted actions throw. The game count comes from ENGINE_GAMES (nightly: 10,000).
 */
import fc from 'fast-check';
import { expect } from 'vitest';
import {
  IllegalAction,
  legalActions,
  reduce,
  replay,
  summaryHash,
  whyNot,
  type Action,
  type GameState,
  type InstanceId,
  type PlayerId,
} from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { metaDecks } from '../support/decks.ts';
import { playRandomGame } from '../support/random-game.ts';
import { propertySeed } from '../support/seed.ts';

/** Total games across the PARTS files; 500 per push, ENGINE_GAMES overrides (nightly 10,000). */
export const TOTAL_GAMES = Number(process.env.ENGINE_GAMES ?? 500);
export const PARTS = 4;

export interface Tally {
  games: number;
  actions: number;
  capped: number;
  results: Record<string, number>;
  listedReduced: number;
  unlistedThrew: number;
}

export const newTally = (): Tally => ({
  games: 0,
  actions: 0,
  capped: 0,
  results: {},
  listedReduced: 0,
  unlistedThrew: 0,
});

const key = (a: Action): string => {
  const { intentId: _i, ...rest } = a;
  return JSON.stringify(rest, Object.keys(rest).sort());
};

/** Plausible actions built from the state's own ids; most are illegal. */
function candidates(s: GameState, rnd: () => number): Action[] {
  const st = internals(s);
  const ids = Object.keys(st.cards);
  const pick = (): InstanceId => ids[Math.floor(rnd() * ids.length)]!;
  const pl = (): PlayerId => (rnd() < 0.5 ? 'p1' : 'p2');
  const out: Action[] = [];
  for (let i = 0; i < 2; i++) {
    const player = pl();
    out.push(
      { type: 'playCard', card: pick(), player },
      { type: 'giveDon', target: pick(), player },
      { type: 'attack', attacker: pick(), target: pick(), player },
      { type: 'block', blocker: pick(), player },
      { type: 'counter', card: pick(), target: pick(), player },
      { type: 'pick', choice: pick(), player },
    );
  }
  for (const player of ['p1', 'p2'] as const) {
    out.push(
      { type: 'endTurn', player },
      { type: 'endCounter', player },
      { type: 'block', blocker: null, player },
      { type: 'mulligan', redraw: true, player },
      { type: 'chooseFirst', goFirst: true, player },
      { type: 'trigger', activate: false, player },
      { type: 'optional', accept: true, player },
      { type: 'done', player },
      { type: 'order', first: 'x', player },
      { type: 'activate', card: pick(), ability: 'none', player },
    );
  }
  return out;
}

export function runGames(part: number, tally: Tally): void {
  const runs = Math.ceil(TOTAL_GAMES / PARTS);
  const decks = metaDecks().length;
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 0x7fffffff }),
      fc.integer({ min: 0, max: decks - 1 }),
      fc.integer({ min: 0, max: decks - 1 }),
      (seed, a, b) => {
        let n = 0;
        let x = seed;
        const rnd = (): number => {
          x = (Math.imul(x ^ (x >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
          return x / 4294967296;
        };
        const game = playRandomGame({
          seed,
          decks: [a, b],
          // One game in five plays passively, so deck-out is exercised too.
          policy: seed % 5 === 0 ? 'passive' : 'random',
          onStep: (before, _action, _after, legal) => {
            n++;
            const listed = new Set(legal.map(key));
            // Every listed action reduces (all of them on every 8th state, else 1 sampled).
            const sample = n % 8 === 0 ? legal : [legal[Math.floor(rnd() * legal.length)]!];
            for (const act of sample) {
              reduce(before, act);
              tally.listedReduced++;
            }
            // Sampled unlisted actions throw, and whyNot agrees with the list (every 4th state).
            if (n % 4 !== 1) return;
            for (const act of candidates(before, rnd)) {
              const { player, intentId: _i, ...intent } = act;
              const reason = whyNot(before, player, intent);
              if (listed.has(key(act))) {
                if (reason !== null)
                  throw new Error(`whyNot rejects a listed action: ${reason.text}`);
                continue;
              }
              // Concession by the non-decider is legal but not listed (CR 1-2-3).
              if (act.type === 'concede') continue;
              if (reason === null)
                throw new Error(`whyNot accepts an unlisted action ${JSON.stringify(act)}`);
              let threw = false;
              try {
                reduce(before, act);
              } catch (e) {
                threw = e instanceof IllegalAction;
              }
              if (!threw)
                throw new Error(`reduce accepted an unlisted action ${JSON.stringify(act)}`);
              tally.unlistedThrew++;
            }
          },
        });
        // Replay reproduces the live hash.
        const replayed = replay(game.record, cards());
        expect(summaryHash(replayed.state)).toBe(summaryHash(game.final));
        expect(legalActions(game.final).filter((x) => x.type !== 'concede')).toEqual([]);
        tally.games++;
        tally.actions += game.record.actions.length;
        if (game.capped) tally.capped++;
        const r = internals(game.final).result;
        const k = !r ? 'capped' : 'winner' in r ? r.reason : r.draw;
        tally.results[k] = (tally.results[k] ?? 0) + 1;
      },
    ),
    { numRuns: runs, seed: propertySeed(part), endOnFailure: true },
  );
}

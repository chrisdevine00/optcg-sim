/**
 * The search skeleton is as blind as the view, over *reachable* pairs (review M5a-02).
 *
 * The leak property in leaks.test.ts permutes the `card` field of hidden instances after the
 * state was built, so anything the engine had already derived from those cards (a damage prompt
 * naming the Life card, the labels of an order decision, how many hidden cards qualify for a
 * choice) stays equal and cannot be caught. Here two games start from scenarios that differ only
 * in cards hidden from the viewer, play the same random legal actions, and wherever the viewer's
 * views are equal, the viewer's search views must be equal too.
 *
 * Modes: "all" reshuffles the opponent's hand, Life and deck and the viewer's own deck and Life;
 * "life" reverses only the opponent's Life, so play stays in lockstep for longer.
 */
import { describe, expect, it } from 'vitest';
import {
  createFromScenario,
  legalActions,
  nextInt,
  project,
  projectForSearch,
  reduce,
  seedRng,
  shuffle,
  type Action,
  type CardPlacement,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '../../src/index.ts';
import { internals, withAbilities } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { metaDecks } from '../support/decks.ts';
import { pickAction } from '../support/random-game.ts';

const PLAYERS: PlayerId[] = ['p1', 'p2'];
const SEEDS = Math.max(24, Math.ceil(Number(process.env.ENGINE_GAMES ?? 500) / 12));

/** The first differing paths between two JSON values. */
function diffPaths(a: unknown, b: unknown, path = '', out: string[] = []): string[] {
  if (out.length > 4 || JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ra = a as Record<string, unknown>;
    const rb = b as Record<string, unknown>;
    for (const k of new Set([...Object.keys(ra), ...Object.keys(rb)]))
      diffPaths(ra[k], rb[k], `${path}.${k}`, out);
    return out;
  }
  out.push(`${path}: ${JSON.stringify(a)?.slice(0, 100)} vs ${JSON.stringify(b)?.slice(0, 100)}`);
  return out;
}

type Side = { leader: string; hand: string[]; life: CardPlacement[]; deck: string[] };

/** Two scenarios that differ only in cards hidden from `viewer`. */
function pair(seed: number, viewer: PlayerId, mode: 'all' | 'life') {
  let rng = seedRng(seed);
  const all = metaDecks();
  const scripted = all
    .map((d, i) => (d.leader === 'OP17-039' || d.leader === 'OP17-058' ? i : -1))
    .filter((i) => i >= 0);
  const a = scripted[seed % scripted.length]!;
  let b: number;
  [b, rng] = nextInt(rng, all.length);
  if (seed % 2) b = scripted[(seed >> 1) % scripted.length]!;
  const side = (i: number): Side => {
    let main: string[];
    [main, rng] = shuffle(all[i]!.main, rng);
    return {
      leader: all[i]!.leader,
      hand: main.slice(0, 5),
      life: main.slice(5, 9).map((card) => ({ card, faceUp: false })),
      deck: main.slice(9),
    };
  };
  const sides: Record<PlayerId, Side> = { p1: side(a), p2: side(b) };
  const opp: PlayerId = viewer === 'p1' ? 'p2' : 'p1';
  const o = sides[opp];
  let pool =
    mode === 'life'
      ? o.life.map((l) => l.card).reverse()
      : [...o.hand, ...o.life.map((l) => l.card), ...o.deck];
  if (mode === 'all') [pool, rng] = shuffle(pool, rng);
  const altOpp: Side =
    mode === 'life'
      ? { ...o, life: pool.map((card) => ({ card, faceUp: false })) }
      : {
          ...o,
          hand: pool.slice(0, 5),
          life: pool.slice(5, 9).map((card) => ({ card, faceUp: false })),
          deck: pool.slice(9),
        };
  const v = sides[viewer];
  let vpool = [...v.life.map((l) => l.card), ...v.deck];
  if (mode === 'all') [vpool, rng] = shuffle(vpool, rng);
  const altV: Side = {
    ...v,
    life: vpool.slice(0, 4).map((card) => ({ card, faceUp: false })),
    deck: vpool.slice(4),
  };
  const base = {
    seed,
    turn: 1,
    activePlayer: 'p1' as const,
    firstPlayer: 'p1' as const,
    phase: 'refresh' as const,
  };
  const ids = [...new Set([...all[a]!.main, ...all[b]!.main])].sort();
  const make = (p1: Side, p2: Side): GameState => {
    let st = createFromScenario({ ...base, p1, p2, cards: cards() } as ScenarioSpec).state;
    // Scripted [Trigger]s on a third of the card ids, so damage decisions carry real choices.
    ids.forEach((id, k) => {
      if (k % 3 === 0)
        st = withAbilities(st, id, [
          { id: 't', kind: 'trigger', effect: [{ op: 'emit', label: 'trig' }] },
        ]);
    });
    return st;
  };
  const alt = { ...sides, [opp]: altOpp, [viewer]: altV } as Record<PlayerId, Side>;
  return { A: make(sides.p1, sides.p2), B: make(alt.p1, alt.p2), rng };
}

describe('search skeletons over reachable pairs (review M5a-02)', () => {
  for (const mode of ['all', 'life'] as const) {
    it(`equal views give equal search views (${mode} mode)`, () => {
      const leaks: string[] = [];
      let compared = 0;
      let foreign = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        for (const viewer of PLAYERS) {
          let { A, B, rng } = pair(seed, viewer, mode);
          for (let step = 0; step < 400; step++) {
            if (JSON.stringify(project(A, viewer)) !== JSON.stringify(project(B, viewer))) break;
            compared++;
            if (internals(A).decision && internals(A).decision!.player !== viewer) foreign++;
            const d = diffPaths(projectForSearch(A, viewer), projectForSearch(B, viewer));
            if (d.length && leaks.length < 5)
              leaks.push(`seed ${seed} viewer ${viewer} step ${step}: ${d.join(' | ')}`);
            const legal = legalActions(A).filter((x) => x.type !== 'concede');
            if (!legal.length) break;
            let act: Action;
            [act, rng] = pickAction(legal, rng);
            try {
              A = reduce(A, act).state;
              B = reduce(B, act).state;
            } catch {
              break;
            }
          }
        }
      }
      expect(compared).toBeGreaterThan(200);
      expect(foreign).toBeGreaterThan(20);
      expect(leaks).toEqual([]);
    }, 600_000);
  }
});

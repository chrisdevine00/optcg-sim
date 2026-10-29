/**
 * Seeded random legal play for property tests. Effects are inert until M4, so these games exercise
 * the base rules only. The policy is random over `legalActions` with two weights that keep games
 * finite and realistic: concession is never chosen, and ending the turn is less likely while other
 * moves exist.
 */
import {
  checkInvariants,
  createGame,
  legalActions,
  nextInt,
  reduce,
  seedRng,
  type Action,
  type GameEvent,
  type GameRecord,
  type GameState,
  type PlayerId,
  ENGINE_VERSION,
  cardsVersionOf,
  SCRIPTS_VERSION,
} from '../../src/index.ts';
import { cards } from '../fixtures/index.ts';
import { metaDecks } from './decks.ts';

export const ACTION_CAP = 2000;

export interface RandomGame {
  record: GameRecord;
  states: GameState[];
  final: GameState;
  capped: boolean;
}

export interface RandomGameOptions {
  seed: number;
  /** Indexes into metaDecks(); default chosen from the seed. */
  decks?: [number, number];
  /** Check invariants after every action (default true). */
  invariants?: boolean;
  policy?: Policy;
  /** Keep every intermediate state (default false). */
  keepStates?: boolean;
  onStep?: (before: GameState, action: Action, after: GameState, legal: Action[]) => void;
}

/** `passive` rarely attacks and always ends the turn quickly, so games reach deck-out. */
export type Policy = 'random' | 'passive';

export function pickAction(
  legal: Action[],
  rng: number,
  policy: Policy = 'random',
): [Action, number] {
  const options = legal.filter((a) => a.type !== 'concede');
  const weights = options.map((a): number =>
    policy === 'passive'
      ? a.type === 'endTurn'
        ? 20
        : a.type === 'attack'
          ? 0
          : 4
      : a.type === 'endTurn'
        ? 1
        : a.type === 'giveDon'
          ? 2
          : 4,
  );
  const total = weights.reduce((x, y) => x + y, 0);
  if (total === 0) return [options[0]!, rng];
  let v: number;
  [v, rng] = nextInt(rng, total);
  for (let i = 0; i < options.length; i++) {
    v -= weights[i]!;
    if (v < 0) return [options[i]!, rng];
  }
  return [options.at(-1)!, rng];
}

export function playRandomGame(opts: RandomGameOptions): RandomGame {
  const all = metaDecks();
  let rng = seedRng(opts.seed ^ 0x2545f491);
  let a: number;
  let b: number;
  if (opts.decks) [a, b] = opts.decks;
  else {
    [a, rng] = nextInt(rng, all.length);
    [b, rng] = nextInt(rng, all.length);
  }
  const decks: Record<PlayerId, { leader: string; main: string[] }> = {
    p1: { leader: all[a]!.leader, main: all[a]!.main },
    p2: { leader: all[b]!.leader, main: all[b]!.main },
  };
  const setup = { seed: opts.seed, decks };
  const state = createGame({ ...setup, cards: cards() }).state;
  const record: GameRecord = {
    versions: { engine: ENGINE_VERSION, cards: cardsVersionOf(state), scripts: SCRIPTS_VERSION },
    start: { setup },
    actions: [],
  };
  return playFrom(state, record, rng, opts);
}

/** Random legal play from any state; `record.actions` collects the actions. */
export function playFrom(
  start: GameState,
  record: GameRecord,
  rng0: number,
  opts: Omit<RandomGameOptions, 'decks'> & {
    onEvents?: (events: GameEvent[], after: GameState) => void;
  },
): RandomGame {
  let rng = rng0;
  let state = start;
  const states: GameState[] = [state];
  let capped = false;
  for (;;) {
    if (opts.invariants !== false) {
      const errors = checkInvariants(state);
      if (errors.length)
        throw new Error(
          `seed ${opts.seed} after ${record.actions.length} actions:\n${errors.join('\n')}`,
        );
    }
    const legal = legalActions(state);
    if (legal.every((x) => x.type === 'concede')) break;
    if (record.actions.length >= ACTION_CAP) {
      capped = true;
      break;
    }
    let action: Action;
    [action, rng] = pickAction(legal, rng, opts.policy);
    const step = reduce(state, action);
    // A runtime fall-through is a bug (M4a-07): fail the game.
    const anomaly = step.events.find((e) => e.type === 'Anomaly');
    if (anomaly)
      throw new Error(
        `seed ${opts.seed}: Anomaly ${JSON.stringify(anomaly)} after ${JSON.stringify(action)}`,
      );
    const next = step.state;
    opts.onEvents?.(step.events, next);
    opts.onStep?.(state, action, next, legal);
    record.actions.push(action);
    state = next;
    if (opts.keepStates) states.push(state);
  }
  return { record, states, final: state, capped };
}

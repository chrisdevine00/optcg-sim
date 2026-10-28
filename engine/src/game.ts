/**
 * Engine entry points (ARCHITECTURE §2.1). Frozen signatures; bodies land during M2.
 * Until then every function throws, so nothing can depend on behaviour that does not exist yet.
 */
import type {
  Action,
  CardLookup,
  GameRecord,
  GameSetup,
  GameState,
  Intent,
  PlayerId,
  PlayerView,
  Preview,
  Queries,
  Reason,
  ScenarioSpec,
  Step,
} from './api.ts';

const notYet = (name: string): never => {
  throw new Error(`engine.${name} is not implemented yet (M2)`);
};

export const createGame = (_setup: GameSetup): Step => notYet('createGame');
export const createFromScenario = (_spec: ScenarioSpec): Step => notYet('createFromScenario');
export const reduce = (_state: GameState, _action: Action): Step => notYet('reduce');
export const legalActions = (_state: GameState): Action[] => notYet('legalActions');
export const project = (_state: GameState, _player: PlayerId): PlayerView => notYet('project');
export const whyNot = (_state: GameState, _player: PlayerId, _intent: Intent): Reason | null =>
  notYet('whyNot');
export const preview = (_state: GameState, _action: Action): Preview => notYet('preview');
export const replay = (_record: GameRecord, _cards: CardLookup, _upTo?: number): Step =>
  notYet('replay');
export const checkInvariants = (_state: GameState): string[] => notYet('checkInvariants');
export const summaryHash = (_state: GameState): string => notYet('summaryHash');

export const queries: Queries = {
  decision: () => notYet('queries.decision'),
  result: () => notYet('queries.result'),
  turn: () => notYet('queries.turn'),
  zone: () => notYet('queries.zone'),
  card: () => notYet('queries.card'),
  don: () => notYet('queries.don'),
};

/**
 * Public engine API, frozen at the start of M2 (PLAN §5, ADR 0003, ADR 0013).
 * Tests, the AI and the app depend only on what this file exports. Changing a shape here is an
 * ADR-level decision: record it in docs/DECISIONS.md and update the independent tests.
 * See docs/ARCHITECTURE.md §2 for the model behind these types.
 */
import type { Card } from '@optcg/cards';

export type PlayerId = 'p1' | 'p2';
/** Engine instance id of one physical card (ARCHITECTURE §2.2). Opaque; never parse it. */
export type InstanceId = string;
/** Printed card number, e.g. `OP17-039`. */
export type CardId = string;

export type ZoneName =
  'deck' | 'hand' | 'life' | 'leader' | 'characters' | 'stage' | 'trash' | 'donDeck' | 'costArea';

export type Phase = 'setup' | 'refresh' | 'draw' | 'don' | 'main' | 'end';
export type BattleStep = 'attack' | 'block' | 'counter' | 'damage' | 'end';

/** Card data is injected, so the engine never loads JSON or touches the network. */
export type CardLookup = (id: CardId) => Card | undefined;

// ---------------------------------------------------------------------------------------------
// Starting a game
// ---------------------------------------------------------------------------------------------

export interface DeckSpec {
  leader: CardId;
  /** 50 card ids (repeats allowed up to the copy limit); validated by the engine at start. */
  main: CardId[];
}

export interface GameSetup {
  seed: number;
  cards: CardLookup;
  decks: Record<PlayerId, DeckSpec>;
  /** Who won rock-paper-scissors and so chooses first or second (CR 5-2-1-4). Random if omitted. */
  chooser?: PlayerId;
}

/** One card placed by a scenario. A bare card id means: active, no DON!! given, not played this turn. */
export interface CardPlacement {
  card: CardId;
  rested?: boolean;
  /** Number of DON!! given to this card (Leader or Character only). */
  don?: number;
  /** Characters only: true means it was played this turn (summoning sickness, CR 3-7-4). */
  playedThisTurn?: boolean;
  /** Life only: placed face up (CR 3-10-2-1). */
  faceUp?: boolean;
}

export interface PlayerSpec {
  leader: CardId | CardPlacement;
  hand?: CardId[];
  /** Top of deck first. Omitted: the rest of `decklist` (or nothing) shuffled with the seed. */
  deck?: CardId[];
  /** Top of Life first. Omitted: no Life cards. */
  life?: (CardId | CardPlacement)[];
  characters?: (CardId | CardPlacement)[];
  stage?: CardId | CardPlacement;
  /** Top of trash first. */
  trash?: CardId[];
  /** DON!! cards in the cost area. */
  costArea?: { active: number; rested: number };
  /** DON!! cards still in the DON!! deck. Default: 10 minus every DON!! placed elsewhere. */
  donDeck?: number;
  /** Optional 50-card list used to fill an omitted `deck` (sampled with the seed). */
  decklist?: CardId[];
}

/** A described board position (ADR 0013). Validated by `checkInvariants`; invalid specs throw. */
export interface ScenarioSpec {
  seed: number;
  cards: CardLookup;
  turn: number;
  activePlayer: PlayerId;
  firstPlayer: PlayerId;
  /** Phase to start in. Default `main`, with the active player owing a `main` decision. */
  phase?: Phase;
  p1: PlayerSpec;
  p2: PlayerSpec;
}

// ---------------------------------------------------------------------------------------------
// Decisions and actions (ARCHITECTURE §2.3). Every action may carry an intentId that groups the
// engine actions of one player-level move; the engine copies it onto the events it causes.
// ---------------------------------------------------------------------------------------------

/** DON!! are chosen by location class, not by instance (effect-dsl.md E-D4). */
/** `Omit` that distributes over a union (plain `Omit` collapses a union to its common keys). */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type DonClass =
  { from: 'costActive' } | { from: 'costRested' } | { from: 'given'; card: InstanceId };

export type Action = (
  | { type: 'chooseFirst'; goFirst: boolean }
  | { type: 'mulligan'; redraw: boolean }
  | { type: 'playCard'; card: InstanceId }
  | { type: 'giveDon'; target: InstanceId }
  | { type: 'activate'; card: InstanceId; ability: string }
  | { type: 'attack'; attacker: InstanceId; target: InstanceId }
  | { type: 'endTurn' }
  | { type: 'block'; blocker: InstanceId | null }
  | { type: 'counter'; card: InstanceId; target: InstanceId }
  | { type: 'endCounter' }
  | { type: 'trigger'; activate: boolean }
  | { type: 'optional'; accept: boolean }
  | { type: 'pick'; choice: InstanceId | DonClass }
  | { type: 'done' }
  | { type: 'order'; first: string }
  | { type: 'concede' }
) & { player: PlayerId; intentId?: string };

export type DecisionKind =
  | 'chooseFirst'
  | 'mulligan'
  | 'main'
  | 'block'
  | 'counter'
  | 'trigger'
  | 'optional'
  | 'choose'
  | 'order';

export interface Decision {
  kind: DecisionKind;
  player: PlayerId;
  /** Human-readable prompt, e.g. "Choose up to 1 of your opponent's Characters with 4000 power or less". */
  prompt: string;
  /** For `choose`: how many picks are still allowed and required. */
  min?: number;
  max?: number;
}

export type GameResult = { winner: PlayerId; reason: string } | { draw: 'bothLost' | 'loop' };

// ---------------------------------------------------------------------------------------------
// Observing a game. Tests read the game through these queries, never through GameState fields.
// ---------------------------------------------------------------------------------------------

export interface CardView {
  instance: InstanceId;
  card: CardId;
  owner: PlayerId;
  zone: ZoneName;
  rested: boolean;
  faceUp: boolean;
  /** DON!! given to this card. */
  don: number;
  /** Current values from `derive` (ARCHITECTURE §2.5). Null where the category has none. */
  power: number | null;
  cost: number | null;
  keywords: string[];
}

/** Opaque game state (ARCHITECTURE §2.2). Plain JSON; never mutate it. */
export interface GameState {
  readonly __brand: 'GameState';
}

/** Every event type the engine emits (ARCHITECTURE §2.8). */
export type GameEventType =
  | 'GameStarted'
  | 'ScenarioStarted'
  | 'FirstPlayerChosen'
  | 'Mulligan'
  | 'Shuffled'
  | 'LifePlaced'
  | 'TurnStarted'
  | 'TurnEnded'
  | 'PhaseChanged'
  | 'Refreshed'
  | 'MainPhaseEnded'
  | 'DonPlaced'
  | 'DonGiven'
  | 'DonRested'
  | 'DonReturned'
  | 'CardMoved'
  | 'CardRevealed'
  | 'CardPlayed'
  | 'EventActivated'
  | 'Rested'
  | 'SetActive'
  | 'PowerModified'
  | 'ModifierAdded'
  | 'ModifierExpired'
  | 'AttackDeclared'
  | 'BlockerActivated'
  | 'NoBlock'
  | 'CounterPlayed'
  | 'DamageStep'
  | 'DamageDealt'
  | 'TriggerRevealed'
  | 'KO'
  | 'KOPrevented'
  | 'ReplacementApplied'
  | 'ReplacementDeclined'
  | 'EffectActivated'
  | 'EffectResolved'
  | 'BattleEnded'
  | 'Conceded'
  | 'LoopDetected'
  | 'GameEnded'
  | 'Anomaly';

export interface GameEvent {
  type: GameEventType;
  intentId?: string;
  [key: string]: unknown;
}

/** One card as a player sees it. A hidden card has `card: null` and a positional handle. */
export interface ViewCard {
  handle: string;
  card: CardId | null;
  rested: boolean;
  faceUp: boolean;
  don: number;
  power: number | null;
  cost: number | null;
  keywords: string[];
}

/** What one player may see (ARCHITECTURE §2.7). Hidden cards carry no card id. */
export interface PlayerView {
  readonly player: PlayerId;
  readonly decision: Decision | null;
  /** The legal actions for `player`, empty unless `player` owes the current decision. */
  readonly actions: Action[];
  readonly turn: {
    number: number;
    activePlayer: PlayerId;
    phase: Phase;
    battleStep: BattleStep | null;
  };
  readonly result: GameResult | null;
  /** Every zone of both players. Hidden cards have card: null and a handle re-keyed per ARCH §2.7. Zone lengths are always public (CR 3-1-4). */
  readonly zones: Record<PlayerId, Record<ZoneName, ViewCard[]>>;
  readonly don: Record<PlayerId, { deck: number; active: number; rested: number; given: number }>;
  readonly __brand: 'PlayerView';
}

/** Something the player tried or hovered, for `whyNot`: an action that may not be legal. */
export type Intent = DistributiveOmit<Action, 'player' | 'intentId'>;

export interface Reason {
  /** Plain-language explanation, e.g. "Active Characters can't be attacked." */
  text: string;
  /** Rule or ruling it rests on, e.g. "CR 7-1-1-2". */
  rule?: string;
}

/** What would happen if `action` were applied now: used by the battle panel and blunder warning. */
export interface Preview {
  /** Changed values, keyed by instance: power, cost, zone. */
  cards: Record<InstanceId, { power?: number | null; zone?: ZoneName }>;
  life: Record<PlayerId, number>;
  /** Cards that would be K.O.'d. */
  ko: InstanceId[];
  /** True when the action ends the game. */
  gameOver: boolean;
}

/** A whole game (ADR 0004). Replaying `actions` from `start` reproduces the same summaryHash. */
export interface GameRecord {
  versions: { engine: string; cards: string; scripts: string };
  start: { setup: Omit<GameSetup, 'cards'> } | { scenario: Omit<ScenarioSpec, 'cards'> };
  actions: Action[];
}

export interface Step {
  state: GameState;
  events: GameEvent[];
}

export interface Queries {
  decision(state: GameState): Decision | null;
  result(state: GameState): GameResult | null;
  turn(state: GameState): {
    number: number;
    activePlayer: PlayerId;
    phase: Phase;
    battleStep: BattleStep | null;
  };
  /** Cards in a zone, top first for ordered zones. */
  zone(state: GameState, player: PlayerId, zone: ZoneName): CardView[];
  card(state: GameState, instance: InstanceId): CardView;
  don(
    state: GameState,
    player: PlayerId,
  ): { deck: number; active: number; rested: number; given: number };
}

export class IllegalAction extends Error {
  constructor(
    message: string,
    readonly action: Action,
  ) {
    super(message);
    this.name = 'IllegalAction';
  }
}

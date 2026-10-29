/**
 * Internal game state (ARCHITECTURE §2.2). Plain JSON only: no classes, closures or Maps, so a
 * state can be hashed, cloned, stored and sent to a worker. Nothing outside `engine/src` reads these
 * fields; the public API sees an opaque `GameState`.
 */
import type {
  BattleStep,
  CardId,
  DecisionKind,
  DonClass,
  GameResult,
  InstanceId,
  Phase,
  PlayerId,
  ZoneName,
} from './api.ts';
import type { RngState } from './rng.ts';
import type { Ability } from './abilities.ts';

/** Where a card instance is. `resolving` is the no-area slot of a [Trigger] card (CR 10-1-5-3). */
export type Zone = ZoneName | 'resolving';

/** The game fields of one card number, copied from the injected `CardLookup` at game start. */
export interface Def {
  id: CardId;
  name: string;
  category: 'Leader' | 'Character' | 'Event' | 'Stage';
  colors: string[];
  cost: number | null;
  power: number | null;
  counter: number | null;
  life: number | null;
  types: string[];
  attributes: string[];
  keywords: string[];
  hasTrigger: boolean;
  /**
   * Abilities the engine can run. Until M4 this is empty for every real card; tests inject
   * abilities through `engine/src/testing.ts` to exercise the hooks (ADR 0013).
   */
  abilities: Ability[];
}

/** One physical card. DON!! cards are not instances: they are counted by location class (E-D4). */
export interface CardInst {
  card: CardId;
  owner: PlayerId;
  zone: Zone;
  rested: boolean;
  faceUp: boolean;
  /** DON!! given to this card. */
  don: number;
  /** Turn number on which it was played into the Character or Stage area; -1 otherwise. */
  played: number;
  /**
   * Projection key (ARCHITECTURE §2.7). Re-rolled from the id stream whenever the card enters a
   * hidden zone and whenever its deck is shuffled; view handles are derived from it, so a handle
   * never links a card across a secret area while the instance id itself stays stable.
   */
  key: string;
}

export interface PlayerState {
  /** Top first. */
  deck: InstanceId[];
  hand: InstanceId[];
  /** Top first. */
  life: InstanceId[];
  leader: InstanceId;
  characters: InstanceId[];
  /** Zero or one Stage. */
  stage: InstanceId[];
  /** Top first. */
  trash: InstanceId[];
  donDeck: number;
  donActive: number;
  donRested: number;
}

/**
 * When a modifier ends (ARCHITECTURE §2.2, effect-dsl E-D2, rulings D-2). Each tier ends at its
 * exact CR sub-step:
 * - `battle`: End of the Battle, 7-1-5-3 (turn player's) / 7-1-5-4 (non-turn player's);
 * - `untilEndOfTurn`: End Phase 6-6-1-2 of turn `turn` ("until the end of the turn / End Phase",
 *   and "until the end of your next turn" with a later turn number);
 * - `thisTurn`: End Phase 6-6-1-3 of turn `turn` ("during this turn");
 * - `untilStartOfNextTurn`: Refresh 6-2-1 of `player`'s next turn;
 * - `untilEndOfOpponentsNextEndPhase`: 6-6-1-2 (2) of the first turn after `after` in which
 *   `player`'s opponent is the turn player ("until the end of your opponent's next End Phase/turn");
 * - `whileSource`: while instance `source` stays where it is.
 */
export type Duration =
  | { kind: 'battle' }
  | { kind: 'untilEndOfTurn'; turn: number }
  | { kind: 'thisTurn'; turn: number }
  | { kind: 'untilStartOfNextTurn'; player: PlayerId }
  | { kind: 'untilEndOfOpponentsNextEndPhase'; player: PlayerId; after: number }
  | { kind: 'whileSource'; source: InstanceId };

export type ModKind = 'power' | 'cost' | 'basePower' | 'grant' | 'cannotBeKOd';

export interface Modifier {
  id: number;
  kind: ModKind;
  target: InstanceId;
  /** Power or cost delta; base value for `basePower`. */
  amount: number;
  /** For `grant`: the keyword. */
  keyword?: string;
  duration: Duration;
  /** Whose effect created it: decides turn-player-first expiry order. */
  controller: PlayerId;
  /** Card that created it, if any. */
  source: InstanceId | null;
}

/** Why a card left the field (ARCHITECTURE §2.4, E-D3). */
export interface Cause {
  kind: 'battle' | 'effect' | 'rule' | 'cost';
  /** The player whose battle, effect or cost it was. */
  by: PlayerId;
}

/** A replacement offered for one event: identified by card instance and ability id. */
export interface ReplacementRef {
  card: InstanceId;
  ability: string;
  controller: PlayerId;
}

/** Interpreter frames (ARCHITECTURE §2.4). The top of `stack` runs next. */
export type Frame =
  | { f: 'setup'; step: 'chooseFirst' | 'startOfGame' | 'draw' | 'mulligan' | 'life' | 'begin' }
  | {
      f: 'turn';
      step:
        | 'refresh'
        | 'refreshDon'
        | 'draw'
        | 'don'
        | 'mainStart'
        | 'main'
        | 'endTriggers'
        | 'endExpire'
        | 'endThisTurn'
        | 'endPass';
    }
  | { f: 'play'; card: InstanceId; player: PlayerId; step: 'pay' | 'make-room' | 'place' | 'done' }
  | { f: 'battle' }
  | {
      f: 'damage';
      player: PlayerId;
      remaining: number;
      banish: boolean;
      battle: boolean;
      by: PlayerId;
      /** Life card waiting on a `trigger` decision. */
      pending: InstanceId | null;
    }
  | { f: 'ko'; card: InstanceId; cause: Cause; considered: string[] }
  | { f: 'trigger'; card: InstanceId; player: PlayerId; step: 'run' | 'finish' }
  | {
      f: 'effect';
      /** Source instance (the trash id for [On K.O.], the `resolving` id for [Trigger]). */
      card: InstanceId;
      /** Printed card id, to find the ability after the source has moved. */
      cardId: CardId;
      ability: string;
      /** Which list to run: the ability's effect, or a replacement's `instead`. */
      part: 'effect' | 'instead';
      controller: PlayerId;
      ip: number;
      /** An optional auto ability asks first; false once accepted (or for mandatory ones). */
      ask: boolean;
    }
  | { f: 'loop' };

/** The pending decision plus what `legalActions` needs to enumerate it. */
export interface DecisionState {
  kind: DecisionKind;
  player: PlayerId;
  prompt: string;
  min?: number;
  max?: number;
  /** `choose`: candidates in canonical order, and the picks made so far. */
  candidates?: (InstanceId | DonClass)[];
  picked?: (InstanceId | DonClass)[];
  /** `optional`: the replacement on offer, if this is a replacement decision. */
  replacement?: ReplacementRef;
  /** Which frame or rule the decision serves, for prompts and `whyNot`. */
  purpose?: 'characterLimit' | 'replacement' | 'ability';
}

export interface Battle {
  attacker: InstanceId;
  attackerOwner: PlayerId;
  /** Current target (a Blocker replaces it). */
  target: InstanceId;
  /** Area of the attacker and target at declaration, for the moved-area checks (CR 7-1-1-4). */
  step: BattleStep | 'attackEnd' | 'blockEnd' | 'counterEnd' | 'damageEnd' | 'endExpire';
  blocker: InstanceId | null;
  /** Did the attacker win the Damage Step (for "if this battles" checks later). */
  attackerWon: boolean | null;
}

export interface SetupFacts {
  chooser: PlayerId;
  leader: Record<PlayerId, CardId>;
  /** Main-deck cards each player owns in this game (50 in a real game). */
  deckSize: Record<PlayerId, number>;
  /** DON!! cards each player owns (10, or 6 for OP15-058 Enel: CR 5-1-2-4, RL-40). */
  donSize: Record<PlayerId, number>;
  /** Whether each player has taken the mulligan decision yet. */
  mulliganed: Record<PlayerId, boolean>;
}

export interface State {
  readonly __brand?: 'GameState';
  v: 1;
  /** Game randomness: shuffles and random choices. Part of the summary hash. */
  rng: RngState;
  /**
   * Instance-id allocation (ARCHITECTURE §2.2). A separate stream, so how ids are drawn never
   * changes shuffles or the summary hash.
   */
  idRng: RngState;
  turn: number;
  active: PlayerId;
  first: PlayerId;
  phase: Phase;
  defs: Record<CardId, Def>;
  cards: Record<InstanceId, CardInst>;
  players: Record<PlayerId, PlayerState>;
  /** Shared no-area slot (CR 10-1-5-3). */
  resolving: InstanceId[];
  battle: Battle | null;
  stack: Frame[];
  decision: DecisionState | null;
  result: GameResult | null;
  mods: Modifier[];
  nextMod: number;
  /** Once Per Turn marks, `${instance}/${abilityId}` (E-D9). Cleared when the turn passes. */
  oncePerTurn: string[];
  setup: SetupFacts;
  /** Old id → new id for cards that became new objects in the last step (CR 3-1-6, ADR 0013). */
  renames: [InstanceId, InstanceId][];
}

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');
export const PLAYERS: readonly PlayerId[] = ['p1', 'p2'];

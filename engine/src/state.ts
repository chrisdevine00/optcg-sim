/**
 * Internal game state (ARCHITECTURE §2.2). Plain JSON only: no classes, closures or Maps, so a
 * state can be hashed, cloned, stored and sent to a worker. Nothing outside `engine/src` reads these
 * fields; the public API sees an opaque `GameState`.
 */
import type {
  BattleStep,
  CardId,
  DecisionKind,
  DecisionPurpose,
  DonClass,
  GameResult,
  InstanceId,
  Phase,
  PlayerId,
  ZoneName,
} from './api.ts';
import type { RngState } from './rng.ts';
import type { Ability } from './abilities.ts';
import type { Filter } from '@optcg/cards';

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
   * What the printed text says (G49), read from the card text, not from `abilities`: whether the
   * card has a base effect (keywords alone do not count, a [Trigger] does) and the timings it
   * prints ([On Play], [When Attacking], ...). Absent on a hand-built test card, which reads as
   * having a base effect when it has abilities and none otherwise.
   */
  baseEffect?: boolean;
  printed?: string[];
  /**
   * Names the card is also treated as having under the rules of this game (`rules.alsoNamed`,
   * EB04-038). Absent for almost every card.
   */
  alsoNamed?: string[];
  /**
   * Abilities the engine can run: the card's script (`cards/effects`), or none. Tests may inject
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
 * - `whileSource`: while instance `source` stays where it is;
 * - `afterRefresh`: after the Refresh Phase's untap (6-2-4) of `player`'s next turn ("will not become
 *   active in your next Refresh Phase").
 */
export type Duration =
  | { kind: 'battle' }
  | { kind: 'untilEndOfTurn'; turn: number }
  | { kind: 'thisTurn'; turn: number }
  | { kind: 'untilStartOfNextTurn'; player: PlayerId }
  | { kind: 'untilEndOfOpponentsNextEndPhase'; player: PlayerId; after: number }
  | { kind: 'whileSource'; source: InstanceId }
  | { kind: 'afterRefresh'; player: PlayerId };

export type ModKind =
  | 'power'
  | 'cost'
  | 'basePower'
  | 'grant'
  /** "gains the <Slash> attribute" (M6b wave 7 G59): `attribute` is added to the printed ones. */
  | 'grantAttribute'
  /** "cannot be played by effects" (G63): a card in a hand, from its own permanent. */
  | 'cannotPlayByEffect'
  | 'cannotBeKOd'
  /** "cannot be rested" (rules-digest 57): it cannot attack, block, pay a rest cost or be rested. */
  | 'cannotBeRested'
  /** This card cannot activate [Blocker] (the blocking side, M6b wave 1 G10). */
  | 'cannotBlock'
  /** "cannot attack" (OP17-054, OP17-065). */
  | 'cannotAttack'
  /** "negate the effect of" (CR 8-2): the card's abilities and keyword effects do nothing. */
  | 'negate'
  /** "your opponent cannot activate [Blocker]" when this card attacks (ST21-003, OP07-057). */
  | 'noBlocker'
  /** "will not become active in your next Refresh Phase" (OP13-040, EB02-021). */
  | 'skipRefresh'
  /** "cannot be removed from the field by your opponent's effects" (OP15-118). */
  | 'cannotBeRemoved'
  /** On a player's Leader: that player cannot draw cards using their own effects (OP12-099). */
  | 'cannotDraw'
  /** On a player's Leader: that player cannot add Life cards to their hand using their own effects (G60). */
  | 'cannotLifeToHand'
  /** On a player's Leader: that player cannot set DON!! active using Character effects (G21). */
  | 'cannotSetDon'
  /** On a player's Leader: that player cannot play cards matching `filter` (OP13-118). */
  | 'cannotPlay'
  /** On a player's Leader: the next play from hand matching `filter` costs `amount` more (OP12-061). */
  | 'playCost'
  /** This card can also attack active Characters (M6b wave 4 G32). */
  | 'attackActive'
  /** This card cannot attack a card matching `filter` (M6b wave 5 G47). */
  | 'cannotAttackTarget'
  /**
   * On a player's Leader: `amount` of that player's rested DON!! cards stay rested through their
   * next Refresh Phase (M6b wave 5 G48).
   */
  | 'skipRefreshDon'
  /**
   * On the controller's Leader: a replacement an effect created for a while (D6, `ab`). It is offered
   * for K.O.s and removals like a printed one, as the ability `mod-<id>`.
   */
  | 'replacement';

export interface Modifier {
  id: number;
  kind: ModKind;
  target: InstanceId;
  /** Power or cost delta; base value for `basePower`. */
  amount: number;
  /** For `grant`: the keyword. */
  keyword?: string;
  /** For `grantAttribute`: the attribute (G59). */
  attribute?: string;
  /** For `cannotPlay`, `playCost` and `cannotAttackTarget`: which cards. */
  filter?: Filter;
  /** For `replacement`: the replacement ability, whose id is `mod-<id>` (D6). */
  ab?: Ability;
  /** For `cannotPlay`: only plays of a card in the hand are barred (M6b-Q33). Absent: any play. */
  from?: 'hand';
  /**
   * For `cannotBeKOd` (`effect`, `opponentEffect`, `battle`) and `cannotBeRested`
   * (`opponentEffect`): what the restriction covers. Absent: everything (M6b wave 1 G2, G6).
   */
  scope?: 'effect' | 'opponentEffect' | 'battle';
  /**
   * For a scoped `cannotBeKOd`: only a K.O. whose source card matches this filter is stopped (G46):
   * the attacker of a battle, or the card whose effect (or cost) K.O.s.
   */
  by?: Filter;
  /** For `playCost`: plays it may still change the cost of. */
  uses?: number;
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

/**
 * What the event that triggered an auto ability tells it (M6b wave 3): the cause of a K.O. (G28,
 * `koCause`) and how many cards the event moved (G22, `eventCount`). Absent on any ability that
 * did not come from such an event.
 */
export interface Ev {
  cause?: Cause;
  n?: number;
  /** The DON!! given to the K.O.'d card when it left the field, for `[DON!! xN] [On K.O.]`. */
  don?: number;
}

/**
 * What happened this turn, kept only when a card in the game reads it (G26): Characters K.O.'d per
 * owner and the Events activated (player, base cost). `turn` says which turn it describes, so it
 * clears itself when the turn changes.
 */
export interface History {
  turn: number;
  koed: Record<PlayerId, number>;
  /** Cards trashed from each player's hand by an effect or cost this turn (G69); absent until one is. */
  handTrashed?: Record<PlayerId, number>;
  events: { by: PlayerId; baseCost: number | null }[];
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
  | {
      f: 'play';
      card: InstanceId;
      player: PlayerId;
      step: 'pay' | 'make-room' | 'place' | 'done';
      /** Played by an effect: no cost is paid (CR 2-7 applies to plays from hand by the player). */
      free?: true;
      /** An Event activated in the Counter Step for its [Counter] (CR 7-1-3-1-2). */
      counter?: true;
      /** "Play ... rested": the card is placed rested. */
      rested?: true;
      /**
       * Played by an effect (G25): `characterEffect` when the effect's source is a Character,
       * else `effect`. Absent: the normal play from hand (or a Counter-Step Event).
       */
      via?: 'effect' | 'characterEffect';
      /**
       * Cards placed by one effect's `play` share a pending batch, so their [On Play]s are one
       * event and their controller orders them (M4a-04, CR 8-6-1).
       */
      batch?: number;
    }
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
      /** Damage replacements already offered for this damage (D4); absent until one is. */
      considered?: string[];
      /** Battle damage determined against 0 Life, kept as a frame only so a replacement can stop it. */
      zero?: true;
      /** Life cards this damage has taken so far: `damageTaken` fires when it ends with any (G43). */
      taken?: number;
    }
  | {
      f: 'ko';
      card: InstanceId;
      cause: Cause;
      considered: string[];
      group?: number;
      /**
       * The card that K.O.s: the battle's attacker, or the card whose effect or cost it is (G46).
       * Kept on the frame, not in the `cause`, which events carry and which must name no instance.
       */
      src?: InstanceId;
      /** The source left the field by a self-trash cost: its last-known power and cost (G46). */
      srcLki?: { power: number | null; basePower: number | null; cost: number | null };
    }
  /**
   * A rest by an effect, held while a replacement for it may be offered (G37). `by` is the player
   * whose effect rests it and `source` that effect's card.
   */
  | { f: 'rest'; card: InstanceId; by: PlayerId; source: InstanceId; considered: string[] }
  | { f: 'trigger'; card: InstanceId; player: PlayerId; step: 'run' | 'finish' }
  | {
      f: 'effect';
      /** Source instance (the trash id for [On K.O.], the `resolving` id for [Trigger]). */
      card: InstanceId;
      /** Printed card id, to find the ability after the source has moved. */
      cardId: CardId;
      ability: string;
      /** Which program to run: the ability's costs and effect, or a replacement's `instead`. */
      part: 'effect' | 'instead';
      controller: PlayerId;
      /** Instruction pointer into the compiled program (`effects/compile.ts`). */
      ip: number;
      /** `ask`: an optional auto (or one with a cost) still asks whether to use it. */
      stage: 'ask' | 'run';
      /** A delayed body (`delayed`) runs from `ip` to its own `end` instruction. */
      delayed?: true;
      /** Bound selections (`bind`), by name. */
      b?: Record<string, InstanceId[]>;
      /** Labels of `may` steps that were accepted. */
      did?: string[];
      /** Numeric bindings (DON!! rested "this way"), by name. */
      n?: Record<string, number>;
      /** The action just run did something ("if you do" after a `do`, OP08-098). */
      acted?: true;
      /** Open `forEach` loops, innermost last: where the body starts and the runs still to do. */
      loops?: { start: number; left: number }[];
      /** The answer to the decision this frame is waiting on. */
      got?: Got;
      /** Progress inside a multi-decision instruction, and its scratch data. */
      ph?: number;
      tmp?: Scratch;
      /** Cards the controller is looking at (`lookAtTop`): visible to them only (CR 11-3-1). */
      look?: InstanceId[];
      /** What the triggering event told this ability (`koCause`, `eventCount`). */
      ev?: Ev;
      /**
       * This card trashed itself as a cost: where it is now, and what it was on the field. A K.O.
       * the effect then makes names it as its source (G46, M6b-Q68).
       */
      left?: {
        id: InstanceId;
        power: number | null;
        basePower: number | null;
        cost: number | null;
      };
    }
  | {
      f: 'remove';
      /** A card leaving the field by an effect other than K.O. (E-D3): replacements first. */
      card: InstanceId;
      dest: 'hand' | 'deck' | 'trash' | 'life';
      position?: 'top' | 'bottom';
      cause: Cause;
      considered: string[];
      /** A Character placed into its owner's Life (`dest: 'life'`, G61): its face state. */
      faceUp?: boolean;
      /** Removals made by one effect share a group: one replacement answers for all it covers. */
      group?: number;
      /**
       * Cards of one group going to a deck bottom in an order the owner chose (OP06-058): this
       * card's place in it (0 = placed first, so above the rest), and the ranks of the group
       * already placed. Cards move in a fixed order so the events leak nothing of the choice.
       */
      rank?: number;
      placed?: number[];
    }
  | { f: 'loop' };

/** One candidate of a `choose` (or `order`) decision. */
export type Choice = InstanceId | DonClass | { option: string };

/** What an effect frame's pending decision returned. */
export type Got = (InstanceId | DonClass | { option: string })[] | boolean | string;

/** Per-instruction scratch data of an effect frame (plain JSON). */
export interface Scratch {
  /** Results of earlier selections in this instruction. */
  sel?: InstanceId[];
  /** `lookAtTop`: which `take` is next, and cards ordered so far. */
  take?: number;
  order?: InstanceId[];
  top?: boolean;
  /** `giveDon`: how many DON!! the player chose to give ("up to N" allows 0). */
  give?: number;
  /** `addDon`: how many parts are done (an "up to" part asks its count first). */
  add?: number;
  /** `giveDon` of any opponent DON!!: how many of the DON!! given are active ones (G20). */
  act?: number;
  /** A cost `returnDon { atLeast }`: how many DON!! the player chose to return (G42). */
  ret?: number;
  /** `lookAtLife`: whose Life area the player chose to look at (G64). */
  lifeOwner?: PlayerId;
}

/** An auto effect that has activated and waits to resolve (CR 8-6). */
export interface PendingEffect {
  /** Effects triggered by one event share a batch; a player orders their own within it. */
  batch: number;
  /** The controller already chose this one to resolve next (`order` decision). */
  chosen?: true;
  /** A delayed effect's body starts at this instruction. */
  start?: number;
  /** A delayed effect's bound selections, carried from the effect that created it (G39). */
  b?: Record<string, InstanceId[]>;
  card: InstanceId;
  /** The source's projection key when it triggered, for `EffectActivated` (M2-17). */
  key: string;
  cardId: CardId;
  ability: string;
  controller: PlayerId;
  timing: string;
  /** What the event told it (`koCause`, `eventCount`). */
  ev?: Ev;
}

/** The pending decision plus what `legalActions` needs to enumerate it. */
export interface DecisionState {
  kind: DecisionKind;
  player: PlayerId;
  prompt: string;
  min?: number;
  max?: number;
  /** `choose`: candidates in canonical order, and the picks made so far. */
  candidates?: Choice[];
  picked?: Choice[];
  /** `optional`: the replacement on offer, if this is a replacement decision. */
  replacement?: ReplacementRef;
  /** `choose` over DON!! classes: how many DON!! each candidate class still holds (E-D4). */
  counts?: number[];
  /** `choose` constraints across picks (OP17-118): a total-cost budget and distinct names. */
  limits?: { total?: number; costs: number[]; names?: string[]; what?: 'power' };
  /** `optional`: accepting is not possible (a cost that cannot be paid; the ask is still shown). */
  noAccept?: true;
  /** What the decision is for (public `Decision.purpose`). */
  role?: DecisionPurpose;
  /** The effect it belongs to (public `Decision.source`). */
  source?: { card: InstanceId; cardId: CardId; ability: string; label?: string };
  /** Named options: modes, top or bottom, the effects or cards to order. */
  options?: { id: string; label: string }[];
  /**
   * The decision's options depend on cards hidden from the other player (a search of a secret
   * area, a cost paid from hand). An observing human must not learn anything from whether it
   * pauses, so `autoSkip` never skips it when observed (M2-19).
   */
  secret?: boolean;
  /** The candidates are a whole zone whose size is public, so the count alone can force a pick. */
  publicCount?: boolean;
  /** Which frame or rule the decision serves, for prompts and `whyNot`. */
  purpose?: 'characterLimit' | 'replacement' | 'ability' | 'effect' | 'pending';
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
  /**
   * Projection keys of the attacker and the current target, taken while they were on the field, so
   * `BattleEnded` maps to the handles the players saw even after a K.O. made a new object (M2-17).
   */
  keys: { attacker: string; target: string };
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
  /**
   * Auto effects waiting to resolve, in resolution order (CR 8-6, ARCHITECTURE §2.2
   * `pendingTriggers`). One queue: each batch of simultaneous triggers is appended turn player's
   * first, so the non-turn player's pending effects resolve before a new turn-player effect
   * (CR 8-6-1) and C triggered by A waits behind pending B (CR 8-6-1-1). It drains only when no
   * activation, damage processing or K.O. is in progress (CR 8.6.3, 8-6-2).
   */
  pending: PendingEffect[];
  /** Once Per Turn marks, `${instance}/${abilityId}` (E-D9). Cleared when the turn passes. */
  oncePerTurn: string[];
  setup: SetupFacts;
  /** Old id → new id for cards that became new objects in the last step (CR 3-1-6, ADR 0013). */
  renames: [InstanceId, InstanceId][];
  /**
   * Hidden cards each player knows (ARCHITECTURE §2.7 `known`): a revealed deck top, cards placed
   * back after a look. Cleared for a card when it moves, and for a deck when it is shuffled.
   */
  known: Record<PlayerId, InstanceId[]>;
  /** Delayed effects ("at the end of this turn, …", OP08-074). */
  delayed: Delayed[];
  /** This turn's K.O.s and Event activations, when a card in the game reads them (G26). */
  hist?: History;
}

export interface Delayed {
  turn: number;
  card: InstanceId;
  key: string;
  cardId: CardId;
  ability: string;
  controller: PlayerId;
  /** First instruction of the delayed body in the ability's program. */
  start: number;
  /**
   * The selections the creating effect had bound by then (`bind`), restored when the body runs
   * so it can read them with `{ ref }` (G39). Absent when nothing was bound.
   */
  b?: Record<string, InstanceId[]>;
}

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');
export const PLAYERS: readonly PlayerId[] = ['p1', 'p2'];

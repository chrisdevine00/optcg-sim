/**
 * The session store (ARCHITECTURE §5). The only app code that holds full game state. It keeps the
 * `GameRecord`, a checkpoint every 20 actions, and derives every player view through the engine.
 * Components and the turn loop see views, view actions (handles) and plain results, never state.
 *
 * Rewind steps back by player-level move (`intentId`, ARCHITECTURE §2.3) and is marked in the record.
 */
import {
  actionFromView,
  appendAction,
  autoSkip,
  createFromScenario,
  createGame,
  ENGINE_VERSION,
  IllegalAction,
  previewFromView,
  project,
  projectEvents,
  queries,
  reduce,
  replay,
  startRecord,
  whyNot,
  type Action,
  type CardLookup,
  type GameEvent,
  type GameRecord,
  type GameSetup,
  type GameState,
  type InstanceId,
  type Intent,
  type PlayerId,
  type Preview,
  type ProjectedView,
  type Reason,
  type RecordWithSnapshots,
  type ScenarioSpec,
} from '@optcg/engine';
import { assignSlots, type Slots } from './slots.ts';

export const CHECKPOINT_EVERY = 20;

/** A rewind, kept in the record (F11: rewound games are marked and excluded from win rate). */
export interface RewindMark {
  /** Actions in the record when the rewind happened. */
  from: number;
  /** Actions kept. */
  to: number;
  /** The actions undone (the forward branch), for review. */
  undone: Action[];
}

export type SessionRecord = RecordWithSnapshots & {
  /** Who played each side: a human at this device or an AI tier. */
  seats: Record<PlayerId, 'human' | 'ai'>;
  rewinds: RewindMark[];
  /** Actions applied by auto-skip (indexes), so review never counts them as decisions. */
  auto: number[];
};

export type Start = { setup: Omit<GameSetup, 'cards'> } | { scenario: Omit<ScenarioSpec, 'cards'> };

/** One player-level move: consecutive actions that share an `intentId`. */
export interface Move {
  start: number;
  end: number;
  player: PlayerId;
  intentId: string;
  auto: boolean;
}

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

/** What a staged defence (or any chain of actions) would lead to, for the battle panel. */
export interface Simulation {
  /** False when a staged action is not legal any more (the reason says why). */
  ok: boolean;
  error?: string;
  /** The player's view with the staged actions applied (powers include staged Counters). */
  view: ProjectedView;
  /** From the Damage Step of the battle, as the player sees it. Null if the battle never got there. */
  damage: { attackerPower: number; targetPower: number; attackerWins: boolean } | null;
  /** Life of each player once the battle is over. */
  lifeAfter: Record<PlayerId, number>;
  /** Handles (in the player's view before the battle) of cards K.O.'d. */
  ko: string[];
  gameOver: boolean;
}

let intentCounter = 0;
export const newIntentId = (): string =>
  `i${Date.now().toString(36)}${(intentCounter++).toString(36)}`;

export class GameSession {
  readonly cards: CardLookup;
  private record: SessionRecord;
  private state: GameState;
  private initial: GameState;
  private checkpoints = new Map<number, GameState>();
  /** Raw engine events per action, index-aligned with `record.actions`. */
  private eventsByAction: GameEvent[][] = [];
  private startEvents: GameEvent[];
  private slots: Slots;
  private forwardBranch: Action[] = [];
  private listeners = new Set<() => void>();
  /** Bumps on every change, for React's useSyncExternalStore. */
  version = 0;

  constructor(cards: CardLookup, start: Start, seats: Record<PlayerId, 'human' | 'ai'>) {
    this.cards = cards;
    const step =
      'setup' in start
        ? createGame({ ...start.setup, cards })
        : createFromScenario({ ...start.scenario, cards });
    this.initial = step.state;
    this.state = step.state;
    this.startEvents = step.events;
    this.record = {
      ...startRecord(start as GameRecord['start'], step.state),
      seats,
      rewinds: [],
      auto: [],
    };
    this.checkpoints.set(0, step.state);
    this.slots = assignSlots(this.initialSlots(), []);
  }

  /** Rebuild a session from a saved record (round trip). Replays from the start. */
  static fromRecord(cards: CardLookup, rec: SessionRecord): GameSession {
    const s = new GameSession(cards, rec.start, rec.seats);
    for (const a of rec.actions) s.applyEngine(a, rec.auto.includes(s.record.actions.length));
    s.record = { ...s.record, rewinds: rec.rewinds.slice() };
    return s;
  }

  // -------------------------------------------------------------------------------------------
  // Subscription
  // -------------------------------------------------------------------------------------------

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private changed(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  // -------------------------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------------------------

  view(player: PlayerId): ProjectedView {
    return project(this.state, player) as ProjectedView;
  }

  /** Who owes the current decision, or null when the game is over. */
  decider(): PlayerId | null {
    return queries.decision(this.state)?.player ?? null;
  }

  /** Life counts at the start (scenarios start with Life placed). */
  initialLife(): Record<PlayerId, number> {
    return {
      p1: queries.zone(this.initial, 'p1', 'life').length,
      p2: queries.zone(this.initial, 'p2', 'life').length,
    };
  }

  /**
   * The same card as another player sees it: `handle` in `from`'s view, returned in `to`'s view.
   * Null when `to` cannot see the card (a hidden zone).
   */
  translate(from: PlayerId, handle: string, to: PlayerId): string | null {
    if (from === to) return handle;
    const probe = actionFromView(this.state, from, {
      type: 'giveDon',
      target: handle,
      player: from,
    });
    const id = probe.type === 'giveDon' ? probe.target : null;
    if (!id) return null;
    const zones = ['leader', 'characters', 'stage', 'trash', 'hand', 'life'] as const;
    const v = project(this.state, to);
    for (const p of ['p1', 'p2'] as const) {
      for (const z of zones) {
        const i = queries.zone(this.state, p, z).findIndex((c) => c.instance === id);
        if (i >= 0) {
          const c = v.zones[p][z][i];
          return c && c.card !== null ? c.handle : null;
        }
      }
    }
    return null;
  }

  /** Action counts at which a full-state checkpoint is held (tests). */
  checkpointIndexes(): number[] {
    return [...this.checkpoints.keys()].sort((a, b) => a - b);
  }

  get actionCount(): number {
    return this.record.actions.length;
  }

  get rewound(): boolean {
    return this.record.rewinds.length > 0;
  }

  get canForward(): boolean {
    return this.forwardBranch.length > 0;
  }

  get seed(): number {
    const st = this.record.start;
    return 'setup' in st ? st.setup.seed : st.scenario.seed;
  }

  exportRecord(): SessionRecord {
    return structuredClone(this.record);
  }

  /** Every applied action's events, projected for `viewer`, with the move each belongs to. */
  log(viewer: PlayerId): { moves: Move[]; events: GameEvent[][]; start: GameEvent[] } {
    return {
      moves: this.moves(),
      events: this.eventsByAction.map((e) => projectEvents(e, viewer)),
      start: projectEvents(this.startEvents, viewer),
    };
  }

  /**
   * What both players may see, in `viewer`'s handles (hotseat, review M3-01..04): `viewer`'s view
   * with every card the other player cannot see turned face down, no legal actions, and the other
   * player's (generic) wording of the decision. The intersection of the two projections.
   */
  publicView(viewer: PlayerId): ProjectedView {
    const own = this.view(viewer);
    const theirs = this.view(viewer === 'p1' ? 'p2' : 'p1');
    const zones = {} as ProjectedView['zones'];
    for (const p of ['p1', 'p2'] as const) {
      zones[p] = {} as ProjectedView['zones']['p1'];
      for (const z of Object.keys(own.zones[p]) as (keyof ProjectedView['zones']['p1'])[]) {
        zones[p][z] = own.zones[p][z].map((c, i) =>
          c.card !== null &&
          theirs.zones[p][z][i]?.card !== null &&
          theirs.zones[p][z][i] !== undefined
            ? c
            : {
                handle: `${p}.${z}.${i}`,
                card: null,
                rested: false,
                faceUp: false,
                don: 0,
                power: null,
                cost: null,
                keywords: [],
              },
        );
      }
    }
    return {
      ...own,
      zones,
      actions: [],
      decision:
        own.decision && theirs.decision
          ? { ...own.decision, prompt: theirs.decision.prompt }
          : own.decision,
      known: {},
    };
  }

  /**
   * The log as both players may see it: `viewer`'s projected events keeping only the fields the
   * other player's projection also has (a draw keeps its zones but loses its card).
   */
  publicLog(viewer: PlayerId): { moves: Move[]; events: GameEvent[][]; start: GameEvent[] } {
    const other = viewer === 'p1' ? 'p2' : 'p1';
    const meet = (a: GameEvent[], b: GameEvent[]) =>
      a.map((e, i) => {
        const o = b[i] ?? {};
        const out: GameEvent = { type: e.type };
        for (const k of Object.keys(e)) if (k in o) out[k] = e[k];
        return out;
      });
    return {
      moves: this.moves(),
      events: this.eventsByAction.map((e) =>
        meet(projectEvents(e, viewer), projectEvents(e, other)),
      ),
      start: meet(projectEvents(this.startEvents, viewer), projectEvents(this.startEvents, other)),
    };
  }

  /**
   * The Life card waiting on `player`'s damage decision (CR 4-6-3), for that player only: the
   * engine names it in the decision prompt it gives them. Null for anyone else.
   */
  pendingLifeCard(player: PlayerId): string | null {
    const d = queries.decision(this.state);
    if (!d || d.kind !== 'trigger' || d.player !== player) return null;
    return queries.zone(this.state, player, 'life')[0]?.card ?? null;
  }

  /** Event types of every action from `index` on (no card data: safe for any viewer). */
  eventTypesFrom(index: number): string[] {
    return this.eventsByAction.slice(index).flatMap((ev) => ev.map((e) => e.type));
  }

  /** The actions of one player that the UI recorded, for "back to my last decision". */
  moves(): Move[] {
    const out: Move[] = [];
    this.record.actions.forEach((a, i) => {
      const last = out.at(-1);
      const auto = this.record.auto.includes(i);
      if (
        last &&
        a.intentId !== undefined &&
        last.intentId === a.intentId &&
        last.player === a.player
      )
        last.end = i + 1;
      else
        out.push({ start: i, end: i + 1, player: a.player, intentId: a.intentId ?? `#${i}`, auto });
    });
    return out;
  }

  /** Board slot (0–4, left to right) of each Character, in the zone's order (board.md §3.7). */
  characterSlots(player: PlayerId): number[] {
    const ids = queries.zone(this.state, player, 'characters').map((c) => c.instance);
    return ids.map((id) => this.slots[player].indexOf(id));
  }

  whyNot(player: PlayerId, intent: Intent): Reason | null {
    try {
      const engine = actionFromView(this.state, player, { ...intent, player } as Action);
      const { player: _p, intentId: _i, ...bare } = engine;
      return whyNot(this.state, player, bare as Intent);
    } catch (e) {
      return { text: e instanceof Error ? e.message : String(e) };
    }
  }

  preview(player: PlayerId, viewAction: Action): Preview | null {
    try {
      return previewFromView(this.state, player, viewAction);
    } catch {
      return null;
    }
  }

  /**
   * Apply `staged` (view actions of `player`) to a scratch copy, then let `player` take the
   * do-nothing answer in each remaining window of this battle (no block, no more Counters, add the
   * Life card to hand) until the battle ends. Nothing reaches the real game. Only what `player` may
   * see is returned: powers, the Damage Step comparison, Life counts and K.O.s.
   */
  simulate(player: PlayerId, staged: Action[]): Simulation {
    let s = this.state;
    const events: GameEvent[] = [];
    let ok = true;
    let error: string | undefined;
    for (const a of staged) {
      try {
        const r = reduce(s, actionFromView(s, player, { ...a, player }));
        s = r.state;
        events.push(...r.events);
      } catch (e) {
        ok = false;
        error = e instanceof IllegalAction ? e.message : String(e);
        break;
      }
    }
    const view = project(s, player) as ProjectedView;
    // Finish the battle with default answers, still on the scratch copy.
    for (let i = 0; i < 16 && ok; i++) {
      const d = queries.decision(s);
      if (!d || d.player !== player || !queries.turn(s).battleStep) break;
      const def: Action | null =
        d.kind === 'block'
          ? { type: 'block', blocker: null, player }
          : d.kind === 'counter'
            ? { type: 'endCounter', player }
            : d.kind === 'trigger'
              ? { type: 'trigger', activate: false, player }
              : d.kind === 'optional'
                ? { type: 'optional', accept: false, player }
                : null;
      if (!def) break;
      const r = reduce(s, def);
      s = r.state;
      events.push(...r.events);
    }
    const seen = projectEvents(events, player);
    const ds = seen.find((e) => e.type === 'DamageStep');
    // A K.O. is announced while the card is still on the field, so its handle is the board's.
    const ko = seen.filter((e) => e.type === 'KO').map((e) => String(e.instance));
    return {
      ok,
      ...(error ? { error } : {}),
      view,
      damage: ds
        ? {
            attackerPower: Number(ds.attackerPower),
            targetPower: Number(ds.targetPower),
            attackerWins: ds.attackerWins === true,
          }
        : null,
      lifeAfter: {
        p1: queries.zone(s, 'p1', 'life').length,
        p2: queries.zone(s, 'p2', 'life').length,
      },
      ko,
      gameOver: queries.result(s) !== null,
    };
  }

  // -------------------------------------------------------------------------------------------
  // Acting
  // -------------------------------------------------------------------------------------------

  /** Apply one action given in `player`'s handles. Nothing changes if the engine rejects it (G4). */
  apply(player: PlayerId, viewAction: Action, intentId?: string): ApplyResult {
    try {
      const engine = actionFromView(this.state, player, {
        ...viewAction,
        player,
        intentId: intentId ?? viewAction.intentId ?? newIntentId(),
      });
      this.applyEngine(engine, false);
      this.forwardBranch = [];
      this.changed();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Auto-skip (ARCHITECTURE §2.3, flows G5): when the decision has exactly one answer that changes
   * nothing, apply it and say so. `observedByOtherHuman` is true in hotseat.
   */
  autoSkip(observedByOtherHuman: boolean): Action | null {
    const a = autoSkip(this.state, { observedByOtherHuman });
    if (!a) return null;
    const viewAction = project(this.state, a.player).actions.find(
      (x) => JSON.stringify(actionFromView(this.state, a.player, x)) === JSON.stringify(a),
    );
    this.applyEngine({ ...a, intentId: newIntentId() }, true);
    this.forwardBranch = [];
    this.changed();
    return viewAction ?? a;
  }

  private applyEngine(a: Action, auto: boolean): void {
    const r = reduce(this.state, a);
    const i = this.record.actions.length;
    this.record = appendAction(this.record, a, r.state) as SessionRecord;
    if (auto) this.record.auto = [...this.record.auto, i];
    this.state = r.state;
    this.eventsByAction.push(r.events);
    this.slots = assignSlots(this.slots, r.events);
    if ((i + 1) % CHECKPOINT_EVERY === 0) this.checkpoints.set(i + 1, r.state);
  }

  // -------------------------------------------------------------------------------------------
  // Rewind (flows F11)
  // -------------------------------------------------------------------------------------------

  /** Restore the game to just before action `index`, marking the record. */
  rewindTo(index: number): boolean {
    const n = this.record.actions.length;
    if (index < 0 || index >= n) return false;
    const undone = this.record.actions.slice(index);
    this.forwardBranch = [...undone, ...this.forwardBranch];
    this.restore(index);
    this.record = {
      ...this.record,
      rewinds: [...this.record.rewinds, { from: n, to: index, undone }],
    };
    this.changed();
    return true;
  }

  /**
   * Undo the latest move made by one of `humans` (and any moves after it). Auto-skipped actions do
   * not count as moves. Returns the move undone.
   */
  rewindMove(humans: readonly PlayerId[]): Move | null {
    const m = [...this.moves()].reverse().find((x) => !x.auto && humans.includes(x.player));
    if (!m) return null;
    return this.rewindTo(m.start) ? m : null;
  }

  /**
   * Back to my last decision: the latest point before now where `player` owed a decision that was
   * not auto-skipped. Steps back over every opponent move after it.
   */
  backToLastDecision(player: PlayerId): Move | null {
    return this.rewindMove([player]);
  }

  /** Redo the next undone move (F11 step 3), exactly as it was. */
  forward(): boolean {
    if (this.forwardBranch.length === 0) return false;
    const first = this.forwardBranch[0]!;
    let k = 1;
    while (
      k < this.forwardBranch.length &&
      first.intentId !== undefined &&
      this.forwardBranch[k]!.intentId === first.intentId
    )
      k++;
    const redo = this.forwardBranch.slice(0, k);
    const rest = this.forwardBranch.slice(k);
    for (const a of redo) this.applyEngine(a, false);
    this.forwardBranch = rest;
    this.changed();
    return true;
  }

  private restore(index: number): void {
    let base = 0;
    for (const k of this.checkpoints.keys()) if (k <= index && k > base) base = k;
    let s = this.checkpoints.get(base) ?? this.initial;
    const actions = this.record.actions;
    for (let i = base; i < index; i++) s = reduce(s, actions[i]!).state;
    for (const k of [...this.checkpoints.keys()]) if (k > index) this.checkpoints.delete(k);
    this.state = s;
    this.eventsByAction = this.eventsByAction.slice(0, index);
    this.record = {
      ...this.record,
      actions: actions.slice(0, index),
      auto: this.record.auto.filter((i) => i < index),
      snapshots: this.record.snapshots.filter((x) => x.actionIndex <= index),
    };
    this.slots = assignSlots(this.initialSlots(), this.eventsByAction.flat());
  }

  private initialSlots(): Slots {
    const out = { p1: [null, null, null, null, null], p2: [null, null, null, null, null] } as Slots;
    for (const p of ['p1', 'p2'] as const) {
      const ids = queries.zone(this.initial, p, 'characters').map((c) => c.instance as InstanceId);
      out[p] = assignSlots(
        out,
        ids.map((id) => ({ type: 'CardMoved', to: 'characters', owner: p, newInstance: id })),
      )[p];
    }
    return out;
  }

  /** Replays the record from scratch and checks it lands on the same state (tests, bug reports). */
  verify(): boolean {
    const r = replay(this.record, this.cards);
    return JSON.stringify(r.state) === JSON.stringify(this.state);
  }

  get engineVersion(): string {
    return ENGINE_VERSION;
  }
}

/**
 * Engine entry points (ARCHITECTURE §2.1). Signatures frozen at the start of M2.
 */
import {
  IllegalAction,
  type Action,
  type CardLookup,
  type GameEvent,
  type GameRecord,
  type GameSetup,
  type GameState,
  type Intent,
  type PlayerId,
  type PlayerView,
  type Preview,
  type Queries,
  type Reason,
  type ScenarioSpec,
  type Step,
} from './api.ts';
import { apply, check, legalActions as enumerate } from './actions.ts';
import { Draft } from './draft.ts';
import { advance } from './flow.ts';
import { ruleProcessing } from './ops/index.ts';
import { summaryHash as hash } from './hash.ts';
import { checkInvariants as invariants } from './invariants.ts';
import { preview as previewWith } from './preview.ts';
import {
  handleFor,
  actionFromView as fromView,
  project as projectState,
  projectEvents as projectEventsFor,
} from './project.ts';
import { queries as q } from './queries.ts';
import { replayWith } from './record.ts';
import { createFromScenario as fromScenario, createGame as fromSetup } from './setup.ts';
import type { State } from './state.ts';

const st = (g: GameState): State => g as unknown as State;
const gs = (s: State): GameState => s as unknown as GameState;

export const createGame = (setup: GameSetup): Step => fromSetup(setup);
export const createFromScenario = (spec: ScenarioSpec): Step => fromScenario(spec);

export const reduce = (state: GameState, action: Action): Step => {
  const s = st(state);
  const reason = check(s, action.player, action);
  if (reason) throw new IllegalAction(reason.text, action);
  const d = new Draft(s, action.intentId);
  apply(d, action);
  ruleProcessing(d);
  advance(d);
  if (d.deckTouched.size || d.damagedAtZero.size)
    throw new Error('Rule processing left a defeat flag unchecked (M2-14)');
  return { state: gs(d.s), events: d.events };
};

export const legalActions = (state: GameState): Action[] => enumerate(st(state));

export const project = (state: GameState, player: PlayerId): PlayerView =>
  projectState(st(state), player);

export const whyNot = (state: GameState, player: PlayerId, intent: Intent): Reason | null =>
  check(st(state), player, intent);

export const preview = (state: GameState, action: Action): Preview =>
  previewWith(
    (s, a) => {
      const r = reduce(gs(s), a);
      return { state: st(r.state), events: r.events };
    },
    st(state),
    action,
  );

export const replay = (record: GameRecord, cards: CardLookup, upTo?: number): Step =>
  replayWith({ createGame, createFromScenario, reduce }, record, cards, upTo);

export const checkInvariants = (state: GameState): string[] => invariants(st(state));

export const summaryHash = (state: GameState): string => hash(st(state));

export const queries: Queries = q;

// ---------------------------------------------------------------------------------------------
// Additions after the M2 freeze (additive only; no frozen shape changed).
// ---------------------------------------------------------------------------------------------

export interface AutoSkipOptions {
  /**
   * True when another human could see whether the game paused (hotseat, or a human opponent).
   * Then a window is skipped only when its single option follows from public information.
   */
  observedByOtherHuman: boolean;
}

/**
 * Auto-skip support (ARCHITECTURE §2.3, flows.md decision 4): the one action to apply when the
 * pending decision has exactly one legal answer: an empty Block or Counter window, a damage step
 * with no [Trigger] to activate, or a forced pick. Concession is never counted. Null when the
 * player has a real choice, or when skipping would tell an observing human something hidden
 * (M2-02): the Counter window then skips only on an empty hand (hand size is public, CR 3-1-4),
 * and the damage decision never skips. The store still records the action.
 */
export const autoSkip = (state: GameState, options: AutoSkipOptions): Action | null => {
  const s = st(state);
  const dec = s.decision;
  if (!dec) return null;
  const actions = enumerate(s).filter((a) => a.type !== 'concede');
  if (actions.length !== 1) return null;
  const only = actions[0]!;
  const skippable =
    (only.type === 'block' && only.blocker === null) ||
    only.type === 'endCounter' ||
    (only.type === 'trigger' && !only.activate) ||
    only.type === 'done' ||
    only.type === 'pick';
  if (!skippable) return null;
  if (options.observedByOtherHuman) {
    // Only windows whose options depend on public information alone.
    if (only.type === 'trigger') return null;
    if (only.type === 'endCounter' && s.players[dec.player].hand.length > 0) return null;
  }
  return only;
};

/** Events as one player may see them (ARCHITECTURE §2.7). */
export const projectEvents = (events: readonly GameEvent[], player: PlayerId): GameEvent[] =>
  projectEventsFor(events, player);

/**
 * Map an action from a player's view (card handles) back to the engine action `reduce` takes. The
 * session store calls this; the UI and AI only ever hold handles (ARCHITECTURE §2.7).
 */
export const actionFromView = (state: GameState, player: PlayerId, action: Action): Action =>
  fromView(st(state), player, action);

/**
 * `preview` for a view (M2-04): the action is given in `player`'s handles, and the result is keyed
 * by that player's handles, so the UI can match it to its view and nothing exposes instance ids.
 */
export const previewFromView = (
  state: GameState,
  player: PlayerId,
  viewAction: Action,
): Preview => {
  const s = st(state);
  if (viewAction.player !== player)
    throw new IllegalAction('Preview your own actions only.', viewAction);
  const p = preview(state, fromView(s, player, viewAction));
  const h = (id: string): string => handleFor(player, id, s.cards[id]!.key);
  return {
    cards: Object.fromEntries(Object.entries(p.cards).map(([id, v]) => [h(id), v])),
    life: p.life,
    ko: p.ko.map(h),
    gameOver: p.gameOver,
  };
};

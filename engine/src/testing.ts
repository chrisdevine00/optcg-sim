/**
 * Test-only helpers. Not exported from the package entry; engine tests import this file directly.
 *
 * Until M4 no real card has a script, so these helpers inject abilities into a state's card
 * definitions and run single atomic operations as if an effect did. That lets the M2 tests exercise
 * the hooks (replacements, [Trigger], [On K.O.], timing points) and the choke points without the DSL.
 */
import type { CardId, GameState, InstanceId, PlayerId, Step } from './api.ts';
import type { Ability } from './abilities.ts';
import { Draft } from './draft.ts';
import { advance, push, pushKo } from './flow.ts';
import {
  addModifier,
  draw,
  leaveField,
  lifeToHand,
  moveCard,
  rest,
  ruleProcessing,
} from './ops/index.ts';
import type { Duration, ModKind, State } from './state.ts';
import { other } from './state.ts';

export type { Ability, InternalStep } from './abilities.ts';
export type { Duration } from './state.ts';

const st = (g: GameState): State => g as unknown as State;
const gs = (s: State): GameState => s as unknown as GameState;

/** A copy of `state` in which every card with id `cardId` has these abilities. */
export function withAbilities(state: GameState, cardId: CardId, abilities: Ability[]): GameState {
  const s = st(state);
  const def = s.defs[cardId];
  if (!def) throw new Error(`${cardId} is not in this game`);
  return gs({ ...s, defs: { ...s.defs, [cardId]: { ...def, abilities } } });
}

/** A copy of `state` in which these card ids carry these printed keywords. */
export function withKeywords(state: GameState, cardId: CardId, keywords: string[]): GameState {
  const s = st(state);
  const def = s.defs[cardId]!;
  return gs({ ...s, defs: { ...s.defs, [cardId]: { ...def, keywords } } });
}

export interface ModSpec {
  kind: ModKind;
  target: InstanceId;
  amount?: number;
  keyword?: string;
  duration: Duration;
  controller: PlayerId;
  source?: InstanceId | null;
}

export type TestOp =
  | { op: 'ko'; card: InstanceId; by: PlayerId }
  | { op: 'trashFromField'; card: InstanceId; by: PlayerId }
  | { op: 'bounce'; card: InstanceId; by: PlayerId }
  | { op: 'damage'; player: PlayerId; n: number; by: PlayerId }
  | { op: 'draw'; player: PlayerId; n: number }
  | { op: 'lifeToHand'; player: PlayerId; n: number }
  | { op: 'rest'; card: InstanceId }
  | { op: 'millBoth'; n: number }
  | { op: 'modifier'; mod: ModSpec }
  | { op: 'loop' };

/**
 * Run one operation as if a card effect did it, then run the game forward to the next decision,
 * exactly as `reduce` would. Pending decisions are kept underneath and resume afterwards.
 */
export function applyOp(state: GameState, op: TestOp): Step {
  const s = st(state);
  const d = new Draft(s);
  // The pending decision's frame is still on the stack and asks again after the operation.
  d.s.decision = null;
  switch (op.op) {
    case 'ko':
      pushKo(d, op.card, { kind: 'effect', by: op.by });
      break;
    case 'trashFromField':
      leaveField(d, op.card, 'trash', { kind: 'effect', by: op.by });
      break;
    case 'bounce':
      leaveField(d, op.card, 'hand', { kind: 'effect', by: op.by });
      break;
    case 'damage':
      d.emit({ type: 'DamageDealt', player: op.player, amount: op.n, by: op.by, effect: true });
      push(d, {
        f: 'damage',
        player: op.player,
        remaining: op.n,
        banish: false,
        battle: false,
        by: op.by,
        pending: null,
      });
      break;
    case 'draw':
      draw(d, op.player, op.n);
      break;
    case 'lifeToHand':
      lifeToHand(d, op.player, op.n);
      break;
    case 'rest':
      rest(d, op.card);
      break;
    case 'millBoth':
      // One atomic step that moves cards from both decks, then a single rule-processing check.
      for (const p of [d.s.active, other(d.s.active)]) {
        for (let i = 0; i < op.n && d.ro(p).deck.length > 0; i++)
          moveCard(d, d.ro(p).deck[0]!, 'trash', { extra: { reason: 'mill' } });
      }
      break;
    case 'modifier':
      addModifier(d, {
        kind: op.mod.kind,
        target: op.mod.target,
        amount: op.mod.amount ?? 0,
        keyword: op.mod.keyword,
        duration: op.mod.duration,
        controller: op.mod.controller,
        source: op.mod.source ?? null,
      });
      break;
    case 'loop':
      push(d, { f: 'loop' });
      break;
  }
  ruleProcessing(d);
  advance(d);
  return { state: gs(d.s), events: d.events };
}

/** Internal state, for tests that check bookkeeping no public query exposes. */
export function internals(state: GameState): State {
  return st(state);
}

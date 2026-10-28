/**
 * Test fixtures for the engine, frozen at the start of M2 (PLAN §5).
 * Rule, ruling and card tests are written against these helpers and the public API only,
 * so the independent test author never depends on engine internals.
 *
 * Example:
 *   const g = scenario({ p1: { leader: 'OP17-039', characters: ['OP17-040'] }, p2: { leader: 'OP17-058' } });
 *   const zoro = g.find('p1', 'characters', 'OP17-040');
 *   g.act({ type: 'attack', attacker: zoro, target: g.leader('p2') });
 */
import { readdirSync, readFileSync } from 'node:fs';
import type { Card, SetFile } from '@optcg/cards';
import {
  checkInvariants,
  createFromScenario,
  IllegalAction,
  legalActions,
  queries,
  reduce,
  type Action,
  type CardId,
  type CardLookup,
  type CardView,
  type GameEvent,
  type GameState,
  type InstanceId,
  type PlayerId,
  type ScenarioSpec,
  type ZoneName,
} from '@optcg/engine';

let lookup: CardLookup | undefined;

/** Every generated card, loaded once from cards/data/sets. */
export function cards(): CardLookup {
  if (!lookup) {
    const dir = new URL('../../../cards/data/sets/', import.meta.url);
    const byId = new Map<CardId, Card>();
    for (const file of readdirSync(dir)) {
      const set = JSON.parse(readFileSync(new URL(file, dir), 'utf8')) as SetFile;
      for (const card of set.cards) byId.set(card.id, card);
    }
    lookup = (id) => byId.get(id);
  }
  return lookup;
}

export type ScenarioInput = Omit<
  ScenarioSpec,
  'cards' | 'seed' | 'turn' | 'activePlayer' | 'firstPlayer'
> &
  Partial<Pick<ScenarioSpec, 'seed' | 'turn' | 'activePlayer' | 'firstPlayer'>>;

/** A started game with helpers. Every action is checked against `legalActions` and the invariants. */
export class TestGame {
  state: GameState;
  /** Events from every action so far, in order. */
  readonly events: GameEvent[] = [];

  constructor(state: GameState, events: GameEvent[]) {
    this.state = state;
    this.events.push(...events);
    assertInvariants(state);
  }

  /** The player who owes the current decision. */
  get decider(): PlayerId {
    const d = queries.decision(this.state);
    if (!d) throw new Error('No decision is pending (the game is over).');
    return d.player;
  }

  /** Apply an action for the deciding player. Throws unless the action is in `legalActions`. */
  act(action: Omit<Action, 'player'> & { player?: PlayerId }): GameEvent[] {
    const full = { ...action, player: action.player ?? this.decider } as Action;
    if (!this.isLegal(full)) {
      throw new IllegalAction(`Not a legal action: ${JSON.stringify(full)}`, full);
    }
    const step = reduce(this.state, full);
    this.state = step.state;
    this.events.push(...step.events);
    assertInvariants(this.state);
    return step.events;
  }

  legal(): Action[] {
    return legalActions(this.state);
  }

  isLegal(action: Omit<Action, 'intentId'>): boolean {
    const key = canonical(action);
    return this.legal().some((a) => canonical(a) === key);
  }

  /** Instance id of the nth (0-based) card with this id in a zone. Throws if absent. */
  find(player: PlayerId, zone: ZoneName, card: CardId, nth = 0): InstanceId {
    const hits = this.zone(player, zone).filter((c) => c.card === card);
    const hit = hits[nth];
    if (!hit) throw new Error(`${card} #${nth} not found in ${player}.${zone}`);
    return hit.instance;
  }

  leader(player: PlayerId): InstanceId {
    return this.zone(player, 'leader')[0]!.instance;
  }

  zone(player: PlayerId, zone: ZoneName): CardView[] {
    return queries.zone(this.state, player, zone);
  }

  card(instance: InstanceId): CardView {
    return queries.card(this.state, instance);
  }

  power(instance: InstanceId): number | null {
    return this.card(instance).power;
  }

  life(player: PlayerId): number {
    return this.zone(player, 'life').length;
  }

  eventsOfType(type: string): GameEvent[] {
    return this.events.filter((e) => e.type === type);
  }
}

/** Build a game from a described position. Defaults: seed 1, turn 3, p1 active and first, Main Phase. */
export function scenario(input: ScenarioInput): TestGame {
  const step = createFromScenario({
    seed: 1,
    turn: 3,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    ...input,
    cards: cards(),
  });
  return new TestGame(step.state, step.events);
}

function assertInvariants(state: GameState): void {
  const errors = checkInvariants(state);
  if (errors.length) throw new Error(`Invariant failure:\n${errors.join('\n')}`);
}

/** Stable string for comparing actions: keys sorted at every depth, intentId ignored. */
function canonical(action: Omit<Action, 'intentId'>): string {
  const { intentId: _ignored, ...rest } = action as Action;
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, x]) => [k, sort(x)]),
          )
        : v;
  return JSON.stringify(sort(rest));
}

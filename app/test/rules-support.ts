/**
 * M9 WP5 test support: play a rules demo's `line` on the real engine. It mirrors what the board does:
 * the player's forced windows (one legal answer, except a damage decision) are applied for them, the
 * player's steps and the scripted opponent's steps must each match exactly one legal action, and
 * nothing else is ever applied.
 */
import { readFileSync } from 'node:fs';
import {
  actionFromView,
  autoSkip,
  createFromScenario,
  legalActions,
  project,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { scriptedAction } from '../src/tutorial/scripted.ts';
import { matches, otherSeat, scriptFor, ZONES, type Scene } from '../src/rules/showme.ts';
import type { ActionPattern, DemoExpect, DemoStep, Ref, RuleDemo } from '../src/rules/types.ts';
import { buildRules, type RulesData } from '../src/rules/index.ts';
import { lookup } from './support.ts';

export const ME: PlayerId = 'p1';

/** The rules reference's data, built from the three research files on disk (not the lazy chunk). */
let built: RulesData | undefined;
export function rulesData(): RulesData {
  built ??= buildRules(
    readFileSync('docs/research/rules-digest.md', 'utf8'),
    readFileSync('docs/research/rulings.md', 'utf8'),
    readFileSync('docs/content/glossary.md', 'utf8'),
  );
  return built;
}

/** Refs against a full state: used by the test that replays every demo (it may see everything). */
export function stateScene(state: GameState, me: PlayerId): Scene {
  const seat = (side: 'me' | 'opp') => (side === 'me' ? me : otherSeat(me));
  return {
    seat,
    ids(ref) {
      const p = seat('leader' in ref ? ref.leader : ref.side);
      if ('leader' in ref) return queries.zone(state, p, 'leader').map((c) => c.instance);
      return ZONES.flatMap((z) => queries.zone(state, p, z))
        .filter((c) => c.card === ref.card)
        .map((c) => c.instance);
    },
  };
}

export interface Played {
  state: GameState;
  /** Each step with the action it matched and the forced actions applied before it. */
  trace: { step: DemoStep; action: Action; auto: Action[]; before: GameState }[];
  /** Forced actions applied after the last step. */
  tail: Action[];
}

/** The player's forced window, as the board skips it. */
function forced(state: GameState): Action | null {
  const d = queries.decision(state);
  if (!d || d.player !== ME || d.kind === 'trigger') return null;
  return autoSkip(state, { observedByOtherHuman: false });
}

export function start(demo: RuleDemo): GameState {
  return createFromScenario({ ...demo.scenario, cards: lookup }).state;
}

export function playDemo(demo: RuleDemo, until = demo.line.length): Played {
  let state = start(demo);
  const trace: Played['trace'] = [];
  const settle = (): Action[] => {
    const out: Action[] = [];
    for (let guard = 0; guard < 50; guard++) {
      const a = forced(state);
      if (!a) break;
      state = reduce(state, a).state;
      out.push(a);
    }
    return out;
  };
  demo.line.slice(0, until).forEach((step, i) => {
    const auto = settle();
    const scene = stateScene(state, ME);
    const found = legalActions(state).filter((a) => matches(a, step.match, scene));
    const where = `${demo.id} step ${i + 1} "${step.desc}"`;
    if (found.length === 0) {
      const d = queries.decision(state);
      throw new Error(
        `${where}: no legal action matches (decision ${d?.kind} for ${d?.player}; legal: ${legalActions(
          state,
        )
          .map((a) => a.type)
          .join(', ')})`,
      );
    }
    const distinct = new Set(found.map((a) => JSON.stringify({ ...a, intentId: undefined })));
    if (distinct.size > 1)
      throw new Error(`${where}: ambiguous, ${distinct.size} legal actions match`);
    const action = found[0]!;
    const before = state;
    if (step.match.by === 'opp') conformsToScript(demo, state, action, where);
    state = reduce(state, action).state;
    trace.push({ step, action, auto, before });
  });
  const tail = until === demo.line.length ? settle() : [];
  return { state, trace, tail };
}

/** The scripted opponent would choose exactly this action (the board plays the opponent with it). */
function conformsToScript(demo: RuleDemo, state: GameState, action: Action, where: string): void {
  const opp: PlayerId = ME === 'p1' ? 'p2' : 'p1';
  const picked = scriptedAction(project(state, opp), scriptFor(demo));
  const engine = actionFromView(state, opp, picked);
  const key = (a: Action) => JSON.stringify({ ...a, intentId: undefined });
  if (key(engine) !== key(action))
    throw new Error(
      `${where}: the scripted opponent would play ${key(engine)}, not ${key(action)}`,
    );
}

// ---------------------------------------------------------------------------------------------
// Expectations
// ---------------------------------------------------------------------------------------------

const seatOf = (side: 'me' | 'opp'): PlayerId => (side === 'me' ? ME : ME === 'p1' ? 'p2' : 'p1');

function cardOf(state: GameState, scene: Scene, ref: Ref) {
  const ids = scene.ids(ref);
  if (ids.length !== 1)
    throw new Error(`ref ${JSON.stringify(ref)} names ${ids.length} cards, not 1`);
  return queries.card(state, ids[0]!);
}

/** Evaluate one expectation on a state: true when it holds. */
export function holds(state: GameState, e: DemoExpect): boolean {
  const scene = stateScene(state, ME);
  switch (e.kind) {
    case 'life':
      return queries.zone(state, seatOf(e.side), 'life').length === e.count;
    case 'zone': {
      if (e.zone === 'don' || e.zone === 'donDeck') {
        const d = queries.don(state, seatOf(e.side));
        return (e.zone === 'don' ? d.active + d.rested : d.deck) === e.count;
      }
      const cards = queries.zone(state, seatOf(e.side), e.zone);
      const n = e.card ? cards.filter((c) => c.card === e.card).length : cards.length;
      return n === e.count;
    }
    case 'power':
      return cardOf(state, scene, e.of).power === e.value;
    case 'rested':
      return cardOf(state, scene, e.of).rested === e.rested;
    case 'result': {
      const r = queries.result(state);
      if (e.winner === null) return r === null;
      return r !== null && 'winner' in r && r.winner === seatOf(e.winner);
    }
    case 'legal': {
      const any = legalActions(state).some((a) => matches(a, e.pattern as ActionPattern, scene));
      return any === e.legal;
    }
  }
}

/** The state with the player's forced windows applied, as the board shows it before a step. */
export function settled(state: GameState): GameState {
  let s = state;
  for (let guard = 0; guard < 50; guard++) {
    const a = forced(s);
    if (!a) break;
    s = reduce(s, a).state;
  }
  return s;
}

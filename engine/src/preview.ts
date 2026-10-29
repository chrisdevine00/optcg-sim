/**
 * `preview` (ARCHITECTURE §2.1): what an action would do, for the battle panel and the blunder
 * warning. It applies the action, then lets the opponent take the do-nothing answer at each window
 * that follows (no block, no Counter, no [Trigger], decline optional effects) until the decision
 * returns to the acting player or the game ends. Only cards the acting player could see are listed.
 */
import type { Action, GameEvent, InstanceId, PlayerId, Preview, ZoneName } from './api.ts';
import { derive } from './derive.ts';
import { visibleTo } from './project.ts';
import type { State } from './state.ts';

type Reducer = (s: State, a: Action) => { state: State; events: GameEvent[] };

const MAX_STEPS = 64;

function defaultAnswer(s: State): Action | null {
  const d = s.decision;
  if (!d) return null;
  switch (d.kind) {
    case 'block':
      return { type: 'block', blocker: null, player: d.player };
    case 'counter':
      return { type: 'endCounter', player: d.player };
    case 'trigger':
      return { type: 'trigger', activate: false, player: d.player };
    case 'optional':
      return { type: 'optional', accept: false, player: d.player };
    default:
      return null;
  }
}

export function preview(reduce: Reducer, s0: State, action: Action): Preview {
  const actor: PlayerId = action.player;
  let step = reduce(s0, action);
  const events = [...step.events];
  const renames = new Map<InstanceId, InstanceId>(step.state.renames);
  for (let i = 0; i < MAX_STEPS; i++) {
    const s = step.state;
    if (s.result || !s.decision || s.decision.player === actor) break;
    const a = defaultAnswer(s);
    if (!a) break;
    step = reduce(s, a);
    events.push(...step.events);
    for (const [o, n] of step.state.renames) renames.set(o, n);
  }
  const s1 = step.state;
  const cards: Preview['cards'] = {};
  for (const id of Object.keys(s0.cards)) {
    if (!visibleTo(s0, id, actor)) continue;
    let now: InstanceId | undefined = id;
    while (now && !s1.cards[now]) now = renames.get(now);
    const before = s0.cards[id]!;
    const p0 = derive(s0, id).power;
    if (!now) continue; // moved somewhere the actor cannot follow
    const after = s1.cards[now]!;
    const p1 = derive(s1, now).power;
    const change: { power?: number | null; zone?: ZoneName } = {};
    if (p1 !== p0) change.power = p1;
    if (after.zone !== before.zone) change.zone = after.zone as ZoneName;
    if (change.power !== undefined || change.zone !== undefined) cards[id] = change;
  }
  const ko = events
    .filter((e) => e.type === 'KO')
    .map((e) => e.instance as InstanceId)
    .filter((id) => s0.cards[id] !== undefined);
  return {
    cards,
    life: { p1: s1.players.p1.life.length, p2: s1.players.p2.life.length },
    ko,
    gameOver: s1.result !== null,
  };
}

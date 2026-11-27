/**
 * M9 WP5: "Show me", the machinery. A demo's `line` describes engine actions by what they name
 * (`Ref`: a printed card id and a side), never by instance id. `matches` tests one action against one
 * pattern in a `Scene`, which resolves refs against the player's own `ProjectedView` (the board) or,
 * in `app/test/rules-support.ts`, against a full state (the test that replays every demo may see
 * everything; the app may not, ESLint). `allowFor`
 * builds the controller's allowed-action filter from the current step: it only ever removes engine
 * actions, it never adds one, so a demo cannot teach something the engine would not do.
 *
 * Steps by the opponent are played by the tutorial's scripted opponent (`scriptFor`); the player's
 * steps are the ones the board waits for (`mySteps`).
 */
import type { Card } from '@optcg/cards';
import type { Action, PlayerId, ProjectedView, ZoneName } from '@optcg/engine';
import type { OpponentScript } from '../tutorial/scripted.ts';
import type { ActionPattern, DemoStep, Ref, RuleDemo } from './types.ts';

/** What a pattern's refs resolve against. `ids` are instance ids (state) or handles (view). */
export interface Scene {
  seat(side: 'me' | 'opp'): PlayerId;
  ids(ref: Ref): string[];
}

export const ZONES: readonly ZoneName[] = [
  'leader',
  'characters',
  'stage',
  'hand',
  'life',
  'trash',
  'deck',
  'costArea',
  'donDeck',
];

export const otherSeat = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** Refs against the player's own view: a hidden card has no id, so it never matches. */
export function viewScene(view: ProjectedView): Scene {
  const me = view.player;
  const seat = (side: 'me' | 'opp') => (side === 'me' ? me : otherSeat(me));
  return {
    seat,
    ids(ref) {
      const p = seat('leader' in ref ? ref.leader : ref.side);
      if ('leader' in ref) return view.zones[p].leader.map((c) => c.handle);
      return ZONES.flatMap((z) => view.zones[p][z])
        .filter((c) => c.card === ref.card)
        .map((c) => c.handle);
    },
  };
}

/** Whether `action` is the one `pattern` describes. Fields the pattern leaves out match anything. */
export function matches(action: Action, pattern: ActionPattern, scene: Scene): boolean {
  if (action.type !== pattern.type) return false;
  if (action.player !== scene.seat(pattern.by ?? 'me')) return false;
  const a = action as Record<string, unknown>;
  const named = (field: 'card' | 'target' | 'attacker', ref: Ref | undefined): boolean =>
    ref === undefined ||
    (typeof a[field] === 'string' && scene.ids(ref).includes(a[field] as string));
  if (!named('card', pattern.card) || !named('target', pattern.target)) return false;
  if (!named('attacker', pattern.attacker)) return false;
  if (pattern.blocker !== undefined) {
    if (pattern.blocker === 'none') {
      if (a.blocker !== null) return false;
    } else if (typeof a.blocker !== 'string' || !scene.ids(pattern.blocker).includes(a.blocker))
      return false;
  }
  if (pattern.choice !== undefined) {
    if (typeof a.choice !== 'string' || !scene.ids(pattern.choice).includes(a.choice)) return false;
  }
  if (pattern.option !== undefined) {
    const c = a.choice;
    if (typeof c !== 'object' || c === null || (c as { option?: string }).option !== pattern.option)
      return false;
  }
  if (pattern.don !== undefined) {
    const c = a.choice;
    if (typeof c !== 'object' || c === null || (c as { from?: string }).from !== pattern.don)
      return false;
  }
  if (pattern.ability !== undefined && a.ability !== pattern.ability) return false;
  if (pattern.redraw !== undefined && a.redraw !== pattern.redraw) return false;
  if (pattern.accept !== undefined && a.accept !== pattern.accept) return false;
  if (pattern.activate !== undefined && a.activate !== pattern.activate) return false;
  if (pattern.goFirst !== undefined && a.goFirst !== pattern.goFirst) return false;
  return true;
}

/** The steps the board waits for: the player's own. */
export const mySteps = (demo: RuleDemo): DemoStep[] =>
  demo.line.filter((s) => (s.match.by ?? 'me') === 'me');

/** The scripted opponent's script for a demo: it attacks the Leader when the line says it does. */
export function scriptFor(demo: RuleDemo): OpponentScript {
  return demo.line.some((s) => s.match.by === 'opp' && s.match.type === 'attack')
    ? 'attack-leader'
    : 'none';
}

/**
 * The controller's filter for a demo at `cursor` (the number of the player's steps done). Past the
 * last step nothing is allowed. It is a narrowing: the controller only offers an action the engine
 * already lists, so this never adds a move.
 */
export function allowFor(
  demo: RuleDemo,
  cursor: () => number,
): (action: Action, view: ProjectedView) => boolean {
  const mine = mySteps(demo);
  return (action, view) => {
    const step = mine[cursor()];
    return step !== undefined && matches(action, step.match, viewScene(view));
  };
}

/** Every card id a demo's scenario names, for loading card data. */
export function demoCardIds(demo: RuleDemo): string[] {
  const ids = new Set<string>();
  const placed = (c: unknown): void => {
    if (typeof c === 'string') ids.add(c);
    else if (c && typeof c === 'object' && 'card' in c) ids.add((c as { card: string }).card);
  };
  for (const side of [demo.scenario.p1, demo.scenario.p2]) {
    placed(side.leader);
    for (const list of [side.hand, side.deck, side.life, side.characters, side.trash])
      for (const c of list ?? []) placed(c);
    if (side.stage) placed(side.stage);
  }
  const refs = (r: Ref | 'none' | undefined) => {
    if (r && r !== 'none' && 'card' in r) ids.add(r.card);
  };
  for (const s of demo.line) {
    refs(s.match.card);
    refs(s.match.target);
    refs(s.match.attacker);
    refs(s.match.blocker);
    refs(s.match.choice);
  }
  return [...ids];
}

/** A card map restricted to a demo (for the board); the loader hands back every id it knows. */
export function demoCards(demo: RuleDemo, all: ReadonlyMap<string, Card>): Map<string, Card> {
  return new Map(
    demoCardIds(demo).flatMap((id) => (all.has(id) ? [[id, all.get(id)!] as const] : [])),
  );
}

/**
 * How many of the player's steps have been played: the player's own actions in the record that the
 * engine did not auto-skip. The filter lets only the current step's action through, so each such
 * action is that step.
 */
export function stepsDone(
  record: {
    actions: readonly Action[];
    auto: readonly number[];
  },
  me: PlayerId,
): number {
  let n = 0;
  record.actions.forEach((a, i) => {
    if (a.player === me && !record.auto.includes(i)) n++;
  });
  return n;
}

import {
  actionFromView,
  legalActions,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';

/** A line, played against every defender answer. Returns a defender path on which `me` does not win, or null. */
export function refuteLine(
  s0: GameState,
  actions: Action[],
  me: PlayerId = 'p1',
  maxStates = 150_000,
  raw = false,
): Action[] | null {
  let count = 0;
  function go(s: GameState, qi: number, path: Action[]): Action[] | null {
    if (++count > maxStates) throw new Error('state cap');
    const res = queries.result(s);
    if (res) return 'winner' in res && res.winner === me ? null : path;
    const dec = queries.decision(s);
    if (!dec) return path;
    if (dec.player === me) {
      const a = actions[qi];
      if (!a) return path;
      return go(reduce(s, raw ? a : actionFromView(s, me, a)).state, qi + 1, path);
    }
    const seen = new Set<string>();
    for (const a of legalActions(s)) {
      if (a.type === 'concede') continue;
      // Interchangeable cards are one answer.
      const key = JSON.stringify(
        a.type === 'counter' || a.type === 'activate'
          ? [a.type, queries.card(s, a.card).card, 'ability' in a ? a.ability : '']
          : a,
      );
      if (seen.has(key)) continue;
      seen.add(key);
      const r = go(reduce(s, a).state, qi, [...path, a]);
      if (r) return r;
    }
    return null;
  }
  return go(s0, 0, []);
}

/** `refuteLine`, with a state-cap overrun read as "no counter-example found" (not a failure). */
export function refuteLineOrNull(...args: Parameters<typeof refuteLine>): Action[] | null {
  try {
    return refuteLine(...args);
  } catch {
    return null;
  }
}

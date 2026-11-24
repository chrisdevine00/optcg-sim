/**
 * The per-turn history some cards read (M6b wave 3, G26): "an opponent's Character has been K.O.'d
 * during this turn", "you have activated an Event with a base cost of 3 or more during this turn".
 *
 * It is kept only when a card in the game reads it, found once per set of card definitions from the
 * scripts themselves. A game with no such card carries no history at all, so its state, hash and
 * recorded replays are exactly what they were before. The record names a turn and counts as empty
 * on any other turn, so nothing has to clear it when the turn passes.
 */
import type { PlayerId } from './api.ts';
import type { Draft } from './draft.ts';
import type { History, State } from './state.ts';

const memo = new WeakMap<object, boolean>();

/** Does any card definition in this game read the per-turn history? */
export function tracksHistory(s: State): boolean {
  let v = memo.get(s.defs);
  if (v === undefined) {
    v = Object.values(s.defs).some((def) => {
      if (def.abilities.length === 0) return false;
      const text = JSON.stringify(def.abilities);
      return text.includes('"koedThisTurn"') || text.includes('"eventsActivatedThisTurn"');
    });
    memo.set(s.defs, v);
  }
  return v;
}

/** This turn's history (empty on a turn it has no record of). */
export function historyOf(s: State): History {
  return s.hist && s.hist.turn === s.turn
    ? s.hist
    : { turn: s.turn, koed: { p1: 0, p2: 0 }, events: [] };
}

/** A Character of `owner` was K.O.'d (it happened: a replaced K.O. is not recorded). */
export function recordKo(d: Draft, owner: PlayerId): void {
  if (!tracksHistory(d.s)) return;
  const h = historyOf(d.s);
  d.s.hist = { ...h, koed: { ...h.koed, [owner]: h.koed[owner] + 1 } };
}

/** `by` activated an Event whose printed cost is `baseCost`. */
export function recordEvent(d: Draft, by: PlayerId, baseCost: number | null): void {
  if (!tracksHistory(d.s)) return;
  const h = historyOf(d.s);
  d.s.hist = { ...h, events: [...h.events, { by, baseCost }] };
}

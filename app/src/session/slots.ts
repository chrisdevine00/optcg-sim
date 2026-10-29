/**
 * Character slots (board.md §3.7): a new Character takes the empty slot nearest the centre (3, then
 * 2, 4, 1, 5), and cards never move when a neighbour leaves. Derived from engine events, so a rewind
 * recomputes the same slots.
 */
import type { GameEvent, InstanceId, PlayerId } from '@optcg/engine';

export type Slots = Record<PlayerId, (InstanceId | null)[]>;

/** Slot indexes (0-based, left to right) in fill order: centre first. */
export const FILL_ORDER = [2, 1, 3, 0, 4] as const;

export function assignSlots(prev: Slots, events: readonly GameEvent[]): Slots {
  const out: Slots = { p1: prev.p1.slice(), p2: prev.p2.slice() };
  for (const e of events) {
    if (e.type !== 'CardMoved') continue;
    const owner = e.owner as PlayerId;
    const row = out[owner];
    if (!row) continue;
    if (e.from === 'characters') {
      const i = row.indexOf(e.instance as InstanceId);
      if (i >= 0) row[i] = null;
    }
    if (e.to === 'characters') {
      const id = e.newInstance as InstanceId;
      const free = FILL_ORDER.find((i) => row[i] === null || row[i] === undefined);
      if (free !== undefined) row[free] = id;
    }
  }
  return out;
}

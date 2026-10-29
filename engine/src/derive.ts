/**
 * Derived values (ARCHITECTURE §2.5): live power, cost and keywords. Never stored; memoized per
 * state object and per card, so repeated queries on one state (legal actions, projection, the AI's
 * evaluation) compute each card once.
 *
 * Layers (rulings D-3, CR 4-9-2, 8-1-3-3-5): (1) highest set-base value; (2) permanent effects,
 * turn player's first (none until M4 scripts them); (3) continuous modifiers from resolved effects;
 * (4) keyword grants; then given DON!! (+1000 each on the owner's turn only, CR 6-5-5-2).
 */
import type { InstanceId } from './api.ts';
import type { Modifier, State } from './state.ts';

export interface Derived {
  power: number | null;
  basePower: number | null;
  cost: number | null;
  keywords: string[];
  cannotBeKOd: boolean;
}

const cache = new WeakMap<State, Map<InstanceId, Derived>>();
const modIndex = new WeakMap<Modifier[], Map<InstanceId, Modifier[]>>();

const ON_FIELD = new Set(['leader', 'characters', 'stage']);

function modsFor(s: State, id: InstanceId): Modifier[] | undefined {
  if (s.mods.length === 0) return undefined;
  let idx = modIndex.get(s.mods);
  if (!idx) {
    idx = new Map();
    for (const m of s.mods) {
      if (!active(s, m)) continue;
      const list = idx.get(m.target);
      if (list) list.push(m);
      else idx.set(m.target, [m]);
    }
    modIndex.set(s.mods, idx);
  }
  return idx.get(id);
}

/** A `whileSource` modifier lasts only while its source stays on the field. */
function active(s: State, m: Modifier): boolean {
  if (m.duration.kind !== 'whileSource') return true;
  const src = s.cards[m.duration.source];
  return src !== undefined && ON_FIELD.has(src.zone);
}

/** Memoized: only for finished (immutable) states. */
export function derive(s: State, id: InstanceId): Derived {
  let per = cache.get(s);
  if (!per) {
    per = new Map();
    cache.set(s, per);
  }
  const hit = per.get(id);
  if (hit) return hit;
  const d = compute(s, id, modsFor(s, id));
  per.set(id, d);
  return d;
}

/** Uncached: for a state that is still being written inside `reduce`. */
export function deriveLive(s: State, id: InstanceId): Derived {
  return compute(
    s,
    id,
    s.mods.filter((m) => m.target === id && active(s, m)),
  );
}

function compute(s: State, id: InstanceId, mods: Modifier[] | undefined): Derived {
  const c = s.cards[id];
  if (!c) throw new Error(`Unknown card instance ${id}`);
  const def = s.defs[c.card]!;

  let basePower = def.power;
  let power: number | null = null;
  let cost = def.cost;
  let keywords = def.keywords;
  let cannotBeKOd = false;
  if (mods && mods.length > 0) {
    let extra = 0;
    let costDelta = 0;
    let grants: string[] | null = null;
    let setBase: number | null = null;
    for (const m of mods) {
      switch (m.kind) {
        case 'basePower':
          // Several base settings: the highest applies (CR 4-9-2-1), replacing the printed value.
          if (setBase === null || m.amount > setBase) setBase = m.amount;
          break;
        case 'power':
          extra += m.amount;
          break;
        case 'cost':
          costDelta += m.amount;
          break;
        case 'grant':
          if (m.keyword && !keywords.includes(m.keyword) && !grants?.includes(m.keyword))
            (grants ??= []).push(m.keyword);
          break;
        case 'cannotBeKOd':
          cannotBeKOd = true;
          break;
      }
    }
    if (basePower !== null && setBase !== null) basePower = setBase;
    if (basePower !== null) power = basePower + extra;
    // Negative intermediate costs carry through the calculation; the result floors at 0 (CR 1-3-6-2).
    if (cost !== null) cost = Math.max(0, cost + costDelta);
    if (grants) keywords = [...keywords, ...grants];
  } else {
    power = basePower;
  }
  if (power !== null && c.don > 0 && c.owner === s.active && ON_FIELD.has(c.zone)) {
    power += 1000 * c.don;
  }
  return { power, basePower, cost, keywords, cannotBeKOd };
}

export const powerOf = (s: State, id: InstanceId): number | null => derive(s, id).power;
export const hasKeyword = (s: State, id: InstanceId, k: string): boolean =>
  derive(s, id).keywords.includes(k);

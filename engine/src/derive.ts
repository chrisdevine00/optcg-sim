/**
 * Derived values (ARCHITECTURE §2.5): live power, cost and keywords. Never stored; memoized per
 * state object and per card, so repeated queries on one state (legal actions, projection, the AI's
 * evaluation) compute each card once.
 *
 * Layers (rulings D-3, CR 4-9-2, 8-1-3-3-5): (1) highest set-base value; (2) permanent effects,
 * turn player's first; (3) continuous modifiers from resolved effects; (4) keyword grants; then
 * given DON!! (+1000 each on the owner's turn only, CR 6-5-5-2).
 *
 * Permanent effects (`kind: 'permanent'`, effects/layers.ts) are never stored: they are computed
 * here in stages, so a permanent effect's condition can read another card's cost, base power or
 * power without a cycle. A stage reads the values of the stages before it (M4b wave 1,
 * docs/research/m4b-runtime-audit.md §2):
 *   1 cost, 2 base power, 3 power, 4 keyword grants, 5 restrictions.
 * A game whose cards have no such permanent skips all of it.
 */
import type { Continuous } from '@optcg/cards';
import type { InstanceId } from './api.ts';
import { computePerms } from './effects/layers.ts';
import type { Modifier, State } from './state.ts';

export interface Derived {
  power: number | null;
  basePower: number | null;
  cost: number | null;
  keywords: string[];
  cannotBeKOd: boolean;
  /** An effect says it cannot attack (OP17-054, OP17-065). */
  cannotAttack: boolean;
  /** Its effects are negated (CR 8-2): abilities and printed keyword effects do nothing. */
  negated: boolean;
  /** "Cannot be removed from the field by your opponent's effects" (OP15-118). */
  removalProof: boolean;
  /** "Your opponent cannot activate [Blocker]" when it attacks (ST21-003, OP07-057). */
  noBlocker: boolean;
}

/** Per-computation memo of the staged permanent layers (see the header). */
export interface LayerMemo {
  perms: Map<number, Map<InstanceId, Modifier[]>>;
  derived: Map<number, Map<InstanceId, Derived>>;
}
export const newMemo = (): LayerMemo => ({ perms: new Map(), derived: new Map() });
export const LAST_STAGE = 5;

/** Does any card of this game carry a permanent effect the layers must compute? */
const layeredDefs = new WeakMap<object, boolean>();
export function layered(s: State): boolean {
  let v = layeredDefs.get(s.defs);
  if (v === undefined) {
    v = Object.values(s.defs).some((d) =>
      d.abilities.some(
        (a) =>
          a.kind === 'permanent' &&
          a.apply.some((c) => !('counter' in c) && !('lockAttackTarget' in c)),
      ),
    );
    layeredDefs.set(s.defs, v);
  }
  return v;
}

const cache = new WeakMap<State, LayerMemo>();
const modIndex = new WeakMap<Modifier[], Map<InstanceId, Modifier[]>>();

const ON_FIELD = new Set(['leader', 'characters', 'stage']);

function modsFor(s: State, id: InstanceId): Modifier[] | undefined {
  if (s.mods.length === 0) return undefined;
  let idx = modIndex.get(s.mods);
  if (!idx) {
    idx = new Map();
    for (const m of s.mods) {
      const list = idx.get(m.target);
      if (list) list.push(m);
      else idx.set(m.target, [m]);
    }
    modIndex.set(s.mods, idx);
  }
  // The index is shared by states with the same modifier list; whether a modifier is active
  // depends on the state, so filter here.
  return idx.get(id)?.filter((m) => active(s, m));
}

/** A `whileSource` modifier lasts only while its source stays on the field. */
function active(s: State, m: Modifier): boolean {
  if (m.duration.kind !== 'whileSource') return true;
  const src = s.cards[m.duration.source];
  return src !== undefined && ON_FIELD.has(src.zone);
}

/**
 * States still being written by a `Draft`. `derive` never memoizes these: a value cached mid-step
 * would go stale when a later operation in the same step changes the card.
 */
export const drafting = new WeakSet<object>();

/** Memoized for finished (immutable) states; live for a state that is still being written. */
export function derive(s: State, id: InstanceId): Derived {
  if (drafting.has(s)) return deriveLive(s, id);
  let memo = cache.get(s);
  if (!memo) {
    memo = newMemo();
    cache.set(s, memo);
  }
  return deriveAt(s, id, LAST_STAGE, memo);
}

/** Uncached: for a state that is still being written inside `reduce`. */
export function deriveLive(s: State, id: InstanceId): Derived {
  return deriveAt(s, id, LAST_STAGE, newMemo(), true);
}

/**
 * The card's values using the permanent layers of stages `1..upto` only (0: modifiers alone).
 * `live`: the state is a draft, so the modifier index is not used.
 */
export function deriveAt(
  s: State,
  id: InstanceId,
  upto: number,
  memo: LayerMemo,
  live = drafting.has(s),
): Derived {
  let per = memo.derived.get(upto);
  if (!per) {
    per = new Map();
    memo.derived.set(upto, per);
  }
  const hit = per.get(id);
  if (hit) return hit;
  let mods = live ? s.mods.filter((m) => m.target === id && active(s, m)) : modsFor(s, id);
  if (upto > 0 && layered(s)) {
    for (let k = 1; k <= upto; k++) {
      const extra = permsAt(s, k, memo, live).get(id);
      if (extra) mods = mods ? [...mods, ...extra] : extra;
    }
  }
  const d = compute(s, id, mods);
  per.set(id, d);
  return d;
}

function permsAt(s: State, stage: number, memo: LayerMemo, live: boolean) {
  let m = memo.perms.get(stage);
  if (!m) {
    m = computePerms(s, stage, memo, live);
    memo.perms.set(stage, m);
  }
  return m;
}

/**
 * `isNegated` skips the permanent layer because no permanent can negate (no `negate` shape in
 * `Continuous`). A permanent negate would make it wrong, so adding one is a compile error here:
 * route negation through `computePerms` first, then remove this guard.
 */
type AllContinuousKeys = Continuous extends infer C ? (C extends unknown ? keyof C : never) : never;
const NO_PERMANENT_NEGATE: 'negate' extends AllContinuousKeys ? never : true = true;
void NO_PERMANENT_NEGATE;

/** Is the card negated by a modifier (CR 8-2)? Cheap: no permanent layer is involved. */
export function isNegated(s: State, id: InstanceId): boolean {
  return s.mods.some((m) => m.kind === 'negate' && m.target === id && active(s, m));
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
  let cannotAttack = false;
  let negated = false;
  let removalProof = false;
  let noBlocker = false;
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
          if (m.keyword && !grants?.includes(m.keyword)) (grants ??= []).push(m.keyword);
          break;
        case 'cannotBeKOd':
          cannotBeKOd = true;
          break;
        case 'cannotAttack':
          cannotAttack = true;
          break;
        case 'negate':
          negated = true;
          break;
        case 'cannotBeRemoved':
          removalProof = true;
          break;
        case 'noBlocker':
          noBlocker = true;
          break;
      }
    }
    // Negation removes printed keyword effects (CR 10-1 keyword effects, 8-2-1-1); keywords
    // granted by effects stay (CR 8-2-4).
    if (negated) keywords = [];
    if (basePower !== null && setBase !== null) basePower = setBase;
    if (basePower !== null) power = basePower + extra;
    // Negative intermediate costs carry through the calculation; the result floors at 0 (CR 1-3-6-2).
    if (cost !== null) cost = Math.max(0, cost + costDelta);
    if (grants) {
      const printed = keywords;
      keywords = [...printed, ...grants.filter((k) => !printed.includes(k))];
    }
  } else {
    power = basePower;
  }
  if (power !== null && c.don > 0 && c.owner === s.active && ON_FIELD.has(c.zone)) {
    power += 1000 * c.don;
  }
  return {
    power,
    basePower,
    cost,
    keywords,
    cannotBeKOd,
    cannotAttack,
    negated,
    removalProof,
    noBlocker,
  };
}

export const powerOf = (s: State, id: InstanceId): number | null => derive(s, id).power;
export const hasKeyword = (s: State, id: InstanceId, k: string): boolean =>
  derive(s, id).keywords.includes(k);

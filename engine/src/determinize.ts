/**
 * Determinization support for AI search (ADR 0005, ARCHITECTURE §4.3). Added in M5a, additive.
 *
 * The AI receives only a player's view. To search, it needs full states that agree with that view:
 * every card it can see where it is, every public fact (modifiers, Once Per Turn marks, the battle,
 * pending effects, the resolution stack) as it is, and a guess for every card it cannot see.
 *
 * - `projectForSearch(state, viewer)` is `project` plus a **skeleton**: the state with every card the
 *   viewer cannot see stripped of its identity (no card id, default flags), every instance id
 *   replaced by a canonical id assigned from public structure alone (player, zone, position), the
 *   RNG removed and projection keys blanked. A reference to a hidden card anywhere outside the zones
 *   (a frame local, a modifier) would say which hidden card it is, so it is replaced by a constant
 *   and the skeleton is marked `opaque`; `determinize` refuses an opaque skeleton.
 * - `determinize(view, fill, cards, seed)` puts a card id on every hidden card (the `fill`, keyed by
 *   the view's positional handles such as `p2.hand.3`), rebuilds the definitions from the card data
 *   and seeds a fresh RNG. Instance ids in the result are the canonical ids; `skeleton.handles` maps
 *   the visible ones back to the view's handles, so a search can answer in view actions.
 *
 * The skeleton is a function of what the viewer may see only: two states that differ by a
 * permutation of hidden cards give the same skeleton (the leak property tests check it).
 */
import type { CardId, CardLookup, GameState, InstanceId, PlayerId } from './api.ts';
import { DefTable } from './defs.ts';
import { INSTANCE_ID } from './draft.ts';
import { canSee, handleFor, project, type ProjectedView } from './project.ts';
import { seedRng } from './rng.ts';
import { other, PLAYERS, type State } from './state.ts';

export interface Skeleton {
  /** The state with canonical ids and hidden identities removed. Opaque: pass it to `determinize`. */
  readonly state: unknown;
  /** Canonical id → the viewer's handle, for every card the viewer can see. */
  readonly handles: Record<string, string>;
  /** Canonical id → the positional handle of a hidden card (`p2.hand.3`), which `fill` keys. */
  readonly hidden: Record<string, string>;
  /** A reference outside the zones points at a hidden card; `determinize` refuses such a skeleton. */
  readonly opaque: boolean;
}

export type SearchView = ProjectedView & { readonly skeleton: Skeleton };

export class CannotDeterminize extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CannotDeterminize';
  }
}

const ZONE_ORDER = ['leader', 'characters', 'stage', 'trash', 'hand', 'life', 'deck'] as const;
const ANY_ID = /\$[a-z0-9]{7}/g;
const HIDDEN_REF = '$hidden0';

/**
 * Cards the viewer can identify: in an open area, looked at or known (`canSee`), being played (a
 * card is revealed when it is paid for, CR 2-7-2), or the viewer's own Life card on a damage
 * decision (they decide on it).
 */
export function seenBy(s: State, viewer: PlayerId): Set<InstanceId> {
  const out = new Set<InstanceId>();
  for (const id of Object.keys(s.cards)) if (canSee(s, id, viewer)) out.add(id);
  for (const f of s.stack) {
    if (f.f === 'play') out.add(f.card);
    if (f.f === 'damage' && f.pending && s.cards[f.pending]?.owner === viewer) out.add(f.pending);
  }
  return out;
}

const canonical = (n: number): string => '$k' + n.toString(36).padStart(6, '0');

/** The search skeleton of `s` for `viewer` (see the file comment). */
export function skeletonOf(s: State, viewer: PlayerId): Skeleton {
  const seen = seenBy(s, viewer);
  const ids = new Map<InstanceId, string>();
  const handles: Record<string, string> = {};
  const hidden: Record<string, string> = {};
  let n = 0;
  const assign = (id: InstanceId, p: PlayerId, zone: string, i: number): void => {
    if (ids.has(id)) return;
    const cid = canonical(n++);
    ids.set(id, cid);
    // The viewer's handle for a card it can see is the one its view and view actions use.
    if (seen.has(id)) handles[cid] = handleFor(viewer, id, s.cards[id]!.key);
    else hidden[cid] = `${p}.${zone}.${i}`;
  };
  for (const p of PLAYERS) {
    const ps = s.players[p];
    for (const zone of ZONE_ORDER) {
      const list = zone === 'leader' ? [ps.leader] : ps[zone];
      list.forEach((id, i) => assign(id, p, zone, i));
    }
  }
  s.resolving.forEach((id, i) => assign(id, s.cards[id]!.owner, 'resolving', i));

  let opaque = false;
  let stale = 0;
  const staleIds = new Map<string, string>();
  const rename = (raw: string): string =>
    raw.replace(ANY_ID, (id) => {
      const c = ids.get(id);
      if (c !== undefined) {
        if (seen.has(id)) return c;
        opaque = true;
        return HIDDEN_REF;
      }
      // An id no card holds any more (a stale reference): keep only its identity.
      let st = staleIds.get(id);
      if (st === undefined) {
        st = '$s' + (stale++).toString(36).padStart(6, '0');
        staleIds.set(id, st);
      }
      return st;
    });
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return rename(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[rename(k)] = walk(x);
      return out;
    }
    return v;
  };

  const cards: State['cards'] = {};
  for (const [id, cid] of ids) {
    const c = s.cards[id]!;
    cards[cid] = seen.has(id)
      ? { ...c, key: '' }
      : {
          card: '',
          owner: c.owner,
          zone: c.zone,
          rested: false,
          faceUp: false,
          don: 0,
          played: -1,
          key: '',
        };
  }
  const zone = (list: InstanceId[]) => list.map((id) => ids.get(id)!);
  const players = {} as State['players'];
  for (const p of PLAYERS) {
    const ps = s.players[p];
    players[p] = {
      ...ps,
      deck: zone(ps.deck),
      hand: zone(ps.hand),
      life: zone(ps.life),
      leader: ids.get(ps.leader)!,
      characters: zone(ps.characters),
      stage: zone(ps.stage),
      trash: zone(ps.trash),
    };
  }
  // The other player's knowledge of cards hidden from the viewer is dropped (what they know is
  // not the viewer's to see); the viewer's own knowledge is visible by definition.
  const known = {
    [viewer]: s.known[viewer].filter((id) => ids.has(id)).map((id) => ids.get(id)!),
    [other(viewer)]: s.known[other(viewer)]
      .filter((id) => seen.has(id) && ids.has(id))
      .map((id) => ids.get(id)!),
  } as State['known'];
  const blankKeys = <T extends { key: string }>(x: T): T => ({ ...x, key: '' });
  const out: State = {
    ...(walk({
      battle: s.battle && { ...s.battle, keys: { attacker: '', target: '' } },
      stack: s.stack,
      decision: s.decision,
      mods: s.mods,
      pending: s.pending.map(blankKeys),
      oncePerTurn: s.oncePerTurn,
      delayed: s.delayed.map(blankKeys),
    }) as Pick<
      State,
      'battle' | 'stack' | 'decision' | 'mods' | 'pending' | 'oncePerTurn' | 'delayed'
    >),
    v: s.v,
    rng: 0,
    idRng: 0,
    turn: s.turn,
    active: s.active,
    first: s.first,
    phase: s.phase,
    defs: {},
    cards,
    players,
    resolving: zone(s.resolving),
    result: s.result,
    nextMod: s.nextMod,
    setup: s.setup,
    renames: [],
    known,
  };
  return { state: out, handles, hidden, opaque };
}

/** `project` plus the search skeleton (see the file comment). */
export function projectForSearch(s: State, viewer: PlayerId): SearchView {
  return { ...project(s, viewer), skeleton: skeletonOf(s, viewer) };
}

/** A second, independent stream for instance ids, as `createGame` derives it. */
const idSeed = (seed: number): number => (Math.imul(seed >>> 0, 2654435761) ^ 0x5bd1e995) >>> 0;

/**
 * A full state that agrees with `view`, with `fill` naming every hidden card (keyed by positional
 * handle, as in the view's zones). Throws `CannotDeterminize` for an opaque skeleton or a missing
 * or unknown fill.
 */
export function determinize(
  view: SearchView,
  fill: Readonly<Record<string, CardId>>,
  cards: CardLookup,
  seed: number,
): GameState {
  const sk = view.skeleton;
  if (sk.opaque)
    throw new CannotDeterminize(
      'A public reference points at a hidden card; search from the view.',
    );
  const s = structuredClone(sk.state) as State;
  for (const [cid, pos] of Object.entries(sk.hidden)) {
    const card = fill[pos];
    if (!card) throw new CannotDeterminize(`No card given for ${pos}.`);
    s.cards[cid] = { ...s.cards[cid]!, card };
  }
  const defs = new DefTable(cards);
  try {
    for (const c of Object.values(s.cards)) defs.get(c.card);
    for (const p of PLAYERS) defs.get(s.setup.leader[p]);
  } catch (e) {
    throw new CannotDeterminize(e instanceof Error ? e.message : String(e));
  }
  s.defs = defs.defs;
  s.rng = seedRng(seed);
  s.idRng = idSeed(seed);
  return s as unknown as GameState;
}

/** True for a canonical or engine instance id (search maps these back to handles). */
export const isInstanceId = (v: string): boolean => INSTANCE_ID.test(v);

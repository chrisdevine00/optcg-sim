/**
 * Atomic operations: the single choke point every state change goes through (ARCHITECTURE §2.4,
 * ADR 0013, effect-dsl E-D3). Rule processing (CR 9-1-2) runs after each operation that can meet a
 * defeat condition, so a defeat lands mid-resolution exactly where the CR puts it.
 *
 * Replacement effects are collected by the frames that call these (the K.O. frame in `flow.ts`),
 * because a "may" replacement has to suspend for a decision. These functions are the final,
 * unreplaceable step.
 */
import type { GameEvent, InstanceId, PlayerId } from '../api.ts';
import { deriveLive } from '../derive.ts';
import type { Draft } from '../draft.ts';
import { shuffle } from '../rng.ts';
import { other, type Cause, type Modifier, type PlayerState, type Zone } from '../state.ts';

const FIELD: ReadonlySet<Zone> = new Set(['leader', 'characters', 'stage']);
/** Zones some player cannot see: a card moving in gets a fresh projection key (ARCHITECTURE §2.7). */
const HIDDEN: ReadonlySet<Zone> = new Set(['deck', 'hand', 'life']);

/** Last-known information captured when a card leaves the field (ARCHITECTURE §2.2). */
export interface Lki {
  card: string;
  owner: PlayerId;
  power: number | null;
  basePower: number | null;
  cost: number | null;
  types: string[];
  don: number;
  rested: boolean;
  cause: Cause;
}

function zoneArray(ps: PlayerState, z: Zone): InstanceId[] | null {
  switch (z) {
    case 'deck':
      return ps.deck;
    case 'hand':
      return ps.hand;
    case 'life':
      return ps.life;
    case 'characters':
      return ps.characters;
    case 'stage':
      return ps.stage;
    case 'trash':
      return ps.trash;
    default:
      return null;
  }
}

export interface MoveOptions {
  /** Ordered zones: 'top' (default for deck, life, trash) or 'bottom' (default for hand, field). */
  position?: 'top' | 'bottom';
  faceUp?: boolean;
  /** Why the card leaves the field; required when it does. */
  cause?: Cause;
  /** The card was revealed (a search, a [Trigger] reveal). */
  revealed?: boolean;
  /** Extra fields for the CardMoved event. */
  extra?: Record<string, unknown>;
}

/**
 * Move one card between zones. Leaving the Character or Stage area makes a new object with a fresh
 * id (CR 3-1-6): modifiers on it fall away, its given DON!! go to the cost area rested (CR 6-5-5-4),
 * and the `renames` list and the event carry old id → new id plus a last-known snapshot.
 */
export function moveCard(d: Draft, id: InstanceId, to: Zone, opts: MoveOptions = {}): InstanceId {
  const c = d.card(id);
  const from = c.zone;
  const wasFaceUp = c.faceUp;
  if (from === 'leader')
    throw new Error('A Leader cannot be moved out of the Leader area (CR 3-6-3).');
  if (to === 'leader') throw new Error('Nothing moves into the Leader area during a game.');
  const owner = c.owner;
  const ps = d.pl(owner);
  // Remove from the source.
  if (from === 'resolving') {
    d.s.resolving = d.s.resolving.filter((x) => x !== id);
  } else {
    const arr = zoneArray(ps, from)!;
    const i = arr.indexOf(id);
    if (i < 0) throw new Error(`Card ${id} is not in ${owner}.${from}`);
    arr.splice(i, 1);
  }

  let lki: Lki | undefined;
  const leavesField = FIELD.has(from);
  if (leavesField) {
    const dv = deriveLive(d.s, id);
    lki = {
      card: c.card,
      owner,
      power: dv.power,
      basePower: dv.basePower,
      cost: dv.cost,
      types: d.s.defs[c.card]!.types,
      don: c.don,
      rested: c.rested,
      cause: opts.cause ?? { kind: 'rule', by: owner },
    };
    if (c.don > 0) {
      ps.donRested += c.don;
      d.emit({ type: 'DonReturned', player: owner, count: c.don, to: 'costRested', from: id });
    }
    dropModifiers(d, id);
  }

  const oldKey = c.key;
  const nid = leavesField ? d.rekey(id) : id;

  const w = d.wcard(nid);
  w.zone = to;
  w.rested = false;
  w.don = 0;
  w.played = -1;
  w.faceUp = to === 'trash' || to === 'resolving' || FIELD.has(to) ? true : (opts.faceUp ?? false);
  if (HIDDEN.has(to) && !w.faceUp) w.key = d.newKey();

  if (to === 'resolving') {
    d.s.resolving = [...d.s.resolving, nid];
  } else {
    const arr = zoneArray(ps, to)!;
    const pos =
      opts.position ?? (to === 'deck' || to === 'life' || to === 'trash' ? 'top' : 'bottom');
    if (pos === 'top') arr.unshift(nid);
    else arr.push(nid);
  }

  const e: GameEvent = {
    type: 'CardMoved',
    card: c.card,
    owner,
    from,
    to,
    instance: id,
    newInstance: nid,
    wasFaceUp,
    faceUp: w.faceUp,
    keys: { [id]: oldKey, [nid]: w.key },
  };
  if (lki) e.lki = lki;
  if (opts.cause) e.cause = opts.cause;
  if (opts.revealed) e.revealed = true;
  if (opts.extra) Object.assign(e, opts.extra);
  d.emit(e);
  if (from === 'deck') touchDeck(d, owner);
  return nid;
}

/** Every way a card leaves the field goes through here (E-D3), with its cause. */
export function leaveField(
  d: Draft,
  id: InstanceId,
  dest: 'trash' | 'hand' | 'deck' | 'life',
  cause: Cause,
  opts: Omit<MoveOptions, 'cause'> = {},
): InstanceId {
  const z = d.card(id).zone;
  if (!FIELD.has(z)) throw new Error(`leaveField: ${id} is not on the field`);
  return moveCard(d, id, dest, { ...opts, cause });
}

function dropModifiers(d: Draft, id: InstanceId): void {
  if (!d.s.mods.some((m) => m.target === id)) return;
  d.s.mods = d.s.mods.filter((m) => m.target !== id);
}

// ---------------------------------------------------------------------------------------------
// Deck, hand and Life
// ---------------------------------------------------------------------------------------------

/** Draw `n` cards one at a time (CR 4-5-3). Each card is checked for deck-out (CR 9-1-2). */
export function draw(d: Draft, p: PlayerId, n: number): void {
  for (let i = 0; i < n && !d.s.result; i++) {
    const deck = d.ro(p).deck;
    if (deck.length === 0) {
      // Drawing from an empty deck: the player has 0 cards in their deck (CR 1-2-1-1-2).
      touchDeck(d, p);
      return;
    }
    moveCard(d, deck[0]!, 'hand', { extra: { reason: 'draw' } });
  }
}

/** Shuffle a deck (CR 3-2-4). Every card in it gets a fresh projection key. */
export function shuffleDeck(d: Draft, p: PlayerId): void {
  const ps = d.pl(p);
  const [order, rng] = shuffle(ps.deck, d.s.rng);
  d.setRng(rng);
  ps.deck = order;
  for (const id of order) d.wcard(id).key = d.newKey();
  d.emit({ type: 'Shuffled', player: p, zone: 'deck' });
}

/** Move the top Life card to its owner's hand without damage (no [Trigger], QA-GR). */
export function lifeToHand(d: Draft, p: PlayerId, n: number): number {
  let moved = 0;
  for (let i = 0; i < n; i++) {
    const top = d.ro(p).life[0];
    if (top === undefined) break;
    moveCard(d, top, 'hand', { extra: { reason: 'life' } });
    moved++;
  }
  return moved;
}

// ---------------------------------------------------------------------------------------------
// Card state
// ---------------------------------------------------------------------------------------------

/** Rest a card. Resting a rested card is not performed (CR 1-3-2-1); returns whether it was. */
export function rest(d: Draft, id: InstanceId): boolean {
  if (d.card(id).rested) return false;
  d.wcard(id).rested = true;
  d.emit({ type: 'Rested', instance: id, card: d.card(id).card });
  return true;
}

export function setActive(d: Draft, id: InstanceId): boolean {
  if (!d.card(id).rested) return false;
  d.wcard(id).rested = false;
  d.emit({ type: 'SetActive', instance: id, card: d.card(id).card });
  return true;
}

// ---------------------------------------------------------------------------------------------
// DON!!
// ---------------------------------------------------------------------------------------------

/** DON!! Phase: place up to `n` from the DON!! deck, active (CR 6-4-1..6-4-3, 3-9-3). */
export function placeDon(d: Draft, p: PlayerId, n: number): number {
  const ps = d.pl(p);
  const k = Math.min(n, ps.donDeck);
  if (k <= 0) return 0;
  ps.donDeck -= k;
  ps.donActive += k;
  d.emit({ type: 'DonPlaced', player: p, count: k });
  return k;
}

/** Give 1 active cost-area DON!! to a Leader or Character (CR 6-5-5-1). */
export function giveDon(d: Draft, p: PlayerId, target: InstanceId): void {
  const ps = d.pl(p);
  if (ps.donActive < 1) throw new Error('No active DON!! to give');
  ps.donActive -= 1;
  d.wcard(target).don += 1;
  d.emit({ type: 'DonGiven', player: p, target, card: d.card(target).card, count: 1 });
}

/** Rest `n` active DON!! in the cost area to pay a cost (CR 2-7-2, 8-3-1-5). */
export function payDon(d: Draft, p: PlayerId, n: number): void {
  if (n <= 0) return;
  const ps = d.pl(p);
  if (ps.donActive < n) throw new Error('Not enough active DON!!');
  ps.donActive -= n;
  ps.donRested += n;
  d.emit({ type: 'DonRested', player: p, count: n });
}

/** Refresh 6-2-3: every DON!! given to the player's cards returns to the cost area rested. */
export function returnGivenDon(d: Draft, p: PlayerId): void {
  const ps = d.ro(p);
  for (const id of [ps.leader, ...ps.characters]) {
    const n = d.card(id).don;
    if (n > 0) {
      d.wcard(id).don = 0;
      d.pl(p).donRested += n;
      d.emit({ type: 'DonReturned', player: p, count: n, to: 'costRested', from: id });
    }
  }
}

/** Refresh 6-2-4: the player's rested Leader, Characters, Stage and cost-area DON!! become active. */
export function untapAll(d: Draft, p: PlayerId): void {
  const ps = d.ro(p);
  for (const id of [ps.leader, ...ps.characters, ...ps.stage]) {
    if (d.card(id).rested) d.wcard(id).rested = false;
  }
  if (ps.donRested > 0) {
    const w = d.pl(p);
    w.donActive += w.donRested;
    w.donRested = 0;
  }
  d.emit({ type: 'Refreshed', player: p });
}

// ---------------------------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------------------------

export function addModifier(d: Draft, m: Omit<Modifier, 'id'>): Modifier {
  const mod: Modifier = { ...m, id: d.s.nextMod };
  d.s.nextMod += 1;
  d.mods().push(mod);
  const e: GameEvent = {
    type: mod.kind === 'power' ? 'PowerModified' : 'ModifierAdded',
    kind: mod.kind,
    target: mod.target,
    amount: mod.amount,
    duration: mod.duration.kind,
  };
  if (mod.keyword) e.keyword = mod.keyword;
  d.emit(e);
  return mod;
}

/**
 * End every modifier matching `pred`: the turn player's first, then the non-turn player's
 * (CR 6-6-1-2, 6-6-1-3, 7-1-5-3/4).
 */
export function expireModifiers(d: Draft, pred: (m: Modifier) => boolean, step: string): void {
  if (!d.s.mods.some(pred)) return;
  const ending = d.s.mods.filter(pred);
  d.s.mods = d.s.mods.filter((m) => !pred(m));
  for (const p of [d.s.active, other(d.s.active)]) {
    for (const m of ending) {
      if (m.controller !== p) continue;
      d.emit({
        type: 'ModifierExpired',
        kind: m.kind,
        target: m.target,
        amount: m.amount,
        duration: m.duration.kind,
        step,
      });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Rule processing (CR 9)
// ---------------------------------------------------------------------------------------------

const deckTouched = new WeakMap<Draft, Set<PlayerId>>();
const damagedAtZero = new WeakMap<Draft, Set<PlayerId>>();

function touchDeck(d: Draft, p: PlayerId): void {
  if (d.ro(p).deck.length > 0) return;
  let set = deckTouched.get(d);
  if (!set) deckTouched.set(d, (set = new Set()));
  set.add(p);
}

/** Leader damaged with 0 Life (CR 1-2-1-1-1). */
export function markDamagedAtZero(d: Draft, p: PlayerId): void {
  let set = damagedAtZero.get(d);
  if (!set) damagedAtZero.set(d, (set = new Set()));
  set.add(p);
}

/**
 * Rule processing: every player meeting a defeat condition now loses (CR 9-2-1). Two losers at one
 * check is `bothLost`. A deck counts as empty for defeat once an operation has touched it, so a
 * scenario may start with an empty deck and loses at its first draw (CR 1-2-1-1-2, 9-1-2).
 */
export function ruleProcessing(d: Draft): void {
  if (d.s.result) return;
  const dt = deckTouched.get(d);
  const dz = damagedAtZero.get(d);
  if (!dt?.size && !dz?.size) return;
  const losers: { p: PlayerId; reason: string }[] = [];
  for (const p of [d.s.active, other(d.s.active)]) {
    if (dz?.has(p)) losers.push({ p, reason: 'damage at 0 Life' });
    else if (dt?.has(p) && d.ro(p).deck.length === 0) losers.push({ p, reason: 'deck out' });
  }
  dt?.clear();
  dz?.clear();
  if (losers.length === 0) return;
  if (losers.length === 2) {
    endGame(d, { draw: 'bothLost' });
  } else {
    const l = losers[0]!;
    endGame(d, { winner: other(l.p), reason: l.reason });
  }
}

export function endGame(d: Draft, result: NonNullable<Draft['s']['result']>): void {
  if (d.s.result) return;
  d.s.result = result;
  d.s.decision = null;
  d.emit({ type: 'GameEnded', result });
}

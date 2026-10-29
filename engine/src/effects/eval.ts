/**
 * Reading a script against a state: selectors and filters (effect-dsl.md §4.4), numbers and
 * conditions (§4.3), cost payability (§4.5, E-D6) and the permanent effects the runtime implements
 * (§4.9: Counter values in hand, attack-target locks). Pure functions of the state.
 */
import type { Cmp, Condition, Cost, Filter, Num, Selector, Zone as SZone } from '@optcg/cards';
import type { InstanceId, PlayerId } from '../api.ts';
import type { Ability } from '../abilities.ts';
import { derive, deriveLive, type Derived } from '../derive.ts';
import { other, type State } from '../state.ts';

export interface Ctx {
  s: State;
  /** Controller of the ability ("you"). */
  you: PlayerId;
  /** Source instance ("this card"). */
  self: InstanceId;
  /** Bound selections. */
  b?: Record<string, InstanceId[]> | undefined;
  /** Accepted `may` labels. */
  did?: string[] | undefined;
  /** The state is a draft being written: derive without the memo. */
  live?: boolean;
}

export const dvOf = (c: Ctx, id: InstanceId): Derived =>
  c.live ? deriveLive(c.s, id) : derive(c.s, id);

const ownersOf = (c: Ctx, owner: Selector['owner']): PlayerId[] =>
  owner === 'you' ? [c.you] : owner === 'opponent' ? [other(c.you)] : [c.you, other(c.you)];

export const rel = (c: Ctx, p: 'you' | 'opponent'): PlayerId =>
  p === 'you' ? c.you : other(c.you);

function zoneIds(c: Ctx, p: PlayerId, z: SZone): InstanceId[] {
  const ps = c.s.players[p];
  switch (z) {
    case 'leader':
      return [ps.leader];
    case 'characters':
      return ps.characters;
    case 'stage':
      return ps.stage;
    case 'field':
      return [ps.leader, ...ps.characters, ...ps.stage];
    case 'hand':
      return ps.hand;
    case 'trash':
      return ps.trash;
    case 'deckTop':
      return ps.deck.slice(0, 1);
    case 'self': {
      const card = c.s.cards[c.self];
      return card && card.owner === p ? [c.self] : [];
    }
    default:
      return [];
  }
}

/** Every instance a selector's zones and filter admit, in canonical order (zone, then id). */
export function pool(c: Ctx, sel: Selector): InstanceId[] {
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  const out: InstanceId[] = [];
  for (const p of ownersOf(c, sel.owner)) {
    for (const z of zones) {
      const ids = zoneIds(c, p, z);
      const ok = sel.filter ? ids.filter((id) => matches(c, id, sel.filter!)) : ids;
      out.push(...(z === 'deckTop' ? ok : ok.slice().sort()));
    }
  }
  return out;
}

/** Is a selector's pool drawn from a zone hidden from the other player (a secret area)? */
export function hiddenPool(sel: Selector): boolean {
  const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
  return zones.some((z) => z === 'hand' || z === 'deckTop');
}

function cmp(c: Ctx, v: number | null, k: Cmp): boolean {
  if (v === null) return false;
  if ('lte' in k) return v <= num(c, k.lte);
  if ('gte' in k) return v >= num(c, k.gte);
  return v === num(c, k.eq);
}

export function matches(c: Ctx, id: InstanceId, f: Filter): boolean {
  const card = c.s.cards[id];
  if (!card) return false;
  const def = c.s.defs[card.card]!;
  if ('category' in f) return f.category.includes(def.category);
  if ('cost' in f) return cmp(c, dvOf(c, id).cost, f.cost);
  if ('baseCost' in f) return cmp(c, def.cost, f.baseCost);
  if ('power' in f) return cmp(c, dvOf(c, id).power, f.power);
  if ('basePower' in f) return cmp(c, dvOf(c, id).basePower, f.basePower);
  if ('hasCounter' in f) return (def.counter ?? 0) > 0 === f.hasCounter;
  if ('type' in f) return def.types.includes(f.type);
  if ('typeIncludes' in f) return def.types.some((t) => t.includes(f.typeIncludes));
  if ('name' in f) return def.name === f.name;
  if ('color' in f) return def.colors.includes(f.color);
  if ('multicolor' in f) return def.colors.length > 1;
  if ('hasTrigger' in f) return def.hasTrigger === f.hasTrigger;
  if ('keyword' in f) return dvOf(c, id).keywords.includes(f.keyword);
  if ('state' in f) return card.rested === (f.state === 'rested');
  if ('isSelf' in f) return (id === c.self) === f.isSelf;
  if ('playedThisTurn' in f) return card.played === c.s.turn;
  if ('ref' in f) return (c.b?.[f.ref] ?? []).includes(id);
  if ('all' in f) return f.all.every((g) => matches(c, id, g));
  if ('any' in f) return f.any.some((g) => matches(c, id, g));
  if ('not' in f) return !matches(c, id, f.not);
  return false;
}

export function donOnField(s: State, p: PlayerId, state?: 'active' | 'rested'): number {
  const ps = s.players[p];
  if (state === 'active') return ps.donActive;
  if (state === 'rested') return ps.donRested;
  return ps.donActive + ps.donRested + givenDon(s, p);
}

export function givenDon(s: State, p: PlayerId): number {
  const ps = s.players[p];
  let n = s.cards[ps.leader]!.don;
  for (const id of ps.characters) n += s.cards[id]!.don;
  return n;
}

export function num(c: Ctx, n: Num): number {
  if (typeof n === 'number') return n;
  const s = c.s;
  if ('count' in n) return pool(c, n.count).length;
  if ('life' in n)
    return n.life === 'both'
      ? s.players.p1.life.length + s.players.p2.life.length
      : s.players[rel(c, n.life)].life.length;
  if ('hand' in n) return s.players[rel(c, n.hand)].hand.length;
  if ('trash' in n) return s.players[rel(c, n.trash)].trash.length;
  if ('deck' in n) return s.players[rel(c, n.deck)].deck.length;
  if ('donOnField' in n) return donOnField(s, rel(c, n.donOnField), n.state);
  if ('donGiven' in n) return givenDon(s, rel(c, n.donGiven));
  if ('turnIndex' in n) {
    const p = rel(c, n.turnIndex);
    return p === s.first ? Math.ceil(s.turn / 2) : Math.floor(s.turn / 2);
  }
  if ('refCount' in n) return (c.b?.[n.refCount] ?? []).filter((id) => s.cards[id]).length;
  if ('refStat' in n) {
    const id = (c.b?.[n.refStat] ?? []).find((x) => s.cards[x]);
    if (!id) return 0;
    const dv = dvOf(c, id);
    return (n.stat === 'cost' ? dv.cost : n.stat === 'power' ? dv.power : dv.basePower) ?? 0;
  }
  if ('sum' in n) return n.sum.reduce((a: number, x) => a + num(c, x), 0);
  return num(c, n.mul[0]) * n.mul[1];
}

export function holds(c: Ctx, k: Condition): boolean {
  const s = c.s;
  if ('yourTurn' in k) return s.active === c.you;
  if ('opponentsTurn' in k) return s.active !== c.you;
  if ('donGiven' in k) return (s.cards[c.self]?.don ?? 0) >= k.donGiven;
  if ('cmp' in k) {
    const [a, op, b] = k.cmp;
    const x = num(c, a);
    const y = num(c, b);
    return op === '<='
      ? x <= y
      : op === '>='
        ? x >= y
        : op === '<'
          ? x < y
          : op === '>'
            ? x > y
            : x === y;
  }
  if ('exists' in k) return pool(c, k.exists).length > 0;
  if ('none' in k) return pool(c, k.none).length === 0;
  if ('leader' in k) return matches(c, s.players[c.you].leader, k.leader);
  if ('self' in k) return matches(c, c.self, k.self);
  if ('ref' in k) return (c.b?.[k.ref] ?? []).some((id) => matches(c, id, k.matches));
  if ('did' in k) return (c.did ?? []).includes(k.did);
  if ('all' in k) return k.all.every((x) => holds(c, x));
  if ('any' in k) return k.any.some((x) => holds(c, x));
  return !holds(c, k.not);
}

export const allHold = (c: Ctx, ks: readonly Condition[] | undefined): boolean =>
  !ks || ks.every((k) => holds(c, k));

// ---------------------------------------------------------------------------------------------
// Costs (CR 8-3-1, effect-dsl §4.5, E-D6)
// ---------------------------------------------------------------------------------------------

export interface PayOptions {
  /** A play cost paid first from active cost-area DON!! (an Event's own cost, CR 2-7-3). */
  playCost?: number;
  /** A card that is no longer in hand by the time the costs are paid (the Event itself). */
  exclude?: InstanceId;
}

/** Can every element of `costs` be paid together (CR 8-3-1-3)? */
export function payable(c: Ctx, costs: readonly Cost[] | undefined, o: PayOptions = {}): boolean {
  const s = c.s;
  const ps = s.players[c.you];
  const play = o.playCost ?? 0;
  if (play > ps.donActive) return false;
  if (!costs || costs.length === 0) return true;
  let returns = 0;
  let rests = 0;
  const handNeeds: { sel: Selector; n: number }[] = [];
  for (const k of costs) {
    if ('donMinus' in k) returns += k.donMinus;
    else if ('returnDon' in k) returns += k.returnDon;
    else if ('restDon' in k) rests += k.restDon === 'any' ? 0 : k.restDon;
    else if ('trash' in k || 'reveal' in k) {
      const sel = 'trash' in k ? k.trash : k.reveal;
      const n = sel.pick && 'exactly' in sel.pick ? sel.pick.exactly : 1;
      handNeeds.push({ sel, n });
    } else if ('restSelf' in k) {
      const me = s.cards[c.self];
      if (!me || me.rested || !['leader', 'characters', 'stage'].includes(me.zone)) return false;
    } else if ('trashSelf' in k) {
      const me = s.cards[c.self];
      if (!me || !['characters', 'stage'].includes(me.zone)) return false;
    } else return false; // not implemented: never payable
  }
  const active = ps.donActive - play;
  if (rests > active) return false;
  if (returns > donOnField(s, c.you) - rests) return false;
  // Hand costs: enough matching cards, other than the card being played.
  const used = new Set<InstanceId>();
  for (const { sel, n } of handNeeds) {
    const cands = pool(c, sel).filter((id) => id !== o.exclude && !used.has(id));
    if (cands.length < n) return false;
    for (const id of cands.slice(0, n)) used.add(id);
  }
  return true;
}

/** Does paying these costs depend on cards hidden from the opponent (a cost paid from hand)? */
export function costIsSecret(costs: readonly Cost[] | undefined): boolean {
  return (costs ?? []).some((k) => 'trash' in k || 'reveal' in k);
}

/** Active cost-area DON!! the costs after index `from` will still need to rest. */
export function reservedActive(costs: readonly Cost[], from: number): number {
  let n = 0;
  for (let i = from; i < costs.length; i++) {
    const k = costs[i]!;
    if ('restDon' in k && k.restDon !== 'any') n += k.restDon;
  }
  return n;
}

// ---------------------------------------------------------------------------------------------
// Permanent effects (§4.9) the runtime implements: Counter values in hand, attack-target locks
// ---------------------------------------------------------------------------------------------

function permanents(s: State, id: InstanceId): Extract<Ability, { kind: 'permanent' }>[] {
  const c = s.cards[id];
  if (!c) return [];
  const out: Extract<Ability, { kind: 'permanent' }>[] = [];
  for (const ab of s.defs[c.card]!.abilities) if (ab.kind === 'permanent') out.push(ab);
  return out;
}

const ON_FIELD = new Set(['leader', 'characters', 'stage']);

/** Field cards of `p` whose permanent effects are valid now (not negated, CR 8-2). */
function liveSources(s: State, p: PlayerId, live: boolean): InstanceId[] {
  const ps = s.players[p];
  return [ps.leader, ...ps.characters, ...ps.stage].filter((id) => {
    const card = s.cards[id]!;
    if (!s.defs[card.card]!.abilities.some((a) => a.kind === 'permanent')) return false;
    return !(live ? deriveLive(s, id) : derive(s, id)).negated;
  });
}

/**
 * A card's current Counter value. In hand, permanent effects may give one (OP17-063, OP17-118);
 * only the highest value applies (CR 2-10-4).
 */
export function counterOf(s: State, id: InstanceId, live = false): number | null {
  const card = s.cards[id];
  if (!card) return null;
  const def = s.defs[card.card]!;
  let best = def.counter && def.counter > 0 ? def.counter : null;
  if (card.zone !== 'hand' || def.category !== 'Character') return best;
  const consider = (src: InstanceId, zone: 'hand' | 'field') => {
    for (const ab of permanents(s, src)) {
      if ((ab.zone ?? 'field') !== zone) continue;
      const c: Ctx = { s, you: s.cards[src]!.owner, self: src, live };
      if (!allHold(c, ab.conditions)) continue;
      for (const ap of ab.apply) {
        if (!('counter' in ap)) continue;
        if (ap.counter.onlyIfNone && (def.counter ?? 0) > 0) continue;
        if (!pool(c, ap.counter.target).includes(id)) continue;
        if (best === null || ap.counter.value > best) best = ap.counter.value;
      }
    }
  };
  consider(id, 'hand');
  for (const src of liveSources(s, card.owner, live)) consider(src, 'field');
  return best;
}

/**
 * The only cards `attacker` may attack, if a permanent lock is active (OP17-044 Captain John);
 * null when no lock applies. Several locks admit the union of their cards (QA-OP17 OP17-044).
 */
export function attackLock(s: State, attacker: PlayerId, live = false): InstanceId[] | null {
  const defender = other(attacker);
  let out: InstanceId[] | null = null;
  for (const src of liveSources(s, defender, live)) {
    if (!ON_FIELD.has(s.cards[src]!.zone)) continue;
    for (const ab of permanents(s, src)) {
      if ((ab.zone ?? 'field') !== 'field') continue;
      const c: Ctx = { s, you: defender, self: src, live };
      if (!allHold(c, ab.conditions)) continue;
      for (const ap of ab.apply) {
        if (!('lockAttackTarget' in ap)) continue;
        if (rel(c, ap.lockAttackTarget.attacker) !== attacker) continue;
        out = [...(out ?? []), ...pool(c, ap.lockAttackTarget.only)];
      }
    }
  }
  return out;
}

/**
 * Reading a script against a state: selectors and filters (effect-dsl.md §4.4), numbers and
 * conditions (§4.3), cost payability (§4.5, E-D6) and the permanent effects the runtime implements
 * (§4.9: Counter values in hand, attack-target locks). Pure functions of the state.
 */
import type { Cmp, Condition, Cost, Filter, Num, Selector, Zone as SZone } from '@optcg/cards';
import type { InstanceId, PlayerId } from '../api.ts';
import type { Ability } from '../abilities.ts';
import {
  derive,
  deriveAt,
  deriveLive,
  isNegated,
  LAST_STAGE,
  newMemo,
  restBlocked,
  type Derived,
  type LayerMemo,
} from '../derive.ts';
import { historyOf } from '../history.ts';
import { other, type Ev, type State } from '../state.ts';

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
  /** Numeric bindings, by name (DON!! rested "this way"). */
  n?: Record<string, number> | undefined;
  /** What the triggering event told the ability: a K.O.'s cause, a count of cards (M6b wave 3). */
  ev?: Ev | undefined;
  /** The card a `power` or `cost` amount is being read for, one target at a time (G34). */
  target?: InstanceId | undefined;
  /** The state is a draft being written: derive without the memo. */
  live?: boolean;
  /**
   * Set while a permanent effect's own conditions and targets are read (effects/layers.ts): values
   * come from the layers below `upto`, so a layer never reads itself.
   */
  lay?: { upto: number; memo: LayerMemo };
}

/**
 * A layer memo shared by the cards one read-only evaluation (`pool`, `matches`, `num`, `holds`)
 * looks at on a draft. `deriveLive` computes without a cache because a draft changes between
 * operations, but nothing is written while a selector or condition is being read, so every card
 * it reads can share one computation of the permanent layers (perf: M4b, DECISIONS 2026-11-16).
 */
let scope: { s: State; memo: LayerMemo } | null = null;

/** Run a read-only evaluation of `c`; draft reads inside it share one layer memo. */
function scoped<T>(c: Ctx, f: () => T): T {
  if (!c.live || c.lay || scope) return f();
  scope = { s: c.s, memo: newMemo() };
  try {
    return f();
  } finally {
    scope = null;
  }
}

export const dvOf = (c: Ctx, id: InstanceId): Derived =>
  c.lay
    ? deriveAt(c.s, id, c.lay.upto, c.lay.memo, c.live)
    : c.live
      ? scope && scope.s === c.s
        ? deriveAt(c.s, id, LAST_STAGE, scope.memo, true)
        : deriveLive(c.s, id)
      : derive(c.s, id);

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
  return scoped(c, () => poolOf(c, sel));
}

function poolOf(c: Ctx, sel: Selector): InstanceId[] {
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
  return scoped(c, () => matchesOf(c, id, f));
}

function matchesOf(c: Ctx, id: InstanceId, f: Filter): boolean {
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
  if ('name' in f) return def.name === f.name || (def.alsoNamed?.includes(f.name) ?? false);
  if ('nameIncludes' in f)
    return (
      def.name.includes(f.nameIncludes) ||
      (def.alsoNamed?.some((n) => n.includes(f.nameIncludes)) ?? false)
    );
  if ('color' in f) return def.colors.includes(f.color);
  if ('attribute' in f) return def.attributes.includes(f.attribute);
  if ('multicolor' in f) return def.colors.length > 1;
  if ('hasTrigger' in f) return def.hasTrigger === f.hasTrigger;
  if ('keyword' in f) return dvOf(c, id).keywords.includes(f.keyword);
  if ('state' in f) return card.rested === (f.state === 'rested');
  if ('isSelf' in f) return (id === c.self) === f.isSelf;
  if ('playedThisTurn' in f) return card.played === c.s.turn;
  if ('donGiven' in f) return cmp(c, card.don, f.donGiven);
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
  return scoped(c, () => numOf(c, n));
}

function numOf(c: Ctx, n: Num): number {
  if (typeof n === 'number') return n;
  const s = c.s;
  if ('count' in n) {
    const ids = pool(c, n.count);
    if (!n.distinctNames) return ids.length;
    // The number of different card names (G15): a name counts once however many cards carry it.
    return new Set(ids.map((id) => s.defs[s.cards[id]!.card]!.name)).size;
  }
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
  if ('refCount' in n)
    return c.n?.[n.refCount] ?? (c.b?.[n.refCount] ?? []).filter((id) => s.cards[id]).length;
  if ('refStat' in n) {
    const id = (c.b?.[n.refStat] ?? []).find((x) => s.cards[x]);
    if (!id) return 0;
    if (n.stat === 'donGiven') return s.cards[id]!.don;
    const dv = dvOf(c, id);
    return (n.stat === 'cost' ? dv.cost : n.stat === 'power' ? dv.power : dv.basePower) ?? 0;
  }
  // The DON!! given to the card this amount is read for (G34); 0 outside a power or cost action.
  // The current power of the card this amount is read for (B4T-R1), floored at 0 (CR 4-12-2).
  if ('targetPower' in n)
    return c.target && s.cards[c.target] ? Math.max(0, dvOf(c, c.target).power ?? 0) : 0;
  if ('donGivenToTarget' in n) return (c.target && s.cards[c.target]?.don) || 0;
  if ('sum' in n) return n.sum.reduce((a: number, x) => a + num(c, x), 0);
  // "For every 5 cards in your trash" (G23): the whole number of times it fits.
  if ('div' in n) return Math.floor(num(c, n.div[0]) / n.div[1]);
  // The number of cards the triggering event moved (G22); 0 for an ability that has no such event.
  if ('eventCount' in n) return c.ev?.n ?? 0;
  return num(c, n.mul[0]) * n.mul[1];
}

export function holds(c: Ctx, k: Condition): boolean {
  return scoped(c, () => holdsOf(c, k));
}

function holdsOf(c: Ctx, k: Condition): boolean {
  const s = c.s;
  if ('yourTurn' in k) return s.active === c.you;
  if ('opponentsTurn' in k) return s.active !== c.you;
  if ('donGiven' in k) {
    // `[DON!! xN] [On K.O.]`: the card is in the trash by the time it resolves, where its DON!! have
    // gone back to the cost area, so it reads what it had when it left the field (OP14-051).
    const had = c.ev?.don;
    return (had !== undefined ? had : (s.cards[c.self]?.don ?? 0)) >= k.donGiven;
  }
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
  if ('koCause' in k) {
    // The K.O. that triggered this ability (G28): its cause, read for the K.O.'d card's controller.
    const cause = c.ev?.cause;
    if (!cause) return false;
    if (k.koCause === 'opponentEffect') return cause.kind === 'effect' && cause.by !== c.you;
    return cause.kind === 'effect' || cause.kind === 'cost';
  }
  if ('koedThisTurn' in k) return historyOf(s).koed[rel(c, k.koedThisTurn)] > 0;
  if ('eventsActivatedThisTurn' in k) {
    const by = rel(c, k.eventsActivatedThisTurn);
    const bc = k.baseCost;
    return historyOf(s).events.some((e) => e.by === by && (!bc || cmp(c, e.baseCost, bc)));
  }
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
  // "A or B" (G19): payable when the costs are payable with some alternative.
  const alt = costs.findIndex((k) => 'oneOf' in k);
  if (alt >= 0) {
    const k = costs[alt] as Extract<Cost, { oneOf: unknown }>;
    const rest = costs.filter((_, i) => i !== alt);
    return k.oneOf.some((a) => payable(c, [...rest, ...a], o));
  }
  let returns = 0;
  let activeReturns = 0;
  let rests = 0;
  let lifeNeeds = 0;
  let millNeeds = 0;
  const restNeeds: { sel: Selector; n: number }[] = [];
  const handNeeds: { sel: Selector; n: number }[] = [];
  for (const k of costs) {
    if ('donMinus' in k) returns += k.donMinus;
    else if ('returnDon' in k) {
      // The object form returns active cost-area DON!! only (G9).
      const n = typeof k.returnDon === 'number' ? k.returnDon : k.returnDon.n;
      returns += n;
      if (typeof k.returnDon !== 'number') activeReturns += n;
    } else if ('giveDon' in k) {
      if ('from' in k.giveDon && k.giveDon.from === 'opponent') {
        // The opponent's rested DON!! go to the opponent's cards (G20): nothing of yours is spent.
        if (s.players[other(c.you)].donRested < k.giveDon.n) return false;
      } else {
        // Active cost-area DON!! go to a card (G7): they leave the cost area like a rested one.
        rests += k.giveDon.n;
      }
      if (pool(c, k.giveDon.to).length < 1) return false;
    } else if ('ko' in k) {
      // A protected Character may still be chosen; the K.O. then fails and the effect with it
      // (RL-16), so the pool is not narrowed here.
      const n = k.ko.pick && 'exactly' in k.ko.pick ? k.ko.pick.exactly : 1;
      if (pool(c, k.ko).length < n) return false;
    } else if ('restDon' in k) rests += k.restDon === 'any' ? 0 : k.restDon;
    else if ('trash' in k || 'reveal' in k) {
      const sel = 'trash' in k ? k.trash : k.reveal;
      const n = sel.pick && 'exactly' in sel.pick ? sel.pick.exactly : 1;
      if (!hiddenPool(sel) && 'trash' in k) {
        // Your own Characters or Stage (G1): enough of them match.
        if (pool(c, sel).length < n) return false;
      } else handNeeds.push({ sel, n });
    } else if ('lifeToHand' in k) lifeNeeds += k.lifeToHand.n;
    else if ('trashLife' in k) lifeNeeds += k.trashLife;
    else if ('turnLifeFaceUp' in k) {
      // The top Life card is turned: it must be there and face-down.
      const top = ps.life.slice(0, k.turnLifeFaceUp);
      if (top.length < k.turnLifeFaceUp || top.some((id) => s.cards[id]!.faceUp)) return false;
    } else if ('turnLifeFaceDown' in k) {
      // The mirror: the top Life cards must be there and face-up (G8).
      const top = ps.life.slice(0, k.turnLifeFaceDown);
      if (top.length < k.turnLifeFaceDown || top.some((id) => !s.cards[id]!.faceUp)) return false;
    } else if ('mill' in k) millNeeds += k.mill;
    else if ('rest' in k)
      restNeeds.push({
        sel: k.rest,
        n: k.rest.pick && 'exactly' in k.rest.pick ? k.rest.pick.exactly : 1,
      });
    else if ('move' in k) {
      const n = k.move.pick && 'exactly' in k.move.pick ? k.move.pick.exactly : 1;
      if (pool(c, k.move).length < n) return false;
    } else if ('restSelf' in k) {
      const me = s.cards[c.self];
      if (!me || me.rested || !['leader', 'characters', 'stage'].includes(me.zone)) return false;
      // A card that cannot be rested cannot pay "rest this Character" (rules-digest 57).
      if (restBlocked(dvOf(c, c.self), me.owner, 'cost')) return false;
    } else if ('trashSelf' in k) {
      const me = s.cards[c.self];
      if (!me || !['characters', 'stage'].includes(me.zone)) return false;
    } else return false; // not implemented: never payable
  }
  if (ps.life.length < lifeNeeds || ps.deck.length < millNeeds) return false;
  const active = ps.donActive - play;
  if (rests > active) return false;
  for (const { sel, n } of restNeeds) {
    // Only an active card can be rested (CR 1-3-2-1); DON!! in the cost area count when named.
    const zones = Array.isArray(sel.from) ? sel.from : [sel.from];
    const cards = pool(c, { ...sel, from: zones.filter((z) => z !== 'donCostArea') }).filter(
      (id) => !s.cards[id]!.rested && !restBlocked(dvOf(c, id), s.cards[id]!.owner, 'cost'),
    );
    const don = zones.includes('donCostArea') ? Math.max(0, active - rests) : 0;
    if (cards.length + don < n) return false;
  }
  if (activeReturns > 0 && rests + activeReturns > active) return false;
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
  // A trash cost from your own Characters or Stage is paid from public cards (G1).
  return (costs ?? []).some(
    (k) =>
      ('trash' in k && hiddenPool(k.trash)) ||
      'reveal' in k ||
      ('oneOf' in k && k.oneOf.some((a) => costIsSecret(a))),
  );
}

/** Active cost-area DON!! the costs after index `from` will still need to rest. */
export function reservedActive(costs: readonly Cost[], from: number): number {
  let n = 0;
  for (let i = from; i < costs.length; i++) {
    const k = costs[i]!;
    if ('restDon' in k && k.restDon !== 'any') n += k.restDon;
    // Later costs that need active DON!! of their own (G7, G9).
    else if ('giveDon' in k && !('from' in k.giveDon)) n += k.giveDon.n;
    else if ('returnDon' in k && typeof k.returnDon !== 'number') n += k.returnDon.n;
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
function liveSources(s: State, p: PlayerId, _live: boolean): InstanceId[] {
  const ps = s.players[p];
  return [ps.leader, ...ps.characters, ...ps.stage].filter((id) => {
    const card = s.cards[id]!;
    if (!s.defs[card.card]!.abilities.some((a) => a.kind === 'permanent')) return false;
    return !isNegated(s, id);
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

// ---------------------------------------------------------------------------------------------
// Restrictions and discounts on a player (M4b wave 1)
//
// A restriction on a player ("you cannot play Character cards with a base cost of 5 or more during
// this turn", "you cannot draw cards using your own effects") and a pending one-shot discount ("the
// next time you play [Trafalgar Law] ... the cost will be reduced by 2") are modifiers on that
// player's Leader, which never leaves the field, so they expire with the same durations as any other.
// ---------------------------------------------------------------------------------------------

function leaderMods(
  s: State,
  p: PlayerId,
  kind: 'cannotDraw' | 'cannotPlay' | 'playCost' | 'cannotSetDon',
) {
  const leader = s.players[p].leader;
  return s.mods.filter((m) => m.kind === kind && m.target === leader);
}

/**
 * "You cannot set DON!! cards as active using Character effects" is in force for `p` (G21): an
 * effect whose source is a Character, of either player, cannot set `p`'s DON!! active. Effects of
 * Leaders, Stages and Events are not stopped, and neither is the Refresh Phase.
 */
export const cannotSetDonByCharacter = (s: State, p: PlayerId): boolean =>
  leaderMods(s, p, 'cannotSetDon').length > 0;

/** "Cannot draw cards using your own effects" is in force for `p`. */
export const cannotDrawByEffect = (s: State, p: PlayerId): boolean =>
  leaderMods(s, p, 'cannotDraw').length > 0;

/**
 * Is `p` barred from playing this card (a `cannotPlay` filter matches it)? Plays by any means,
 * unless the restriction says `from: 'hand'`: then only while the card is in the hand.
 */
export function playBlocked(s: State, p: PlayerId, card: InstanceId): boolean {
  const leader = s.players[p].leader;
  return leaderMods(s, p, 'cannotPlay').some(
    (m) =>
      m.filter &&
      (m.from !== 'hand' || s.cards[card]?.zone === 'hand') &&
      matches({ s, you: p, self: leader, live: true }, card, m.filter),
  );
}

/**
 * What `p` pays to play this card from hand: its current cost, changed by the pending one-shot
 * discounts that match it. `used` are the discounts that applied (they are spent when it is paid).
 */
export function playCostOf(
  s: State,
  p: PlayerId,
  card: InstanceId,
  live = false,
): { cost: number; used: number[] } {
  const base = (live ? deriveLive(s, card) : derive(s, card)).cost ?? 0;
  const leader = s.players[p].leader;
  let delta = 0;
  const used: number[] = [];
  for (const m of leaderMods(s, p, 'playCost')) {
    if (m.filter && !matches({ s, you: p, self: leader, live }, card, m.filter)) continue;
    delta += m.amount;
    used.push(m.id);
  }
  return { cost: Math.max(0, base + delta), used };
}

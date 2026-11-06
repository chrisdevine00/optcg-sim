/**
 * Fast, sound bounds for `public` lethal (L-03, round 2). Two pieces:
 *
 * 1. **What the attacker's cards can add** (`reachOf`, `attackerPotential`): the most attacks, the
 *    most power per attack and the most DON!! a seat could ever reach, read from the typed scripts of
 *    every card it can reach (hand, Leader, Characters, Stage, and its trash when a script plays or
 *    moves cards). Every number is an **over-estimate**; a card the reading cannot classify (an op or
 *    a value it does not know) makes `attackerPotential` return `null`, and the caller falls back to
 *    search. Card text is never read.
 *
 * 2. **A refutation without search** (`refutedByBound`). Under the worst-case model every hidden card
 *    in the defender's hand can be a plain +P Counter (a mode the placeholder always has, no cost).
 *    Ignoring everything else the defender has (Blockers, on-board effects, the cards each hit
 *    gives it) only weakens it, so a lethal that fails against this reduced defender fails against
 *    the full one. The reduced defender is an **online** strategy: it stops an attack when stopping
 *    it costs at most `t = floor(H / k)` cards, where `k = m - R + 1` attacks must be stopped to deny
 *    the `R` landed attacks lethal out of `m` possible. Each stop costs at most `t` cards, so `k`
 *    stops fit in `H`. What is left for the attacker is `R` attacks each of at least `L + P*t`
 *    (the Leader's power plus what `t` cards add); if even the best `R` attackers cannot all get
 *    there with the DON!! the seat can reach, there is no lethal.
 *
 * Blockers: each active Blocker of theirs (not counted if an attacker is [Unblockable], and minus the
 * Blockers the scripts can remove or bar) stops one attack at no cost, so `free` stops come off `k`, and
 * the attacker needs `need + free` attacks that each get past `t` cards: the defender counters an
 * attack costing at most `t` cards and blocks the others, so it lands at most `need - 1` otherwise.
 * An attack spent to K.O. a Blocker removes one stop and one attack, which changes nothing.
 *
 * Neither piece decides "proven": a proof needs an upper bound on defence (`provenByBound`, below).
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import { legalActions, queries, type GameState, type PlayerId } from '@optcg/engine';

type Loose = Record<string, unknown>;

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** How many cards a selector can take: its `pick` count, 1 if none, 5 if it takes "all". */
function pickCount(sel: unknown): number {
  const pick = (sel as { pick?: Record<string, unknown> } | undefined)?.pick;
  if (!pick) return 1;
  if (typeof pick.upTo === 'number') return pick.upTo;
  if (typeof pick.exactly === 'number') return pick.exactly;
  return 5;
}

export interface Reach {
  /** Attacks a script can add: cards it untaps, plays, or gives [Rush]. */
  extra: number;
  doubleAttack: boolean;
}

const reachMemo = new Map<string, Reach>();

/**
 * What a card's script (typed data, not text) can add to the attacks of a turn: an untap
 * (`setActive`), a card played (`play`), a [Rush] granted (`grant`, as an effect or as a permanent
 * ability), each as many cards as its pick allows (a `forEach` counts as 5), plus whether it grants
 * [Double Attack].
 */
export function reachOf(cardId: string): Reach {
  let r = reachMemo.get(cardId);
  if (!r) {
    r = { extra: 0, doubleAttack: false };
    const reach = r;
    const grant = (g: Loose | undefined, mult: number): void => {
      if (!g) return;
      if (g.keyword === 'Rush') reach.extra += mult * pickCount(g.target);
      if (g.keyword === 'Double Attack') reach.doubleAttack = true;
    };
    const walk = (n: unknown, mult: number): void => {
      if (Array.isArray(n)) return n.forEach((x) => walk(x, mult));
      if (!n || typeof n !== 'object') return;
      const o = n as Loose;
      const m = 'forEach' in o ? mult * 5 : mult;
      if (o.do && typeof o.do === 'object') {
        const d = o.do as Record<string, Record<string, unknown>>;
        if (d.setActive) reach.extra += m * pickCount(d.setActive);
        if (d.play) reach.extra += m * pickCount(d.play.what);
        grant(d.grant, m);
      }
      // A permanent ability's continuous `grant` (also inside `tiers`).
      if (o.grant && typeof o.grant === 'object' && !('do' in o) && 'keyword' in (o.grant as Loose))
        grant(o.grant as Loose, m);
      for (const v of Object.values(o)) walk(v, m);
    };
    walk(SCRIPTS[cardId]?.abilities, 1);
    reachMemo.set(cardId, reach);
  }
  return r;
}

/**
 * How many times a card's scripts can take one of the seat's own Characters off the board in a turn
 * (a move to hand from `characters` or `stage` of any owner, a K.O. that is not aimed only at the
 * opponent, a cost that trashes itself), so that it can be played again: a card that bounced a
 * Character can play its [On Play] twice (review round 3, OP17-056 and X.Drake). Never fails: a
 * form it does not know counts as nothing here (the full scan fails on unknown ops).
 */
export function bouncesOf(cardId: string, don: number, isEvent: boolean): number {
  let total = 0;
  for (const ab of (SCRIPTS[cardId]?.abilities ?? []) as unknown as Loose[]) {
    if (ab.kind !== 'activate' && ab.kind !== 'auto') continue;
    const timings = (Array.isArray(ab.when) ? ab.when : [ab.when]) as unknown[];
    if (ab.kind === 'activate' && timings.every((w) => w === 'counter')) continue;
    let mult = 1;
    if (ab.kind === 'activate' && ab.oncePerTurn !== true && !isEvent) mult = don + 1;
    else if (ab.kind === 'auto' && ab.oncePerTurn !== true) mult = 10;
    const cost = (ab.cost ?? []) as Loose[];
    if (cost.some((c) => 'trashSelf' in c)) total += mult;
    const walk = (n: unknown, m: number): void => {
      if (Array.isArray(n)) return n.forEach((x) => walk(x, m));
      if (!n || typeof n !== 'object') return;
      const o = n as Loose;
      const k = 'forEach' in o ? m * 5 : m;
      if (o.do && typeof o.do === 'object' && !Array.isArray(o.do)) {
        const d = o.do as Record<string, Loose>;
        if (d.move) {
          const w = d.move.what as { from?: unknown; owner?: unknown } | undefined;
          const from = (Array.isArray(w?.from) ? w.from : [w?.from]) as unknown[];
          // Off the board, or out of the trash into the hand (an Event or a Character used twice).
          if (
            w?.owner !== 'opponent' &&
            from.some((z) => z === 'characters' || z === 'stage' || z === 'trash')
          )
            total += k * pickCount(w);
        }
        if (d.ko && (d.ko as Loose).owner !== 'opponent') total += k * pickCount(d.ko);
      }
      for (const v of Object.values(o)) walk(v, k);
    };
    walk(ab.effect, mult);
    walk(ab.instead, mult);
  }
  return total;
}

const deckMemo = new Map<string, boolean>();

/**
 * Can this card's script bring a card from the seat's own deck into play or hand: a draw, a look at
 * the top (with a take), a move or play from the deck or from what was looked at? Such a card makes
 * the attackers it could find unknowable unless the deck is known (L-12).
 */
export function reachesDeck(cardId: string): boolean {
  let r = deckMemo.get(cardId);
  if (r === undefined) {
    r = false;
    const walk = (n: unknown): void => {
      if (r || !n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(walk);
      const o = n as Loose;
      if (o.do && typeof o.do === 'object' && !Array.isArray(o.do)) {
        const d = o.do as Record<string, Loose>;
        if ('draw' in d || 'lookAtTop' in d) r = true;
        for (const op of ['move', 'play'])
          if (d[op]) {
            const from = ((d[op]!.what ?? d[op]) as Loose | undefined)?.from;
            const zones = (Array.isArray(from) ? from : [from]) as unknown[];
            if (zones.some((z) => z === 'deckTop' || z === 'looked' || z === 'deck')) r = true;
          }
      }
      for (const v of Object.values(o)) walk(v);
    };
    walk(SCRIPTS[cardId]?.abilities);
    deckMemo.set(cardId, r);
  }
  return r;
}

/**
 * The most attacks `attacker` can make on the Leader this turn and whether any can be a Double
 * Attack: its attackers now, plus every Character in its hand with printed [Rush], plus what the
 * scripts of every card it can reach add (`reachOf`). Conservative: it can only err high.
 *
 * A card that draws or searches can bring in a Rush Character (L-12). With `deckKnown` (the full
 * state: review, open hands) the real deck is counted as if all of it could be reached; without it
 * (the player's own deck is hidden in `public`, where a draw finds a blank: A3), the deck is not
 * counted and `drawsIgnored` says so, so the caller can word the answer "from what you hold".
 */
export function attackReach(
  s: GameState,
  attacker: PlayerId,
  cards: ReadonlyMap<string, Card>,
  deckKnown = true,
): { n: number; da: boolean; drawsIgnored: boolean } {
  const def = other(attacker);
  const leader = queries.zone(s, def, 'leader')[0]!.instance;
  let n = 0;
  let da = false;
  let deckReach = false;
  const seen = new Set<string>();
  for (const a of legalActions(s))
    if (a.type === 'attack' && a.target === leader && !seen.has(a.attacker)) {
      seen.add(a.attacker);
      n++;
      if (queries.card(s, a.attacker).keywords.includes('Double Attack')) da = true;
    }
  const count = (z: string, c: { card: string; keywords: string[] }): void => {
    const r = reachOf(c.card);
    n += r.extra;
    if (r.doubleAttack || c.keywords.includes('Double Attack')) da = true;
    if (z !== 'deck' && reachesDeck(c.card)) deckReach = true;
    if (
      (z === 'hand' || z === 'deck') &&
      cards.get(c.card)?.category === 'Character' &&
      c.keywords.includes('Rush')
    )
      n++;
  };
  for (const z of ['hand', 'leader', 'characters', 'stage'] as const)
    for (const c of queries.zone(s, attacker, z)) count(z, c);
  if (deckReach && deckKnown) for (const c of queries.zone(s, attacker, 'deck')) count('deck', c);
  // A Character taken off the board can be played again, and attack again only with [Rush] (printed,
  // or given or played by a script, which `reachOf` counted above).
  const don = queries.don(s, attacker);
  let bounces = 0;
  let rushy = false;
  for (const z of ['hand', 'leader', 'characters', 'stage'] as const)
    for (const c of queries.zone(s, attacker, z)) {
      bounces += bouncesOf(
        c.card,
        don.active + don.rested,
        cards.get(c.card)?.category === 'Event',
      );
      if (c.keywords.includes('Rush') || reachOf(c.card).extra > 0) rushy = true;
    }
  if (rushy) n += bounces;
  return { n, da, drawsIgnored: deckReach && !deckKnown };
}

// ---------------------------------------------------------------------------------------------
// What the attacker's scripts can add to one attack.

/** Ops that cannot add power, DON!!, attacks or take away the defender's Counters. */
const NEUTRAL_OPS = new Set([
  'draw',
  'lookAtTop',
  'reveal',
  'ko',
  'rest',
  'returnDon',
  'select',
  'cost',
  'playCost',
  // `restrict` (only the attack-side kinds), `trashFromHand` (its owner decides: the defender's hand
  // shrinks, `handLoss`) and `move` (where from) are checked in `scanAbility`.
  // counted in `reachOf`
  'setActive',
  'play',
  'grant',
]);

/** A finite over-estimate of a `Num`. */
function numBound(n: unknown): number {
  if (typeof n === 'number') return Math.abs(n);
  if (!n || typeof n !== 'object') return 100_000;
  const o = n as Loose;
  if ('mul' in o) {
    const [a, k] = o.mul as [unknown, number];
    return numBound(a) * Math.abs(k);
  }
  if ('sum' in o) return (o.sum as unknown[]).reduce<number>((t, x) => t + numBound(x), 0);
  if ('count' in o || 'hand' in o) return 20;
  if ('life' in o) return 6;
  if ('trash' in o || 'deck' in o) return 50;
  if ('donOnField' in o || 'donGiven' in o) return 10;
  if ('turnIndex' in o) return 30;
  if ('refCount' in o) return 10;
  if ('refStat' in o) return 20_000;
  return 100_000;
}

export interface Potential {
  /** Attackers that can hit the Leader, then padding for extra attacks, strongest first. */
  powers: number[];
  /** Most attacks that can land. */
  n: number;
  /** Double Attack can happen. */
  da: boolean;
  /** DON!! that could go onto attackers. */
  don: number;
  /** Most power a permanent ability can add to each attack (over-estimated; it applies to all of them). */
  gain: number;
  /** Most power the abilities used over the turn can add in all, spread over any attacks (over-estimated). */
  gainTotal: number;
  /** Most cards the scripts can take from the other player's hand. */
  handLoss: number;
  /** Most of their Blockers the scripts can remove or bar (Infinity: a permanent that bars blocking). */
  blockerLoss: number;
  /** An attacker has [Unblockable] (printed or given): their Blockers are not counted. */
  unblockable: boolean;
}

interface Scan {
  /** Power a permanent ability can give each attacker (applies to every one of them). */
  gain: number;
  /** Power the abilities that are used (each use boosts its targets once) can add in all, over the turn. */
  gainTotal: number;
  addDonActive: number;
  addDonRested: number;
  giveDon: boolean;
  reachTrash: boolean;
  /** Cards a script can take from the other player's hand (their Counters shrink with it). */
  handLoss: number;
  /** Their Blockers the scripts can remove (K.O., rest, move away, negate, or bar blocking). */
  blockerLoss: number;
  /** How often one use of an ability can be repeated by taking its Character off the board and playing it again. */
  replay: number;
}

/** Add the most one ability can add to a single attack; `false`: an op or form the scan does not know. */
export function scanAbility(
  a: Loose,
  attacks: number,
  don: number,
  sc: Scan,
  isEvent = false,
): boolean {
  if (!['trigger', 'activate', 'auto', 'permanent', 'replacement'].includes(a.kind as string))
    return false;
  if (a.kind === 'trigger') return true; // a Trigger never fires from a hand or the board of an attacker's turn
  // A [Counter] ability is for the other player's attack: the attacker's own Counters are not played in its turn.
  const timings = (Array.isArray(a.when) ? a.when : [a.when]) as unknown[];
  if (a.kind === 'activate' && timings.every((w) => w === 'counter')) return true;
  // How often the ability can apply to one attack.
  let mult = 1;
  if (a.kind === 'activate') {
    if (a.oncePerTurn !== true && !isEvent) {
      const cost = (a.cost ?? []) as Loose[];
      const limited = cost.some(
        (c) => 'restSelf' in c || 'trashSelf' in c || 'restDon' in c || 'donMinus' in c,
      );
      if (!limited) return false;
      mult = don + 1;
    }
  } else if (a.kind === 'auto') {
    const when = (Array.isArray(a.when) ? a.when : [a.when]) as unknown[];
    const named = (w: unknown, ...names: string[]): boolean =>
      typeof w === 'string' && names.includes(w);
    if (a.oncePerTurn === true) mult = 1;
    else if (when.every((w) => named(w, 'onPlay', 'startOfYourTurn', 'startOfGame'))) mult = 1;
    else if (when.every((w) => named(w, 'whenAttacking', 'onOpponentAttack', 'onBlock', 'onKO')))
      mult = attacks;
    else mult = 10; // event-driven autos (a card played, a Life card removed, DON!! returned ...)
  }
  if (a.kind === 'auto' || a.kind === 'activate') mult *= sc.replay;
  let ok = true;
  const step = (n: unknown, m: number): void => {
    if (!ok) return;
    if (Array.isArray(n)) return n.forEach((x) => step(x, m));
    if (!n || typeof n !== 'object') return;
    const o = n as Loose;
    let k = m;
    if ('forEach' in o) k = m * Math.max(1, numBound(o.forEach));
    if (o.do && typeof o.do === 'object' && !Array.isArray(o.do)) {
      for (const [op, body] of Object.entries(o.do as Loose)) {
        if (op === 'power') {
          // Only power that can reach an attacker or lower their Leader counts: a boost to the
          // other player's cards, or a cut to cards that are not their Leader, cannot.
          const b = body as { target?: { owner?: unknown; from?: unknown }; amount: unknown };
          const owner = b.target?.owner;
          const from = (
            Array.isArray(b.target?.from) ? b.target?.from : [b.target?.from]
          ) as unknown[];
          const cutsLeader = from.some((z) => z !== 'characters' && z !== 'stage');
          const raises = typeof b.amount !== 'number' || b.amount > 0;
          const lowers = typeof b.amount !== 'number' || b.amount < 0;
          if (owner === 'you') {
            // Boosts to its own cards: each use gives its targets the amount once, shared out.
            if (raises) sc.gainTotal += k * numBound(b.amount) * pickCount(b.target);
          } else if (owner !== 'opponent' || (lowers && cutsLeader)) {
            // A cut to their Leader may last past one battle: it counts for every attack.
            sc.gain += k * numBound(b.amount);
          }
        } else if (op === 'addDon') {
          for (const e of body as { n: number; state: string }[])
            if (e.state === 'active') sc.addDonActive += k * e.n;
            else sc.addDonRested += k * e.n;
        } else if (op === 'giveDon') sc.giveDon = true;
        else if (op === 'play') sc.reachTrash = true;
        else if (op === 'ko' || op === 'rest') {
          // Aimed at their Characters it can remove a Blocker (rest: it cannot block while rested).
          if ((body as { owner?: unknown }).owner !== 'you') sc.blockerLoss += k * pickCount(body);
        } else if (op === 'move') {
          // A move that could take cards out of the other player's hand or Life is not classified.
          const w = (body as { what?: { from?: unknown } }).what;
          const from = (Array.isArray(w?.from) ? w.from : [w?.from]) as unknown[];
          if (
            !from.every((z) =>
              ['characters', 'stage', 'trash', 'deckTop', 'deck', 'looked'].includes(z as string),
            )
          )
            ok = false;
          sc.reachTrash = true;
          if (
            w &&
            (w as { owner?: unknown }).owner !== 'you' &&
            from.some((z) => z === 'characters')
          )
            sc.blockerLoss += k * pickCount(w);
        } else if (op === 'trashFromHand') {
          // Their own hand is no loss to the defender; the other player's hand is.
          const b = body as { owner?: unknown; pick?: Loose };
          if (b.owner !== 'you') sc.handLoss += k * pickCount({ pick: b.pick });
        } else if (op === 'restrict') {
          // Only the attack-side restrictions are neutral: a barred Counter or Event play is not.
          const what = (body as { what?: unknown }).what;
          if (typeof what !== 'string') ok = false;
          else if (what === 'cannotActivateBlockerAgainstIt')
            sc.blockerLoss += k * pickCount((body as { target?: unknown }).target);
        } else if (op === 'negate' || op === 'setBasePower') {
          // Aimed only at the other player's Characters: no effect on their Leader's power or on a hit.
          const t = (body as { target?: { from?: unknown; owner?: unknown } }).target;
          const from = Array.isArray(t?.from) ? t.from : [t?.from];
          if (t?.owner !== 'opponent' || from.some((z) => z !== 'characters' && z !== 'stage'))
            ok = false;
        } else if (!NEUTRAL_OPS.has(op)) ok = false;
      }
    }
    for (const key of ['then', 'else', 'do', 'chooseOne', 'may', 'effect']) {
      const v = o[key];
      if (!v) continue;
      if (key === 'do' && !Array.isArray(v)) continue;
      if (key === 'chooseOne') (v as unknown[]).forEach((x) => step(x, k));
      else step(v, k);
    }
  };
  const cont = (c: Loose, m: number): void => {
    if (!ok) return;
    for (const [k, v] of Object.entries(c)) {
      if (k === 'power') {
        const b = v as { target?: { owner?: unknown }; amount: unknown };
        // A continuous cut to the other player's cards or a boost to theirs does not help the attacker.
        if (b.target?.owner !== 'opponent' || typeof b.amount !== 'number' || b.amount < 0)
          sc.gain += m * numBound(b.amount);
      } else if (k === 'tiers')
        for (const t of v as { apply: Loose[] }[]) t.apply.forEach((x) => cont(x, m));
      else if (k === 'setBasePower') ok = false;
      else if (k === 'restrict') {
        if (typeof (v as { what?: unknown }).what !== 'string') ok = false;
        else if ((v as { what?: unknown }).what === 'cannotActivateBlockerAgainstIt')
          sc.blockerLoss = Infinity;
      } else if (!['cost', 'playCost', 'counter', 'grant', 'lockAttackTarget'].includes(k))
        ok = false;
    }
  };
  if (a.kind === 'permanent') (a.apply as Loose[]).forEach((c) => cont(c, 1));
  else if (a.kind === 'replacement') {
    step(a.instead, mult);
  } else step(a.effect, mult);
  return ok;
}

/** Power printed on a Character or Leader (0 if unknown). */
const printedPower = (cards: ReadonlyMap<string, Card>, id: string): number =>
  cards.get(id)?.power ?? 0;

/**
 * What the attacker can reach this turn, or `null` when some script it can reach does something this
 * reading does not classify (the caller then searches).
 */
export function attackerPotential(
  s: GameState,
  attacker: PlayerId,
  cards: ReadonlyMap<string, Card>,
): Potential | null {
  const def = other(attacker);
  const leader = queries.zone(s, def, 'leader')[0]!.instance;
  // Only used in `public` mode, where the own deck is hidden and a draw finds a blank (A3).
  const { n, da } = attackReach(s, attacker, cards, false);
  const d = queries.don(s, attacker);
  const sc: Scan = {
    gain: 0,
    gainTotal: 0,
    addDonActive: 0,
    addDonRested: 0,
    giveDon: false,
    reachTrash: false,
    handLoss: 0,
    blockerLoss: 0,
    replay: 1,
  };
  const reachable: string[] = []; // one entry per card instance: two copies add twice
  let boardPower = 0;
  let rushPower = 0;
  let handPower = 0;
  let canUntap = false;
  let unblockable = false;
  let canPlayOrGrant = false;
  for (const z of ['hand', 'leader', 'characters', 'stage'] as const)
    for (const c of queries.zone(s, attacker, z)) {
      reachable.push(c.card);
      if (c.keywords.includes('Unblockable')) unblockable = true;
      const text = JSON.stringify(SCRIPTS[c.card]?.abilities ?? []);
      if (text.includes('"Unblockable"') || text.includes('"negate"')) unblockable = true;
      if (text.includes('"setActive"')) canUntap = true;
      if (text.includes('"play"') || text.includes('"grant"')) canPlayOrGrant = true;
      if (z === 'leader' || z === 'characters') boardPower = Math.max(boardPower, c.power ?? 0);
      if (z === 'hand' && cards.get(c.card)?.category === 'Character') {
        handPower = Math.max(handPower, printedPower(cards, c.card));
        if (c.keywords.includes('Rush'))
          rushPower = Math.max(rushPower, printedPower(cards, c.card));
      }
    }
  // An extra attack is one of: a card untapped (the board), a Rush Character from hand, or a hand
  // Character that a script plays or gives Rush. Each extra is as strong as the strongest source.
  let padPower = rushPower;
  if (canUntap) padPower = Math.max(padPower, boardPower, canPlayOrGrant ? handPower : 0);
  if (canPlayOrGrant) padPower = Math.max(padPower, handPower);
  // Taking a Character off the board and playing it again repeats its [On Play] and its activations:
  // with `B` ways to do that, one use of an ability can happen `(B + 1)^2` times (a bouncing
  // Character is itself replayed). Too many ways: no bound.
  let bounces = 0;
  for (const z of ['hand', 'leader', 'characters', 'stage'] as const)
    for (const c of queries.zone(s, attacker, z))
      bounces += bouncesOf(c.card, d.active + d.rested, cards.get(c.card)?.category === 'Event');
  if (bounces > 4) return null;
  sc.replay = (bounces + 1) ** 2;
  if (bounces > 0) padPower = Math.max(padPower, boardPower, handPower);
  const scanAll = (ids: Iterable<string>): boolean => {
    for (const id of ids) {
      const script = SCRIPTS[id];
      if (!script) continue; // no script: the engine gives the card no ability
      for (const ab of script.abilities as unknown as Loose[])
        if (
          !scanAbility(
            ab,
            Math.max(1, n),
            d.active + d.rested,
            sc,
            cards.get(id)?.category === 'Event',
          )
        )
          return false;
    }
    return true;
  };
  if (!scanAll(reachable)) return null;
  if (sc.reachTrash) {
    const trash = queries.zone(s, attacker, 'trash').map((c) => c.card);
    for (const id of trash) {
      if (cards.get(id)?.category === 'Character')
        padPower = Math.max(padPower, printedPower(cards, id));
    }
    // A card played from the trash that can take a Character off the board is not classified.
    if (trash.some((id) => bouncesOf(id, d.active + d.rested, false) > 0)) return null;
    if (!scanAll(trash)) return null;
  }
  const powers: number[] = [];
  const seen = new Set<string>();
  for (const a of legalActions(s))
    if (a.type === 'attack' && a.target === leader && !seen.has(a.attacker)) {
      seen.add(a.attacker);
      powers.push(queries.card(s, a.attacker).power ?? 0);
    }
  while (powers.length < n) powers.push(padPower);
  powers.sort((x, y) => y - x);
  const don = d.active + sc.addDonActive + (sc.giveDon ? d.rested + sc.addDonRested : 0);
  return {
    powers,
    n,
    da,
    don,
    gain: sc.gain,
    gainTotal: sc.gainTotal,
    handLoss: sc.handLoss,
    blockerLoss: sc.blockerLoss,
    unblockable,
  };
}

export interface BoundInput {
  /** Hidden cards in the defender's hand (each can be a plain Counter in the worst case). */
  hand: number;
  /** The most the plain Counter mode adds, with no cost. */
  plain: number;
}

/**
 * Lethal is impossible even against the reduced defender (see the file header)? `true` is a
 * refutation; `false` says nothing (search).
 */
export function refutedByBound(
  s: GameState,
  attacker: PlayerId,
  cards: ReadonlyMap<string, Card>,
  input: BoundInput,
): boolean {
  if (input.plain <= 0) return false;
  const pot = attackerPotential(s, attacker, cards);
  if (!pot) return false;
  const def = other(attacker);
  const life = queries.zone(s, def, 'life').length;
  const h = pot.da ? 2 : 1;
  const need = Math.ceil(life / h) + 1; // landed attacks that win
  const m = pot.powers.length;
  if (m < need) return true; // too few attackers (the attackers bound's case)
  // Their active Blockers stop attacks at no cost (each blocks once); an attack spent to K.O. a
  // Blocker removes one stop and costs one attack, so it changes nothing; what the scripts can remove
  // or bar comes off. An [Unblockable] attacker anywhere in reach: no Blockers counted.
  let blockers = 0;
  if (!pot.unblockable)
    for (const c of queries.zone(s, def, 'characters'))
      if (c.keywords.includes('Blocker') && !c.rested) blockers++;
  const free = Math.max(0, blockers - pot.blockerLoss);
  const k = m - need + 1 - free; // attacks that must be stopped with cards
  if (k <= 0) return true; // their Blockers alone stop enough attacks
  const t = Math.floor(Math.max(0, input.hand - pot.handLoss) / k); // cards the defender spends on each stop
  const leader = queries.zone(s, def, 'leader')[0]!;
  const threshold = (leader.power ?? 0) - pot.gain + input.plain * t;
  // The best `need` attackers must each reach `threshold` with the DON!! there is. What the used
  // abilities add (`gainTotal`) is shared out over them, so it comes off the total gap, not each:
  // sum of max(0, a_i - g_i) >= max(0, sum of max(0, a_i) - sum of g_i) for g_i >= 0.
  let gaps = 0;
  // With Blockers the defender also uses them on attacks that cost more than `t` cards: the attacker
  // needs `need + free` attacks that each get past `t` cards (see the file header).
  for (let i = 0; i < need + free; i++) gaps += Math.max(0, threshold - pot.powers[i]!);
  return Math.ceil(Math.max(0, gaps - pot.gainTotal) / 1000) > pot.don;
}

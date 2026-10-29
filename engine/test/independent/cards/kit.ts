/**
 * Helpers for the independent card tests (M4a). Public API and frozen fixtures only.
 *
 * Abilities are found through `project(state, player).actions` (the player's view), never by a
 * guessed ability id. Effect decisions are driven through the decision kinds of ARCHITECTURE §2.3
 * and effect-dsl.md §4.11: `optional` (yes/no), `choose` (one `pick` at a time, then `done`),
 * `order`, `trigger`.
 *
 * Where the engine may either ask or decide on its own (for example a cost pick with exactly one
 * candidate), the helpers accept both, so a test fails on the outcome, not on the encoding.
 */
import {
  project,
  queries,
  type Action,
  type CardId,
  type DonClass,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
  type ZoneName,
} from '@optcg/engine';
import { scenario, TestGame } from '../../fixtures/index.ts';
import { act, cardIds, decision, FILL, fill, L } from '../helpers.ts';

// ---------------------------------------------------------------------------------------------
// Cards used as scenery. Stats are repeated where a test depends on them.
// ---------------------------------------------------------------------------------------------

/** Leaders. */
export const LEAD = {
  /** OP17-039 Rocks.D.Xebec: Blue, 5000, 5 Life, type Rocks Pirates. Card under test elsewhere. */
  rocks: 'OP17-039',
  /** OP17-058 Kaido: Purple, 5000, 5 Life, types Animal Kingdom Pirates / The Four Emperors. */
  kaido: 'OP17-058',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, Baroque Works / Seven Warlords. [Activate: Main] only. */
  crocodile: L.blueCrocodile,
  /** ST05-001 Shanks: Purple, 5000, 5 Life, FILM / Four Emperors / Red-Haired Pirates. [Activate: Main] only. */
  shanks: 'ST05-001',
  /** OP11-062 Charlotte Katakuri: Purple, 5000, 5 Life, Big Mom Pirates (no Animal Kingdom Pirates). */
  katakuri: 'OP11-062',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life. [Activate: Main] only: a neutral opponent. */
  luffy: L.redLuffy,
} as const;

/** Vanilla Characters (no effect text, no [Trigger]) with the stats tests rely on. */
export const VAN = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, type Buggy Pirates. */
  mohji: FILL.blue,
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, type FILM. */
  gordon: FILL.purple,
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000. */
  sunny: FILL.red,
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. */
  littleOars: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000 (not the OP17-048 Shiki). */
  shiki8: 'OP12-005',
  /** ST03-002 Edward Weevil: Blue, cost 3, 5000, Counter +1000. */
  weevil: 'ST03-002',
  /** ST09-003 Ulti: Yellow, cost 4, 6000, Counter +1000, type Animal Kingdom Pirates. */
  ultiAkp: 'ST09-003',
  /** OP08-065 Charlotte Smoothie: Purple, cost 7, 9000, Counter +1000, type Big Mom Pirates. */
  smoothieBigMom: 'OP08-065',
  /** OP11-089 Black Maria: Black, cost 5, 7000, Counter +1000, type Animal Kingdom Pirates. */
  blackMaria: 'OP11-089',
} as const;

/** Fillers for decks and Life. */
export const BLUE = VAN.mohji;
export const PURPLE = VAN.gordon;
export const RED = VAN.sunny;

/** Rocks Pirates cards from the Rocks list, with the stats tests rely on. */
export const ROCKS = {
  /** OP17-040 Edward.Newgate: cost 6, 8000, no Counter, type Rocks Pirates. */
  newgate: 'OP17-040',
  /** OP17-042 Kaido: cost 4, 6000, no Counter, [Blocker], type Rocks Pirates. */
  kaido: 'OP17-042',
  /** OP17-044 Captain John: cost 4, 6000, no Counter, type Rocks Pirates. */
  john: 'OP17-044',
  /** OP17-045 Kyo: cost 2, 4000, no Counter, type Rocks Pirates. */
  kyo: 'OP17-045',
  /** OP17-046 Gloriosa: cost 4, 1000, no Counter, [Blocker], types Amazon Lily / Rocks Pirates. */
  gloriosa: 'OP17-046',
  /** OP17-048 Shiki: cost 7, 9000, no Counter, [Rush: Character], type Rocks Pirates. */
  shiki: 'OP17-048',
  /** OP17-049 Charlotte Linlin: cost 5, 7000, no Counter, type Rocks Pirates. */
  linlin: 'OP17-049',
  /** OP17-050 Streusen: cost 1, 2000, no Counter, type Rocks Pirates. */
  streusen: 'OP17-050',
  /** OP17-052 Don Marlon: cost 3, 5000, no Counter, type Rocks Pirates. */
  marlon: 'OP17-052',
  /** OP17-054 Miss Buckingham Stussy: cost 3, 5000, no Counter, type Rocks Pirates. */
  stussy: 'OP17-054',
  /** OP17-055 There's No Authority…: blue Event, cost 0, type Rocks Pirates. */
  noAuthority: 'OP17-055',
  /** OP17-056 Rocks Pirates: blue Event, cost 0, type Rocks Pirates. */
  rocksEvent: 'OP17-056',
  /** OP17-118 Rocks.D.Xebec: cost 10, 12000, no printed Counter, type Rocks Pirates. */
  xebec: 'OP17-118',
  /** OP08-051 Buckin: cost 1, 2000, Counter +1000, type Former Rocks Pirates. */
  buckin: 'OP08-051',
} as const;

/** Cards from the Kaido list. */
export const AKP = {
  /** EB04-030 Kaido: cost 7, 9000, no Counter, AKP / Four Emperors. */
  kaido7: 'EB04-030',
  /** EB04-031 King: cost 6, 7000, no Counter, AKP / Lunarian. No [On Play]. */
  king: 'EB04-031',
  /** EB04-032 Queen: cost 1, 1000, Counter +1000, AKP. */
  queen1: 'EB04-032',
  /** EB04-040 Flame Dragon Torch: purple Event, cost 1. */
  flameDragon: 'EB04-040',
  /** OP07-076 Slow-Slow Beam Sword: purple Event, cost 2, has [Trigger]. */
  slowSlow: 'OP07-076',
  /** OP07-077 We're Going to Claim the One Piece!!!: purple Event, cost 1, has [Trigger]. */
  onePiece: 'OP07-077',
  /** OP08-074 Black Maria: cost 3, 2000, Counter +2000, AKP. */
  blackMaria: 'OP08-074',
  /** OP09-077 Gum-Gum Lightning: purple Event, cost 2, has [Trigger]. */
  lightning: 'OP09-077',
  /** OP15-069 Nola: cost 1, 2000, Counter +2000, Animal / Sky Island. */
  nola: 'OP15-069',
  /** OP15-078 Mamaragan: purple Event, cost 0. */
  mamaragan: 'OP15-078',
  /** OP17-060 Ulti & Page One: cost 6, 6000, Counter +1000, AKP. */
  ultiPageOne: 'OP17-060',
  /** OP17-061 Lead Performers: cost 9, 11000, no Counter, Fish-Man / AKP. */
  leadPerformers: 'OP17-061',
  /** OP17-062 Kaido: cost 10, 12000, no Counter, [Blocker], AKP / Four Emperors. */
  kaido10Blocker: 'OP17-062',
  /** OP17-063 Kaido: cost 10, 12000, no Counter, AKP / Four Emperors. */
  kaido10: 'OP17-063',
  /** OP17-065 Queen: cost 9, 10000, no Counter, [Banish], AKP. */
  queen9: 'OP17-065',
  /** OP17-073 Basil Hawkins: cost 3, 1000, Counter +2000, AKP / Hawkins Pirates. */
  hawkins: 'OP17-073',
  /** OP17-074 Yamato: cost 3, 1000, Counter +1000, [Blocker], Land of Wano. */
  yamato: 'OP17-074',
  /** OP17-075 X.Drake: cost 2, 2000, Counter +2000, Navy / Drake Pirates / AKP. */
  drake: 'OP17-075',
  /** OP17-076 Wo Ro Ro Ro Ro…: purple Event, cost 0, has [Trigger]. */
  woRoRo: 'OP17-076',
  /** OP17-077 Kundali Dragon Swarm: purple Event, cost 1. */
  kundali: 'OP17-077',
  /** ST34-004 Charlotte Linlin: cost 10, 12000, no Counter, Four Emperors / Big Mom Pirates. */
  linlin10: 'ST34-004',
} as const;

// ---------------------------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------------------------

/** One side with 4 Life and a 15-card deck of `filler`, plus whatever `spec` sets. */
export function side(leader: string, filler: CardId, spec: Partial<PlayerSpec> = {}): PlayerSpec {
  return { leader, life: fill(filler, 4), deck: fill(filler, 15), ...spec };
}

/** p1's turn 3 Main Phase (p1 went first): battle is allowed. */
export function myTurn(p1: PlayerSpec, p2: PlayerSpec): TestGame {
  return scenario({ p1, p2 });
}

/** p2's turn 4 Main Phase (p1 went first): p2 attacks, p1 defends. */
export function theirTurn(p1: PlayerSpec, p2: PlayerSpec): TestGame {
  return scenario({ turn: 4, activePlayer: 'p2', firstPlayer: 'p1', p1, p2 });
}

/** A copy of the game, for exploring one branch without touching the original. */
export function branch(g: TestGame): TestGame {
  return new TestGame(g.state, []);
}

// ---------------------------------------------------------------------------------------------
// Reading the game
// ---------------------------------------------------------------------------------------------

/** The legal actions in the deciding player's view (`PlayerView.actions`). */
export function viewActions(g: TestGame): Action[] {
  const d = queries.decision(g.state);
  if (!d) return [];
  return [...project(g.state, d.player).actions];
}

/** Sorted card ids in a zone. */
export function sortedIds(g: TestGame, player: PlayerId, zone: ZoneName): CardId[] {
  return cardIds(g, player, zone).sort();
}

export function count(g: TestGame, player: PlayerId, zone: ZoneName): number {
  return g.zone(player, zone).length;
}

/** Card id of an instance, or null if the public queries cannot see it. */
export function cardOf(g: TestGame, instance: InstanceId): CardId | null {
  try {
    return queries.card(g.state, instance).card;
  } catch {
    return null;
  }
}

export function donOf(g: TestGame, player: PlayerId) {
  return queries.don(g.state, player);
}

/** DON!! on the field: cost area (active + rested) plus DON!! given to the Leader and Characters. */
export function donOnField(g: TestGame, player: PlayerId): number {
  const d = queries.don(g.state, player);
  return d.active + d.rested + d.given;
}

export function kind(g: TestGame) {
  return decision(g)?.kind ?? null;
}

export function decider(g: TestGame): PlayerId | null {
  return decision(g)?.player ?? null;
}

/** True when `player` owes an `optional` decision now. */
export function offered(g: TestGame, player: PlayerId): boolean {
  const d = decision(g);
  return d?.kind === 'optional' && d.player === player;
}

/** The attackers that may legally declare an attack now (any target). */
export function attackers(g: TestGame): InstanceId[] {
  return [...new Set(g.legal().flatMap((a) => (a.type === 'attack' ? [a.attacker] : [])))].sort();
}

/** True if `attacker` has at least one legal attack target now. */
export function canAttackAny(g: TestGame, attacker: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'attack' && a.attacker === attacker);
}

// ---------------------------------------------------------------------------------------------
// [Activate: Main]
// ---------------------------------------------------------------------------------------------

/** Ability ids the deciding player's view offers to activate on `card`. */
export function abilities(g: TestGame, card: InstanceId): string[] {
  return [
    ...new Set(
      viewActions(g).flatMap((a) => (a.type === 'activate' && a.card === card ? [a.ability] : [])),
    ),
  ];
}

export function canActivate(g: TestGame, card: InstanceId): boolean {
  return abilities(g, card).length > 0;
}

/**
 * Activate the (only) [Activate: Main] offered on `card`. If the engine then asks whether to use a
 * "you may" cost, say yes: choosing to activate is choosing to pay.
 */
export function activate(g: TestGame, card: InstanceId): void {
  const [ability, ...more] = abilities(g, card);
  if (!ability) throw new Error(`No [Activate: Main] is offered on ${cardOf(g, card)} (${card}).`);
  if (more.length) throw new Error(`Several abilities offered on ${card}: ${[ability, ...more]}`);
  const player = g.decider;
  act(g, { type: 'activate', card, ability });
  if (offered(g, player)) accept(g);
}

// ---------------------------------------------------------------------------------------------
// optional / choose
// ---------------------------------------------------------------------------------------------

export function accept(g: TestGame): void {
  const d = decision(g);
  if (d?.kind !== 'optional') throw new Error(`Expected an optional decision, got ${d?.kind}`);
  act(g, { type: 'optional', accept: true });
}

export function decline(g: TestGame): void {
  const d = decision(g);
  if (d?.kind !== 'optional') throw new Error(`Expected an optional decision, got ${d?.kind}`);
  act(g, { type: 'optional', accept: false });
}

/** Card instances the current `choose` decision offers. */
export function choices(g: TestGame): InstanceId[] {
  if (kind(g) !== 'choose') return [];
  return g
    .legal()
    .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
}

/** Card ids the current `choose` decision offers, sorted (duplicates kept). */
export function choiceCards(g: TestGame): (CardId | null)[] {
  return choices(g)
    .map((i) => cardOf(g, i))
    .sort();
}

/** DON!! classes the current `choose` decision offers. */
export function donChoices(g: TestGame): DonClass[] {
  if (kind(g) !== 'choose') return [];
  return g
    .legal()
    .flatMap((a) =>
      a.type === 'pick' && typeof a.choice === 'object' && a.choice !== null ? [a.choice] : [],
    );
}

export function canFinish(g: TestGame): boolean {
  return kind(g) === 'choose' && g.legal().some((a) => a.type === 'done');
}

/** Pick these card instances in the current `choose` decision (any order the engine accepts), then `done` if asked. */
export function choose(g: TestGame, targets: InstanceId[]): void {
  const player = g.decider;
  const max = decision(g)?.max;
  const left = [...targets];
  while (left.length) {
    const legalNow = choices(g);
    const i = left.findIndex((t) => legalNow.includes(t));
    if (i < 0) {
      throw new Error(
        `Cannot pick ${left.map((t) => cardOf(g, t))}; offered: ${choiceCards(g)} (decision ${kind(g)})`,
      );
    }
    act(g, { type: 'pick', choice: left[i]! });
    left.splice(i, 1);
  }
  // Below the maximum, the same decision is still open: confirm it. At the maximum the engine may
  // have moved on to a new `choose` already, so confirm only if nothing is left to pick.
  if (decider(g) !== player || !canFinish(g)) return;
  const atMax = max !== undefined && targets.length >= max;
  if (!atMax || choices(g).length === 0) act(g, { type: 'done' });
}

/** Choose nothing for an "up to" choice (CR 8-4-4-1). */
export function chooseNone(g: TestGame): void {
  if (!canFinish(g)) throw new Error(`Expected a choose decision that allows done, got ${kind(g)}`);
  act(g, { type: 'done' });
}

/**
 * Pay an exact-N cost pick from hand (trash or reveal) with these cards. If the engine resolves the
 * pick on its own (exactly N candidates), nothing is asked and nothing is done here.
 */
export function payWith(g: TestGame, cards: InstanceId[]): void {
  const player = g.decider;
  for (const c of cards) {
    if (decider(g) === player && choices(g).includes(c)) act(g, { type: 'pick', choice: c });
  }
  if (
    decider(g) === player &&
    canFinish(g) &&
    donChoices(g).length === 0 &&
    choices(g).length === 0
  ) {
    act(g, { type: 'done' });
  }
}

/**
 * Pay DON!! −N (or "rest N of your DON!!") by picking N DON!! classes, preferring `from`. If the
 * engine pays on its own (one class only), nothing is asked and nothing is done here.
 */
export function payDon(
  g: TestGame,
  n: number,
  from: DonClass['from'] = 'costActive',
  givenTo?: InstanceId,
): void {
  const player = g.decider;
  for (let i = 0; i < n; i++) {
    if (decider(g) !== player) return;
    const opts = donChoices(g);
    if (!opts.length) return;
    const want =
      opts.find((o) => o.from === from && (o.from !== 'given' || o.card === givenTo)) ?? opts[0]!;
    act(g, { type: 'pick', choice: want });
  }
  if (decider(g) === player && donChoices(g).length && canFinish(g)) act(g, { type: 'done' });
}

/**
 * Say yes to every `optional` and take the first offered pick of every `choose` owed by `player`,
 * until the decision passes to someone else or back to a Main/battle decision. For effects whose
 * choices do not matter to the test (for example "add up to 1 DON!! card").
 */
export function settleYes(g: TestGame, player: PlayerId, limit = 30): void {
  for (let i = 0; i < limit; i++) {
    const d = decision(g);
    if (!d || d.player !== player) return;
    if (d.kind === 'optional') {
      act(g, { type: 'optional', accept: true });
    } else if (d.kind === 'choose') {
      const pickAction = g.legal().find((a) => a.type === 'pick');
      if (pickAction) g.act(pickAction);
      else act(g, { type: 'done' });
    } else if (d.kind === 'order') {
      g.act(g.legal().find((a) => a.type === 'order')!);
    } else return;
  }
}

/** Decline every `optional` owed by `player` (and finish empty `choose`s) until the decision moves on. */
export function settleNo(g: TestGame, player: PlayerId, limit = 30): void {
  for (let i = 0; i < limit; i++) {
    const d = decision(g);
    if (!d || d.player !== player) return;
    if (d.kind === 'optional') act(g, { type: 'optional', accept: false });
    else if (d.kind === 'choose' && canFinish(g)) act(g, { type: 'done' });
    else if (d.kind === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    else return;
  }
}

// ---------------------------------------------------------------------------------------------
// Counter Step
// ---------------------------------------------------------------------------------------------

/** True if the defender may use `card` from hand in the current Counter Step (any target). */
export function canCounterWith(g: TestGame, card: InstanceId): boolean {
  return g.legal().some((a) => a.type === 'counter' && a.card === card);
}

/**
 * Use `card` in the Counter Step, preferring a `counter` action aimed at `target`. For an Event whose
 * target is chosen during resolution, the target is picked later with `choose`.
 */
export function useCounter(g: TestGame, card: InstanceId, target: InstanceId): void {
  const options = g.legal().filter((a) => a.type === 'counter' && a.card === card);
  if (!options.length) throw new Error(`${cardOf(g, card)} cannot be used as a Counter now.`);
  const exact = options.find((a) => a.type === 'counter' && a.target === target);
  g.act(exact ?? options[0]!);
}

/** If the engine asks for the target now, pick it; if the target was fixed already, do nothing. */
export function chooseIfAsked(g: TestGame, targets: InstanceId[]): void {
  if (kind(g) === 'choose' && targets.some((t) => choices(g).includes(t))) choose(g, targets);
}

/**
 * Targets an Event [Counter] can boost: the targets of its `counter` actions if they differ, or
 * else the candidates of the `choose` that follows using it (explored on a copy).
 */
export function eventCounterTargets(g: TestGame, event: InstanceId): InstanceId[] {
  const options = g.legal().filter((a) => a.type === 'counter' && a.card === event);
  const targets = [
    ...new Set(options.flatMap((a) => (a.type === 'counter' ? [a.target] : []))),
  ].sort();
  if (targets.length > 1) return targets;
  if (!options.length) return [];
  const b = branch(g);
  b.act(options[0]!);
  const player = b.decider;
  for (let i = 0; i < 10; i++) {
    if (decider(b) !== player) break;
    if (kind(b) === 'optional') act(b, { type: 'optional', accept: true });
    else if (kind(b) === 'choose' && donChoices(b).length) payDon(b, 1);
    else break;
  }
  return kind(b) === 'choose' ? [...choices(b)].sort() : targets;
}

// ---------------------------------------------------------------------------------------------
// Exploring every branch of the decisions one player owes
// ---------------------------------------------------------------------------------------------

/**
 * Try every legal action (except conceding) of every decision `player` owes, depth first, until
 * the decision passes to the other player or to a `main` decision. Returns the set of
 * `fingerprint(game)` values reached. For effects whose decision encoding the API leaves open
 * (modes, top-or-bottom, card order), tests assert on the reachable outcomes instead.
 */
export function outcomes(
  g: TestGame,
  player: PlayerId,
  fingerprint: (game: TestGame) => string,
  depth = 10,
): Set<string> {
  const seen = new Set<string>();
  const walk = (game: TestGame, left: number) => {
    const d = decision(game);
    if (!d || d.player !== player || d.kind === 'main' || left === 0) {
      seen.add(fingerprint(game));
      return;
    }
    for (const a of game.legal()) {
      if (a.type === 'concede') continue;
      const next = branch(game);
      next.act(a);
      walk(next, left - 1);
    }
  };
  walk(g, depth);
  return seen;
}

/**
 * Every set of cards (as sorted card ids joined by '+') that the current `choose` decision can end
 * with, trying picks in every order the engine accepts. Ends a set at `done` or when the decision
 * moves on.
 */
export function reachablePickSets(g: TestGame, depth = 6): Set<string> {
  const player = g.decider;
  const sets = new Set<string>();
  const walk = (game: TestGame, picked: CardId[], left: number) => {
    const key = [...picked].sort().join('+');
    if (kind(game) !== 'choose' || decider(game) !== player || left === 0) {
      sets.add(key);
      return;
    }
    if (canFinish(game)) sets.add(key);
    for (const c of choices(game)) {
      const next = branch(game);
      const id = cardOf(game, c) ?? c;
      next.act({ type: 'pick', choice: c, player });
      walk(next, [...picked, id], left - 1);
    }
  };
  walk(g, [], depth);
  return sets;
}

export function hasEvent(g: TestGame, type: string, match: Record<string, unknown> = {}): boolean {
  return g.events.some(
    (e) => e.type === type && Object.entries(match).every(([k, v]) => e[k] === v),
  );
}

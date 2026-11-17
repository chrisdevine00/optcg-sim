/**
 * Helpers for the M4b group-B independent card tests. Public API and frozen fixtures only.
 * Reuses `../kit.ts`; this file adds scenery cards and a few flows those tests share.
 */
import {
  project,
  queries,
  type CardId,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
} from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, cardIds, decision } from '../../helpers.ts';
import {
  accept,
  canFinish,
  choices,
  choose,
  decider,
  donChoices,
  kind,
  offered,
  payDon,
  skipUnusable,
} from '../kit.ts';

export * from '../kit.ts';

/** Like `side`, but the Leader may be a placement (given DON!!, rested). */
export function sideL(
  leader: PlayerSpec['leader'],
  filler: CardId,
  spec: Partial<PlayerSpec> = {},
): PlayerSpec {
  return { leader, life: Array(4).fill(filler), deck: Array(15).fill(filler), ...spec };
}
export {
  act,
  attack,
  blockers,
  canAttack,
  decision,
  endTurn,
  isLegal,
  noDefence,
  passBlock,
  passCounter,
  play,
  result,
  takeDamage,
  turn,
} from '../../helpers.ts';

/** Leaders used as scenery. Each has only an [Activate: Main] (or a deck-building rule): nothing fires. */
export const LB = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, types Straw Hat Crew / Supernovas. */
  redShc: 'ST01-001',
  /** OP12-020 Roronoa Zoro: Green, 5000, 5 Life, types Straw Hat Crew / Supernovas ([DON!! x3] [Activate: Main] only). */
  greenShc: 'OP12-020',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, type Kid Pirates. */
  greenKid: 'ST02-001',
  /** OP01-003 Monkey.D.Luffy: Green/Red, 5000, 4 Life, types Straw Hat Crew / Supernovas ([Activate: Main] only). */
  multiShc: 'OP01-003',
  /** OP01-002 Trafalgar Law: Green/Red, 5000, 4 Life, types Heart Pirates / Supernovas ([Activate: Main] only). */
  multiLaw: 'OP01-002',
  /** ST05-001 Shanks: Purple, 5000, 5 Life, types FILM / The Four Emperors / Red-Haired Pirates. */
  film: 'ST05-001',
  /** ST03-001 Crocodile: Blue, 5000, 5 Life, Baroque Works / Seven Warlords. */
  croc: 'ST03-001',
  /** OP12-001 Silvers Rayleigh: Red, 5000, 5 Life, Former Roger Pirates (deck-building rule only). */
  rayleigh: 'OP12-001',
  /** ST01-001 as the opponent's neutral Leader. */
  opp: 'ST01-001',
} as const;

/** Vanilla Characters (no effect text, no [Trigger]); stats noted. */
export const CH = {
  /** P-015 Sunny-Kun: Red, cost 1, 3000, +1000, FILM / Straw Hat Crew. */
  sunny: 'P-015',
  /** OP04-007 Sanji: Red, cost 1, 3000, +1000, Alabasta / Straw Hat Crew (a [Sanji], for exclusions). */
  sanji1: 'OP04-007',
  /** ST01-008 Nico Robin: Red, cost 3, 5000, +1000, Straw Hat Crew. */
  robin: 'ST01-008',
  /** ST01-010 Franky: Red, cost 4, 6000, +1000, Straw Hat Crew. */
  franky4: 'ST01-010',
  /** P-022 Monkey.D.Luffy: Red, cost 4, 6000, +1000, FILM / Straw Hat Crew / Supernovas. */
  luffy4: 'P-022',
  /** OP11-003 Usopp: Red, cost 5, 6000, +2000, Straw Hat Crew. */
  usopp5: 'OP11-003',
  /** OP10-013 Nami: Red, cost 5, 7000, +1000, Straw Hat Crew / Punk Hazard (a [Nami], 7000 base). */
  nami5: 'OP10-013',
  /** OP10-014 Franky: Red, cost 6, 8000, +1000, Animal / Straw Hat Crew / Punk Hazard. */
  franky6: 'OP10-014',
  /** P-080 Monkey.D.Luffy: Red, cost 7, 9000, +1000, Straw Hat Crew / Four Emperors / Egghead. */
  luffy7: 'P-080',
  /** ST21-005 Jinbe: Red, cost 2, 4000, +1000, Fish-Man / Straw Hat Crew. */
  jinbe2: 'ST21-005',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, +1000 (no types of interest). */
  komachiyo: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, +1000. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, +1000. */
  thatch: 'OP02-007',
  /** EB02-004 Don Accino: Red, cost 8, 10000, +1000. */
  accino8: 'EB02-004',
  /** EB01-005 Doma: Red, cost 1, 3000, +1000, Whitebeard Pirates Allies. */
  doma: 'EB01-005',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, +1000, Giant / Whitebeard Pirates Allies. */
  littleOars: 'OP02-020',
  /** OP03-023 Alvida: Green, cost 1, 3000, +1000, East Blue / Alvida Pirates. */
  alvida: 'OP03-023',
  /** OP02-033 Jinbe: Green, cost 2, 4000, +1000, FILM / Fish-Man / Straw Hat Crew. */
  jinbeG2: 'OP02-033',
  /** OP02-028 Usopp: Green, cost 3, 5000, +1000, FILM / Straw Hat Crew. */
  usoppG3: 'OP02-028',
  /** OP02-043 Roronoa Zoro: Green, cost 4, 6000, +1000, FILM / Straw Hat Crew / Supernovas. */
  zoroG4: 'OP02-043',
  /** OP02-039 Franky: Green, cost 5, 7000, +1000, FILM / Straw Hat Crew. */
  frankyG5: 'OP02-039',
  /** OP13-029 Jinbe: Green, cost 6, 7000, +2000, FILM / Fish-Man / Straw Hat Crew. */
  jinbeG6: 'OP13-029',
  /** OP17-035 Roronoa Zoro: Green, cost 7, 8000, +2000, East Blue / Straw Hat Crew. */
  zoroG7: 'OP17-035',
  /** P-061 Monkey.D.Luffy: Green, cost 8, 10000, +1000, FILM / Straw Hat Crew. */
  luffyG8: 'P-061',
  /** OP05-035 Bellamy: Green, cost 3, 5000, +1000, Donquixote Pirates. */
  bellamy3: 'OP05-035',
  /** OP01-045 Jean Bart: Green, cost 4, 6000, +1000, Heart Pirates. */
  jeanBart4: 'OP01-045',
  /** OP10-031 Sengoku: Green, cost 5, 7000, +1000, Navy / Dressrosa. */
  sengoku5: 'OP10-031',
  /** OP11-026 Scaled Neptunian: Green, cost 6, 8000, +1000, Neptunian. */
  neptunian6: 'OP11-026',
  /** OP05-044 John Giant: Blue, cost 8, 10000, +1000, Giant / Navy. */
  johnGiant8: 'OP05-044',
  /** OP14-101 Oars: Yellow, cost 8, 10000, +1000, Giant / Thriller Bark Pirates (no 9-cost vanilla exists; see CH9). */
  oars8: 'OP14-101',
  /** OP12-082 Issho: Black, cost 8, 10000, +1000. */
  issho8: 'OP12-082',
  /** P-041 Monkey.D.Luffy: Purple, cost 10, 12000, +1000. */
  luffyP10: 'P-041',
  /** OP09-072 Franky: Purple, cost 4, 5000, [Blocker]. */
  blockerFranky: 'OP09-072',
  /** EB02-028 Portgas.D.Ace: Blue, cost 5, 5000, +1000, Alabasta / Whitebeard Pirates (its only text is [On Play]). */
  ace5: 'EB02-028',
} as const;

/** Deck fillers by color (vanilla, cost 1, 3000). */
export const F = { red: 'P-015', green: 'OP03-023', purple: 'ST05-007', blue: 'OP02-060' } as const;

/** [Straw Hat Crew] type Events: OP04-016 (red, cost 0; also Alabasta). */
export const EV = {
  /** OP04-016 Bad Manners Kick Course: Red Event, cost 0, Alabasta / Straw Hat Crew. */
  kick: 'OP04-016',
  /** OP12-037 Asura Blades: Green Event, cost 1, Straw Hat Crew. */
  asura: 'OP12-037',
  /** OP12-038 Rashomon: Green Event, cost 1, Straw Hat Crew. */
  rashomon: 'OP12-038',
  /** OP13-040: Green Event, cost 1, Straw Hat Crew / Supernovas. */
  allOut: 'OP13-040',
  /** OP06-017 Meteor-Strike of Love: Red Event, cost 2, FILM / Straw Hat Crew. */
  meteor: 'OP06-017',
  /** OP17-017 Ga Ha Ha Ha!!: Red Event, cost 1, Four Emperors / Whitebeard Pirates. */
  gaha: 'OP17-017',
  /** OP12-018: Red Event, cost 0, Former Roger Pirates. */
  haki: 'OP12-018',
  /** OP05-038 Charlestone: Green Event, cost 2, Donquixote Pirates. */
  charlestone: 'OP05-038',
  /** OP08-036 Electrical Luna: Green Event, cost 3, Minks. */
  luna: 'OP08-036',
  /** EB02-021 Giant Pistol: Green Event, cost 3, Straw Hat Crew / Water Seven. */
  giantPistol: 'EB02-021',
  /** OP01-055 Samurai: Green Event, cost 1, Land of Wano / Kouzuki Clan. */
  samurai: 'OP01-055',
  /** ST21-017 Mole Pistol: Red Event, cost 4, Straw Hat Crew / Four Emperors. */
  mole: 'ST21-017',
  /** OP14-019: Red Event, cost 1, Heart Pirates / Supernovas / Seven Warlords. */
  plan: 'OP14-019',
} as const;

// ---------------------------------------------------------------------------------------------
// Flows
// ---------------------------------------------------------------------------------------------

/** Card ids in a zone, top first. */
export function zoneCards(g: TestGame, player: PlayerId, zone: Parameters<TestGame['zone']>[1]) {
  return cardIds(g, player, zone);
}

/** Resolve pending `order` decisions of `player` with the first listed order (canonical). */
export function settleOrder(g: TestGame, player: PlayerId = 'p1'): void {
  for (let i = 0; i < 10; i++) {
    const d = decision(g);
    if (!d || d.player !== player || d.kind !== 'order') return;
    const a = g.legal().find((x) => x.type === 'order');
    if (!a) return;
    g.act(a);
  }
}

/**
 * Play an Event from hand as its [Main]. If the engine asks "use?" for a "you may" cost, accept it
 * (or decline when `use` is false). Then pay `don` DON!! of the activation cost from `from`.
 */
export function playEventMain(
  g: TestGame,
  event: InstanceId,
  opts: { use?: boolean; don?: number; from?: 'costActive' | 'costRested' } = {},
): void {
  const player = g.decider;
  act(g, { type: 'playCard', card: event });
  if (opts.use === false) {
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    return;
  }
  if (offered(g, player)) accept(g);
  if (opts.don) payDon(g, opts.don, opts.from ?? 'costActive');
}

/** The opponent's attacker hits p1's `target` (a Leader or a rested Character); p1 has not blocked yet. */
export function startAttack(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  act(g, { type: 'attack', attacker, target });
}

/**
 * The attacker hits the defender's Leader with no block and no Counter. Stops at the defender's
 * `trigger` decision (the top Life card was revealed) and answers it with `activate`.
 */
export function hitAndTrigger(
  g: TestGame,
  attacker: InstanceId,
  target: InstanceId,
  activate: boolean,
): void {
  act(g, { type: 'attack', attacker, target });
  if (decision(g)?.kind === 'block') act(g, { type: 'block', blocker: null });
  if (decision(g)?.kind === 'counter') act(g, { type: 'endCounter' });
  if (decision(g)?.kind !== 'trigger')
    throw new Error(`Expected a trigger decision, got ${decision(g)?.kind}`);
  act(g, { type: 'trigger', activate });
}

/** Instances (sorted) offered by the pending `choose`, as card ids (sorted). */
export function offeredCardIds(g: TestGame): CardId[] {
  return choices(g)
    .map((i) => queries.card(g.state, i).card)
    .sort();
}

/** Take the first offered pick of a pending `choose` whose card has this id. Returns the instance. */
export function pickCard(g: TestGame, card: CardId): InstanceId {
  const hit = choices(g).find((i) => queries.card(g.state, i).card === card);
  if (!hit) throw new Error(`${card} not offered; offered: ${offeredCardIds(g)}`);
  act(g, { type: 'pick', choice: hit });
  return hit;
}

/** Pick `targets`, then `done` if the decision is still open for `player`. */
export function pickThenDone(g: TestGame, targets: InstanceId[]): void {
  choose(g, targets);
}

/** True if p1's pending decision is a `choose` that offers DON!! classes. */
export function offersDon(g: TestGame): boolean {
  return kind(g) === 'choose' && donChoices(g).length > 0;
}

/** Finish every remaining `choose` (declining all "up to" picks) and `optional` of `player`. */
export function finishEmpty(g: TestGame, player: PlayerId, limit = 20): void {
  for (let i = 0; i < limit; i++) {
    skipUnusable(g, player);
    if (decider(g) !== player) return;
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    else if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
    else if (kind(g) === 'order') settleOrder(g, player);
    else return;
  }
}

/** The opponent's view must not show these card ids (hidden information). */
export function opponentView(g: TestGame, player: PlayerId) {
  return JSON.stringify(project(g.state, player));
}

/** End p1's turn and, if p2 reaches its Main Phase, end that turn too: back to p1's next Main Phase. */
export function throughOpponentTurn(g: TestGame): void {
  act(g, { type: 'endTurn' });
  if (decision(g)?.kind === 'main' && decision(g)?.player !== 'p1') act(g, { type: 'endTurn' });
}

// ---------------------------------------------------------------------------------------------
// Scripted driving of an effect's decisions
// ---------------------------------------------------------------------------------------------

export interface Script {
  /** Answers to `optional` decisions, in order (default: yes to all). */
  use?: boolean[];
  /** Instances for cost picks (`purpose: 'cost'`, cards), in order. */
  cost?: InstanceId[];
  /**
   * Targets for each non-cost `choose`, in order. `[]` means "none"; the marker 'DON' picks one
   * DON!! class offered by that decision (for example the opponent's active DON!!). Missing: none
   * if allowed, else the first offered.
   */
  picks?: (InstanceId | 'DON')[][];
  /** Preferred DON!! class for DON!! picks (cost or target). */
  don?: 'costActive' | 'costRested';
}

/**
 * Answer every decision `player` owes for the effect in progress, per `s`, until the decision
 * passes to someone else or reaches a Main, block, counter or trigger decision.
 */
export function drive(g: TestGame, player: PlayerId, s: Script = {}): void {
  const use = [...(s.use ?? [])];
  const cost = [...(s.cost ?? [])];
  const picks = [...(s.picks ?? [])];
  for (let i = 0; i < 40; i++) {
    const d = decision(g);
    if (!d || d.player !== player) return;
    if (d.kind === 'optional') {
      const want = use.shift() ?? true;
      const a = g.legal().find((x) => x.type === 'optional' && x.accept === want);
      if (a) g.act(a);
      else act(g, { type: 'optional', accept: false });
    } else if (d.kind === 'choose') {
      if (d.purpose === 'cost' && donChoices(g).length) {
        payDon(g, 1, s.don ?? 'costActive');
      } else if (d.purpose === 'cost' && cost.length && choices(g).length) {
        choose(g, cost.splice(0, Math.max(d.min ?? 1, 1)));
      } else if (d.purpose !== 'cost' && picks.length) {
        pickMixed(g, picks.shift()!, s.don ?? 'costActive');
      } else if (canFinish(g)) {
        act(g, { type: 'done' });
      } else {
        const p = g.legal().find((x) => x.type === 'pick');
        if (!p) return;
        g.act(p);
      }
    } else if (d.kind === 'order') {
      settleOrder(g, player);
    } else return;
  }
}

/** Pick cards (canonical order) then DON!! classes; confirm with `done` when the decision stays open. */
export function pickMixed(
  g: TestGame,
  items: (InstanceId | 'DON')[],
  don: 'costActive' | 'costRested',
): void {
  const player = g.decider;
  const cards = items.filter((i): i is InstanceId => i !== 'DON');
  const dons = items.filter((i) => i === 'DON').length;
  const max = decision(g)?.max;
  const left = [...cards].sort();
  while (left.length) {
    const legalNow = choices(g);
    const i = left.findIndex((t) => legalNow.includes(t));
    if (i < 0) throw new Error(`Cannot pick ${left}; offered ${offeredCardIds(g)}`);
    act(g, { type: 'pick', choice: left[i]! });
    left.splice(i, 1);
  }
  for (let k = 0; k < dons; k++) {
    const opts = donChoices(g);
    const want = opts.find((o) => o.from === don) ?? opts[0];
    if (!want) throw new Error('No DON!! class offered');
    act(g, { type: 'pick', choice: want });
  }
  if (
    decider(g) === player &&
    kind(g) === 'choose' &&
    canFinish(g) &&
    (max === undefined || items.length < max)
  ) {
    act(g, { type: 'done' });
  }
}

/** Activate an Event [Counter] from hand (any "use?" question is part of `s`). */
export function counterEvent(g: TestGame, event: InstanceId, s: Script = {}): void {
  const player = g.decider;
  const a = g
    .legal()
    .find((x) => (x.type === 'activate' || x.type === 'counter') && x.card === event);
  if (!a)
    throw new Error(
      `The Event ${queries.card(g.state, event).card} cannot be used as a Counter now.`,
    );
  g.act(a);
  drive(g, player, s);
}

/** True if the Event in hand can be used as a Counter now. */
export function canCounter(g: TestGame, event: InstanceId): boolean {
  return g.legal().some((x) => (x.type === 'activate' || x.type === 'counter') && x.card === event);
}

/** Play an Event's [Main] and drive its decisions. */
export function mainEvent(g: TestGame, event: InstanceId, s: Script = {}): void {
  const player = g.decider;
  act(g, { type: 'playCard', card: event });
  drive(g, player, s);
}

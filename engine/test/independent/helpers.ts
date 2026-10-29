/**
 * Helpers for the independent rule, ruling and projection tests.
 * Written against the public API (`@optcg/engine`) and the frozen fixtures only; no engine internals.
 *
 * Why `Move`: `Omit<Action, 'player'>` (used by `TestGame.act`) and `Intent` are not distributive
 * over the `Action` union, so an object literal such as `{ type: 'attack', attacker, target }` fails
 * the excess-property check. `Move` is the distributive version; passing a `Move` variable to
 * `TestGame.act` or `whyNot` typechecks.
 */
import {
  queries,
  whyNot,
  type Action,
  type CardId,
  type Decision,
  type InstanceId,
  type Intent,
  type PlayerId,
  type Reason,
} from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An action without `player` / `intentId`; `player` defaults to the deciding player. */
export type Move = DistributiveOmit<Action, 'player' | 'intentId'> & { player?: PlayerId };

// ---------------------------------------------------------------------------------------------
// Cards. Every stat a test relies on is noted here; tests repeat the one they rely on.
// ---------------------------------------------------------------------------------------------

/** Leaders whose only text is an [Activate: Main], so nothing fires unless activated. */
export const L = {
  /** ST01-001 Monkey.D.Luffy: Red, 5000 power, 5 Life. */
  redLuffy: 'ST01-001',
  /** ST04-001 Kaido: Purple, 5000 power, 5 Life. */
  purpleKaido: 'ST04-001',
  /** ST03-001 Crocodile: Blue, 5000 power, 5 Life. */
  blueCrocodile: 'ST03-001',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000 power, 5 Life. */
  greenKid: 'ST02-001',
  /** OP01-002 Trafalgar Law: Green/Red, 5000 power, 4 Life. */
  law4Life: 'OP01-002',
} as const;

/** Vanilla Characters (empty effect text, no [Trigger]). */
export const V = {
  /** OP01-010 Komachiyo: Red, cost 1, 3000 power, Counter +1000. */
  komachiyo: 'OP01-010',
  /** ST01-003 Karoo: Red, cost 1, 3000 power, Counter +1000. */
  karoo: 'ST01-003',
  /** OP01-012 Sai: Red, cost 2, 4000 power, Counter +1000. */
  sai: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000 power, Counter +1000. */
  marco: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000 power, Counter +1000. */
  hajrudin: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000 power, Counter +1000. */
  kingdew: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000 power, Counter +1000. */
  thatch: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000 power, Counter +1000. */
  littleOars: 'OP02-020',
  /** EB03-002 Ain: Red, cost 5, 6000 power, Counter +2000. */
  ain: 'EB03-002',
  /** OP02-084 Blugori: Purple, cost 1, 3000 power, Counter +1000. */
  blugori: 'OP02-084',
  /** OP02-080 Dobon: Purple, cost 2, 4000 power, Counter +1000. */
  dobon: 'OP02-080',
  /** OP02-077 Solitaire: Purple, cost 3, 5000 power, Counter +1000. */
  solitaire: 'OP02-077',
  /** OP01-103 Scratchmen Apoo: Purple, cost 4, 6000 power, Counter +1000. */
  apoo: 'OP01-103',
  /** OP01-107 Babanuki: Purple, cost 5, 7000 power, Counter +1000. */
  babanuki: 'OP01-107',
  /** OP01-110 Fukurokuju: Purple, cost 6, 8000 power, Counter +1000. */
  fukurokuju: 'OP01-110',
  /** OP01-092 Urashima: Purple, cost 7, 9000 power, Counter +1000. */
  urashima: 'OP01-092',
  /** OP11-078 Decuplets: Purple, cost 5, 6000 power, Counter +2000. */
  decuplets: 'OP11-078',
} as const;

/** Cards whose printed keyword comes from a verified override (`keywords` in the card JSON). */
export const K = {
  /** OP09-072 Franky: Purple, cost 4, 5000 power, [Blocker] (its [On Play] needs a play). */
  blockerFranky: 'OP09-072',
  /** ST10-010 Trafalgar Law: Purple, cost 4, 5000 power, [Blocker] (its [On Play] needs a play). */
  blockerLaw: 'ST10-010',
  /** ST21-014 Monkey.D.Luffy: Red, cost 5, 6000 power, [Rush]; [When Attacking] is "up to". */
  rushLuffy: 'ST21-014',
  /** OP17-048 Shiki: Blue, cost 7, 9000 power, [Rush: Character]; other text is optional. */
  rushCharShiki: 'OP17-048',
  /** OP13-118 Monkey.D.Luffy: Green, cost 6, 7000 power, [Double Attack] (its [On Play] needs a play). */
  doubleLuffy: 'OP13-118',
  /** OP17-065 Queen: Purple, cost 9, 10000 power, [Banish] (its [On Play] needs a play). */
  banishQueen: 'OP17-065',
  /** OP17-022 Shanks: Green, cost 10, 12000 power, no Counter value, [Rush]. */
  noCounterShanks: 'OP17-022',
} as const;

/** Stages whose only text is an [Activate: Main]. */
export const S = {
  /** OP05-021 Revolutionary Army HQ: Red Stage, cost 1. */
  armyHq: 'OP05-021',
  /** OP03-020 Striker: Red Stage, cost 1. */
  striker: 'OP03-020',
  /** EB02-009 Thousand Sunny: Red Stage, cost 2. */
  sunny: 'EB02-009',
} as const;

/** OP01-104 Speed: Purple Character, cost 2, 3000 power, no effect, "[Trigger] Play this card." */
export const TRIGGER_SPEED = 'OP01-104';

/** Deck fillers: plain vanilla cards that no test looks for by id. */
export const FILL = {
  /** P-015 Sunny-Kun: Red, cost 1, 3000 power, Counter +1000. */
  red: 'P-015',
  /** ST05-007 Gordon: Purple, cost 1, 3000 power, Counter +1000. */
  purple: 'ST05-007',
  /** OP03-023 Alvida: Green, cost 1, 3000 power, Counter +1000. */
  green: 'OP03-023',
  /** OP02-060 Mohji: Blue, cost 1, 3000 power, Counter +1000. */
  blue: 'OP02-060',
} as const;

export function fill(card: CardId, n: number): CardId[] {
  return Array.from({ length: n }, () => card);
}

// ---------------------------------------------------------------------------------------------
// Acting and asking
// ---------------------------------------------------------------------------------------------

export function act(g: TestGame, move: Move): void {
  g.act(move);
}

export function isLegal(g: TestGame, move: Move): boolean {
  const decision = queries.decision(g.state);
  const player = move.player ?? decision?.player;
  if (!player) return false;
  const full = { ...move, player } as DistributiveOmit<Action, 'intentId'>;
  return g.isLegal(full);
}

export function why(g: TestGame, player: PlayerId, move: Move): Reason | null {
  const { player: _p, ...intent } = move;
  return whyNot(g.state, player, intent as Intent);
}

export function decision(g: TestGame): Decision | null {
  return queries.decision(g.state);
}

export function attack(g: TestGame, attacker: InstanceId, target: InstanceId): void {
  act(g, { type: 'attack', attacker, target });
}

export function canAttack(g: TestGame, attacker: InstanceId, target: InstanceId): boolean {
  return isLegal(g, { type: 'attack', attacker, target });
}

/** Every legal attack target for one attacker, sorted. */
export function attackTargets(g: TestGame, attacker: InstanceId): InstanceId[] {
  return g
    .legal()
    .flatMap((a) => (a.type === 'attack' && a.attacker === attacker ? [a.target] : []))
    .filter((t, i, all) => all.indexOf(t) === i)
    .sort();
}

/** Every legal attack action. */
export function attacks(g: TestGame): Action[] {
  return g.legal().filter((a) => a.type === 'attack');
}

/** Legal [Blocker] choices (excluding "no block"). */
export function blockers(g: TestGame): InstanceId[] {
  return g.legal().flatMap((a) => (a.type === 'block' && a.blocker !== null ? [a.blocker] : []));
}

/** Decline to block, if a Block Step decision is pending. */
export function passBlock(g: TestGame): void {
  if (decision(g)?.kind === 'block') act(g, { type: 'block', blocker: null });
}

/** Finish the Counter Step without countering, if a Counter Step decision is pending. */
export function passCounter(g: TestGame): void {
  if (decision(g)?.kind === 'counter') act(g, { type: 'endCounter' });
  takeDamage(g);
}

/**
 * Add Life cards to hand at each damage decision that offers no [Trigger] to activate. The engine
 * asks for every Life card taken, so the opponent cannot tell [Trigger] cards apart (M2-01).
 */
export function takeDamage(g: TestGame): void {
  while (
    decision(g)?.kind === 'trigger' &&
    !g.legal().some((a) => a.type === 'trigger' && a.activate)
  ) {
    act(g, { type: 'trigger', activate: false });
  }
}

/** The defender neither blocks nor counters. */
export function noDefence(g: TestGame): void {
  passBlock(g);
  passCounter(g);
}

export function endTurn(g: TestGame): void {
  act(g, { type: 'endTurn' });
}

/**
 * Play a card from hand. If the engine asks which DON!! pay the cost, pick active cost-area DON!!
 * (the only DON!! that can pay a play cost, CR 2-7-2), then stop at any other decision.
 */
export function play(g: TestGame, card: InstanceId): void {
  const player = g.decider;
  act(g, { type: 'playCard', card });
  payFromActive(g, player);
}

function payFromActive(g: TestGame, player: PlayerId): void {
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player) return;
    const legal = g.legal();
    const pay = legal.find(
      (a) =>
        a.type === 'pick' &&
        typeof a.choice === 'object' &&
        a.choice !== null &&
        a.choice.from === 'costActive',
    );
    if (pay) {
      g.act(pay);
      continue;
    }
    const onlyDone = legal.length === 1 && legal[0]!.type === 'done';
    if (onlyDone) g.act(legal[0]!);
    return;
  }
}

/** Pick one card for a pending `choose` decision, then confirm with `done` if the engine asks. */
export function pickOne(g: TestGame, choice: InstanceId): void {
  const player = g.decider;
  act(g, { type: 'pick', choice });
  const d = decision(g);
  if (d?.kind === 'choose' && d.player === player && isLegal(g, { type: 'done' })) {
    act(g, { type: 'done' });
  }
}

export function don(g: TestGame, player: PlayerId) {
  return queries.don(g.state, player);
}

export function turn(g: TestGame) {
  return queries.turn(g.state);
}

export function result(g: TestGame) {
  return queries.result(g.state);
}

/** Instance ids in a zone, top first. */
export function ids(
  g: TestGame,
  player: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): string[] {
  return g.zone(player, zone).map((c) => c.instance);
}

/** Card ids in a zone, top first. */
export function cardIds(
  g: TestGame,
  player: PlayerId,
  zone: Parameters<TestGame['zone']>[1],
): CardId[] {
  return g.zone(player, zone).map((c) => c.card);
}

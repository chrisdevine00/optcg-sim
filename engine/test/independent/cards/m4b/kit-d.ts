/**
 * Helpers for the group D independent card tests (M4b wave 2). Public API and frozen fixtures only,
 * layered over `../kit.ts` (M4a). Nothing here reads a card script.
 */
import {
  queries,
  type CardId,
  type CardPlacement,
  type InstanceId,
  type PlayerId,
  type PlayerSpec,
  type ZoneName,
} from '@optcg/engine';
import { act, attack, cardIds, decision, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import { cardOf, choices, kind, canFinish, decider } from '../kit.ts';

export * from '../kit.ts';
export {
  act,
  attack,
  attackTargets,
  blockers,
  canAttack,
  decision,
  endTurn,
  isLegal,
  K,
  TRIGGER_SPEED,
  noDefence,
  passBlock,
  passCounter,
  takeDamage,
} from '../../helpers.ts';

// ---------------------------------------------------------------------------------------------
// Scenery. Stats are repeated where a test depends on them (all from cards/data).
// ---------------------------------------------------------------------------------------------

/** Leaders (all 5000 power; Life is whatever the scenario puts in the Life area). */
export const LD = {
  /** OP17-079 Black. Straw Hat Crew / The Four Emperors / Elbaph. Cards under test in file OP17-079. */
  elbaph: 'OP17-079',
  /** ST06-001 Sakazuki: Black. Type Navy only. [Activate: Main] with a (3) cost: inert here. */
  navy: 'ST06-001',
  /** OP07-038 Boa Hancock: Blue. Kuja Pirates / The Seven Warlords of the Sea (not multicolored). */
  kuja: 'OP07-038',
  /** OP14-041 Boa Hancock: Blue/Yellow (multicolored). Kuja Pirates / SWotS. */
  hancock: 'OP14-041',
  /** ST03-001 Crocodile: Blue. Baroque Works / The Seven Warlords of the Sea. */
  warlord: 'ST03-001',
  /** OP01-002 Trafalgar Law: Green/Red (multicolored). Heart Pirates / Supernovas. Activate only. */
  supernova: 'OP01-002',
  /** OP12-061 Donquixote Rosinante: Purple/Yellow (multicolored). Donquixote Pirates / Navy. */
  rosinante: 'OP12-061',
  /** ST01-001 Monkey.D.Luffy: Red. Straw Hat Crew / Supernovas. Activate only. */
  luffy: 'ST01-001',
  /** ST05-001 Shanks: Purple, mono, FILM / Four Emperors / Red-Haired Pirates. Activate only. */
  shanks: 'ST05-001',
} as const;

/** Vanilla (no effect text, no [Trigger]) Characters. */
export const V = {
  /** OP17-088 Hajrudin: Black, cost 7, 8000, Counter +2000, Giant / Elbaph / New Giant Pirates. */
  hajrudin7: 'OP17-088',
  /** OP02-097 Komille: Black, cost 1, 3000, Counter +1000, Navy. */
  komille: 'OP02-097',
  /** OP02-107 Doberman: Black, cost 2, 4000, Counter +1000, Navy. */
  doberman: 'OP02-107',
  /** OP02-116 Yamakaji: Black, cost 3, 5000, Counter +1000, Navy. */
  yamakaji: 'OP02-116',
  /** OP02-109 Jaguar.D.Saul: Black, cost 4, 6000, Counter +1000, Giant / Navy. */
  saul: 'OP02-109',
  /** OP12-052 Fullbody: Blue, cost 4, 6000, Counter +1000, Navy. */
  fullbody: 'OP12-052',
  /** OP06-049 Sengoku: Blue, cost 5, 7000, Counter +1000, Navy. */
  sengoku: 'OP06-049',
  /** OP11-094 Morgan: Black, cost 6, 8000, Counter +1000, Navy. */
  morgan: 'OP11-094',
  /** EB02-043 Jonathan: Black, cost 7, 9000, Counter +1000, Navy. */
  jonathan: 'EB02-043',
  /** OP08-048 Sweetpea: Blue, cost 4, 6000, Counter +1000, Amazon Lily. */
  sweetpea: 'OP08-048',
  /** OP16-112 Boa Hancock: Yellow, cost 6, 8000, Counter +1000, Kuja Pirates (no SWotS). */
  kuja8: 'OP16-112',
  /** OP02-054 Gecko Moria: Blue, cost 4, 6000, Counter +1000, SWotS / Thriller Bark Pirates. */
  moria4: 'OP02-054',
  /** OP06-094 Lola: Black, cost 4, 6000, Counter +1000, Thriller Bark Pirates. */
  lola: 'OP06-094',
  /** OP14-101 Oars: Yellow, cost 8, 10000, Counter +1000, Giant / Thriller Bark Pirates. */
  oars: 'OP14-101',
  /** OP04-087 Trafalgar Law: Black, cost 5, 7000, Counter +1000, Heart Pirates / Dressrosa. */
  law5: 'OP04-087',
  /** OP12-106 Trafalgar Law: Yellow, cost 6, 7000, Counter +1000, [Blocker]. */
  law6blocker: 'OP12-106',
  /** OP10-089 Nico Robin: Black, cost 6, 8000, Counter +1000, Straw Hat Crew / Dressrosa. */
  robin: 'OP10-089',
  /** P-015 Sunny-Kun: Red, cost 1, 3000, Counter +1000, FILM / Straw Hat Crew. */
  sunnyKun: 'P-015',
  /** OP09-063 Usopp: Purple, cost 4, 6000, Counter +1000, Straw Hat Crew. */
  usopp: 'OP09-063',
  /** OP07-043 Salome: Blue, cost 1, 2000, Kuja Pirates, with an [On Play] (never triggered when placed). */
  salomeKuja: 'OP07-043',
} as const;

/**
 * Characters with a [Trigger], for hands and Life. Only [Trigger]s that the engine scripts can be
 * activated (probed through `legalActions`): the group D cards and OP12-112. OP01-104 Speed,
 * ST03-013 and EB04-027 have a printed [Trigger] but offer no activation here, so they serve only as
 * "a card with a [Trigger]" in a hand (for "Character card with 6000 power or less and a [Trigger]").
 */
export const TR = {
  /** OP14-114 Ran: Yellow, cost 4, 5000, Kuja Pirates. [Trigger] If your Leader is Kuja Pirates, play this card. */
  ran: 'OP14-114',
  /** OP12-112 Baby 5: Yellow, cost 4, 5000, Counter +1000, Donquixote Pirates. [Trigger] If your Leader is multicolored, draw 2. */
  baby5: 'OP12-112',
  /** OP01-104 Speed: Purple, cost 2, 3000, [Trigger] Play this card (printed; not activatable here). */
  speed: 'OP01-104',
  /** EB04-027 Boa Hancock: Blue, cost 5, 7000, has a printed [Trigger]. */
  hancock7000: 'EB04-027',
} as const;

/**
 * One side with 4 Life and a 15-card deck of `filler`, plus whatever `spec` sets. Unlike `kit.side`
 * the Leader may be a placement (for example `{ card, don: 1 }` to give it a DON!!).
 */
export function side(
  leader: CardId | CardPlacement,
  filler: CardId,
  spec: Partial<PlayerSpec> = {},
): PlayerSpec {
  return { leader, life: rep(filler, 4), deck: rep(filler, 15), ...spec };
}

/** One deck card id repeated. */
export const rep = (card: CardId, n: number): CardId[] => Array.from({ length: n }, () => card);

// ---------------------------------------------------------------------------------------------
// Playing and reading
// ---------------------------------------------------------------------------------------------

/** Play `card` (first copy in `who`'s hand), paying from active DON!!, and return nothing. */
export function playFromHand(g: TestGame, card: CardId, who: PlayerId = 'p1'): void {
  play(g, g.find(who, 'hand', card));
}

/** Current cost of a card, as the engine derives it (null where a category has none). */
export function costOf(g: TestGame, instance: InstanceId): number | null {
  return g.card(instance).cost;
}

/** Card ids of a zone, top first. */
export function zoneCards(g: TestGame, player: PlayerId, zone: ZoneName): CardId[] {
  return cardIds(g, player, zone);
}

export function lifeTop(g: TestGame, player: PlayerId): CardId | undefined {
  return cardIds(g, player, 'life')[0];
}

/** Last `n` cards of the deck (bottom last). */
export function deckBottom(g: TestGame, player: PlayerId, n: number): CardId[] {
  const d = cardIds(g, player, 'deck');
  return d.slice(d.length - n);
}

export function deckTop(g: TestGame, player: PlayerId, n: number): CardId[] {
  return cardIds(g, player, 'deck').slice(0, n);
}

/** Sorted copy. */
export const sorted = <T>(xs: T[]): T[] => [...xs].sort();

/** A readable list of the pending offers, for failure messages. */
export function pending(g: TestGame): string {
  const d = decision(g);
  return `${d?.kind}/${d?.player}/${d?.purpose}: ${d?.prompt}`;
}

// ---------------------------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------------------------

/** Pick (one at a time) the first offered copy of each named card in the current `choose`. */
export function pickCards(g: TestGame, cards: CardId[]): InstanceId[] {
  const picked: InstanceId[] = [];
  for (const c of cards) {
    const inst = choices(g).find((i) => cardOf(g, i) === c && !picked.includes(i));
    if (!inst) throw new Error(`Cannot pick ${c}; offered ${choices(g).map((i) => cardOf(g, i))}`);
    act(g, { type: 'pick', choice: inst });
    picked.push(inst);
  }
  return picked;
}

/**
 * Pick these instances in the current `choose`, in the engine's candidate order (the order of the
 * offered picks: picks of an unordered set are canonical, ADR 0003), then confirm with `done`
 * unless the decision has moved on or the maximum was reached. Replaces `kit.choose`, which sorts by
 * instance id and so can pick a later candidate first and lose the earlier one.
 */
export function choose(g: TestGame, targets: InstanceId[]): void {
  const player = g.decider;
  const max0 = decision(g)?.max;
  const left = [...targets];
  while (left.length) {
    const next = choices(g).find((c) => left.includes(c));
    if (!next) {
      throw new Error(
        `Cannot pick ${left.map((t) => cardOf(g, t))}; offered: ${choices(g).map((i) => cardOf(g, i))} (${pending(g)})`,
      );
    }
    act(g, { type: 'pick', choice: next });
    left.splice(left.indexOf(next), 1);
  }
  if (decider(g) !== player || !canFinish(g)) return;
  // `Decision.max` counts the picks still allowed, so compare with the maximum seen before picking.
  const atMax = max0 !== undefined && targets.length >= max0;
  if (!atMax || choices(g).length === 0) act(g, { type: 'done' });
}

/** Confirm the current `choose` with `done` if that is legal (an "up to" decision or a full pick). */
export function finish(g: TestGame): void {
  if (kind(g) === 'choose' && canFinish(g)) act(g, { type: 'done' });
}

/** Pick the named cards and confirm. */
export function pickAndFinish(g: TestGame, cards: CardId[]): void {
  pickCards(g, cards);
  finish(g);
}

/** Answer every `order` decision owed by `player` with the first listed option. */
export function answerOrders(g: TestGame, player: PlayerId, limit = 10): void {
  for (let i = 0; i < limit; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'order' || d.player !== player) return;
    g.act(g.legal().find((a) => a.type === 'order')!);
  }
}

/** True when the game is back at a Main Phase decision for `player`. */
export function backToMain(g: TestGame, player: PlayerId = 'p1'): boolean {
  const d = decision(g);
  return d?.kind === 'main' && d.player === player;
}

// ---------------------------------------------------------------------------------------------
// Battles from the defender's side (p2's turn, p1 defends)
// ---------------------------------------------------------------------------------------------

/**
 * p2's Leader attacks p1's Leader; p1 does not block or counter; the damage step runs until the
 * first `trigger` decision (the Life card taken has a [Trigger]) or a Main decision.
 */
export function hitLeader(g: TestGame, attacker: InstanceId = g.leader('p2')): void {
  attack(g, attacker, g.leader('p1'));
  passBlock(g);
  if (decision(g)?.kind === 'counter') act(g, { type: 'endCounter' });
}

/** Activate the [Trigger] of the Life card being taken (the decision must be a `trigger`). */
export function activateTrigger(g: TestGame): void {
  if (kind(g) !== 'trigger') throw new Error(`Expected a trigger decision, got ${pending(g)}`);
  act(g, { type: 'trigger', activate: true });
}

/** DON!! count on a player's field (cost area plus given). */
export function donField(g: TestGame, player: PlayerId): number {
  const d = queries.don(g.state, player);
  return d.active + d.rested + d.given;
}

/** Constants and helpers for the Robin and Yellow Enel card tests (M4b wave 2). */
import { queries, type PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import { endCounter, expectDecision, game, passBlock, PLAIN_BLUE, V } from './helpers.ts';

/** OP09-062 Nico Robin: Purple/Yellow Leader, type Straw Hat Crew, 4 Life. */
export const ROBIN = 'OP09-062';
/** OP05-098 Enel: Yellow Leader, type Sky Island, 4 Life. */
export const ENEL = 'OP05-098';
/** OP17-107 Charlotte Daifuku: a 4000-power Big Mom Pirates card with a [Trigger] (play this card). */
export const TRIG = 'OP17-107';
/** OP03-100 Kingbaum: a 5000-power Big Mom Pirates card with a [Trigger] (no [Trigger] match for 4000). */
export const TRIG5 = 'OP03-100';
/** OP03-103 Bobbin the Disposer: vanilla Big Mom Pirates, cost 2, 4000, no [Trigger]. */
export const BMP = 'OP03-103';
/** OP03-106 Charlotte Opera: vanilla Big Mom Pirates, cost 4, 6000. */
export const BMP6 = 'OP03-106';
/** OP09-082 Avalo Pizarro: vanilla Blackbeard Pirates. */
export const BLACKBEARD = 'OP09-082';
/** OP14-101 Oars: vanilla Yellow, not Big Mom Pirates, cost 8. */
export const YELLOW8 = 'OP14-101';

/** p2 (Leader PLAIN_BLUE) attacks p1's Leader with a 7000 Character; p1 gets the next decisions. */
export function attackP1Leader(g: TestGame): void {
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
}

/** An opponent's-turn position: p2 will attack p1's Leader (p1 Life, hand etc. from `p1`). */
export function oppTurn(p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] }): TestGame {
  return game(p1, { leader: PLAIN_BLUE, characters: [V.c7] }, { turn: 4, activePlayer: 'p2' });
}

/** Let the attack run to the damage step: no block, no counter. */
export function throughBattle(g: TestGame): void {
  passBlock(g);
  endCounter(g);
}

/**
 * p2 hits p1's Leader and the top Life card `top` has a [Trigger]: p1 owes the `trigger` decision.
 * Unlike `damageWith`, p1's Leader is ENEL (no automatic effect that asks first) and p2 may have
 * more Characters (`oppChars`, besides the 7000 attacker).
 */
export function triggerHit(
  top: string,
  p1: Partial<PlayerSpec> = {},
  oppChars: (string | { card: string; rested?: boolean })[] = [],
): TestGame {
  const g = game(
    { leader: ENEL, life: [top, 'ST05-007'], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7, ...oppChars] },
    { turn: 4, activePlayer: 'p2' },
  );
  attackP1Leader(g);
  throughBattle(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** Place the cards of an `order` decision (bottom of deck) in the order offered first. */
export function settleOrder(g: TestGame): void {
  while (queries.decision(g.state)?.kind === 'order') g.act(g.legal()[0]!);
}

/** The card ids of a zone, top first. */
export const ids = (g: TestGame, p: 'p1' | 'p2', z: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, z).map((c) => c.card);

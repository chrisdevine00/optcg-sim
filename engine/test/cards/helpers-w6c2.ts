/**
 * Constants and helpers for the wave 6 group 2 card tests (OP10-027, OP11-102, OP12-058, OP12-075,
 * OP12-080, OP12-109, OP12-113, OP13-106, OP13-119, PRB01-001, ST16-002). Every card named below is
 * a vanilla, or an unscripted card whose text is inert where the test puts it.
 */
import type { PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  passBlock,
  PURPLE,
  V,
} from './helpers.ts';

export { activate, canPick, offeredAb, pickable } from './helpers-w3s.ts';
export { atMain, offeredPicks } from './helpers-w5c2.ts';
export { finishBattle } from './helpers-w4sb.ts';

/** [Kin'emon]: cost 2 / 1000 power (OP10-026, inert in a trash), cost 1 / 1000 [Scratchmen Apoo] is not one. */
export const KIN_1000 = 'OP10-026';
/** [Kin'emon] cost 6 / 8000, no text; cost 4 / 5000, a [Trigger] only. */
export const KIN_6 = 'OP12-025';
export const KIN_4 = 'ST28-003';
/** A 1000-power Character that is not a [Kin'emon] (its [On Play] is unscripted, inert in a trash). */
export const POWER_1000 = 'EB01-015';

/** Leaders: {Whitebeard Pirates} (its [Activate: Main] is unused), [Sanji] (same), {Supernovas} (same). */
export const WB_LEADER = 'ST13-002';
export const SANJI_LEADER = 'OP12-041';
export const SUPERNOVAS_LEADER = 'OP01-002';
/** A Leader that is none of those (its only text is an [Activate: Main]). */
export const OTHER_LEADER = PLAIN_PURPLE;

/** {Whitebeard Pirates} Characters, no text: cost 5, and cost 9 (an [On Play] that is not scripted). */
export const WB5 = 'OP02-006';
export const WB9 = 'OP02-004';
/** A {Whitebeard Pirates Allies} Character (cost 3, a type that includes "Whitebeard Pirates"), no text. */
export const WB_ALLY = 'ST22-004';
/** A {Whitebeard Pirates} Character of cost 10 (its [On Play] is not scripted) and a {Whitebeard Pirates} Event. */
export const WB10 = 'OP07-119';
export const WB_EVENT = 'OP02-022';
/** A [Counter] Event (cost 1) that gives your Leader +3000 power. */
export const COUNTER_EVENT = 'OP12-038';

/** {Supernovas} Characters, no text: cost 4 [Monkey.D.Luffy], cost 3 [Scratchmen Apoo]; cost 5 [Urouge]. */
export const SN4 = 'P-022';
export const SN3 = 'OP14-008';
export const SN5 = 'OP10-101';

/** A {Music} Event (cost 2, unscripted) and an Event that is not {Music}. */
export const MUSIC = 'P-058';
export const NOT_MUSIC = 'ST02-017';

/** Characters for [Rush]: cost 8 and 9 without an [On Play]; with a printed [On Play]; a [Trigger] only. */
export const COST8 = 'OP12-082';
export const COST9 = 'OP06-118';
export const WITH_ON_PLAY = 'EB03-034';
export const TRIGGER_ONLY = 'OP01-082';

export const ids = (g: TestGame, p: PlayerId, zone: Parameters<TestGame['zone']>[1]): string[] =>
  g.zone(p, zone).map((c) => c.card);

/** p2 attacks p1's Leader with V.c5 (turn 4); passes block, stops at the Counter Step of p1. */
export function p2Hits(
  p1: Partial<PlayerSpec> & { leader: PlayerSpec['leader'] },
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    p1,
    { leader: PLAIN_BLUE, ...p2, characters: [V.c5, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
  return g;
}

/** Pass the block step and end the counter step: the damage lands and a [Trigger] is asked. */
export function toDamage(g: TestGame): void {
  if (dec(g)?.kind === 'block') passBlock(g);
  if (dec(g)?.kind === 'counter') endCounter(g);
}

/** The pending decision is a [Trigger] question for `who`. */
export const atTrigger = (g: TestGame, who: PlayerId = 'p1'): void => {
  expectDecision(g, 'trigger', who);
};

/**
 * p2 (turn 4) attacks p1's Leader with a 9000 Character; p1's top Life card is `top`, then two
 * more. `p2.characters` are extra Characters p2 controls. Stops at p1's [Trigger] question.
 */
export function trigGame(
  top: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
): TestGame {
  const g = game(
    { leader: OTHER_LEADER, life: [top, PURPLE, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c7, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  toDamage(g);
  atTrigger(g);
  return g;
}

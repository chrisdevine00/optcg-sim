/**
 * Helpers and constants for the OP-10 group 4 card tests (OP10-018 ... OP10-021, OP10-039 ... 041,
 * OP10-059 ... 061, OP10-078 ... 080, OP10-096 ... 098, OP10-112, 113, 115, 117, 118, 119). Every
 * constant is a vanilla, or a card whose text is inert where the test puts it.
 */
import type { PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../fixtures/index.ts';
import {
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';

export { canPick, koBy, pickable, activate, offeredAb } from './helpers-w3s.ts';
export { buff, pw, trigGame } from './helpers-op11g1.ts';
export { ids, koByEffect, settle } from './helpers-op14g4.ts';

/** Red Leader {Straw Hat Crew}{Supernovas} (Activate only, never used). */
export const SN_LEADER = 'ST01-001';
/** Green Leader {Heart Pirates}{Supernovas}... not used; a non-Supernovas Leader: */
export const OTHER_LEADER = 'ST03-001';
/** {ODYSSEY} Leader [Lim] (its effects are inert here) and [Caesar Clown] ({Punk Hazard}). */
export const ODYSSEY_LEADER = 'OP09-022';
export const CAESAR = 'OP10-002';
/** [Smoker] is a {Punk Hazard} Leader that is not [Caesar Clown]. */
export const SMOKER = 'OP10-001';

/** {Supernovas} vanilla Characters: [Urouge] cost 5 / 7000 (Yellow), [Roronoa Zoro] cost 4 / 6000. */
export const SN5 = 'OP10-101';
export const SN4 = 'OP02-043';
/** {ODYSSEY} vanilla [Rob Lucci], cost 4 / 6000. */
export const ODY = 'OP09-038';
/** {Dressrosa} vanillas: cost 2 / 4000, cost 3 / 5000, cost 5 / 7000. */
export const DR2 = 'OP01-076';
export const DR3 = 'OP10-054';
export const DR5 = 'OP04-087';
/** {Donquixote Pirates} vanillas: cost 2 / 4000, cost 4 / 6000. */
export const DP2 = 'OP12-111';
export const DP4 = 'OP10-073';
/** {The Seven Warlords of the Sea} vanillas: cost 2 / 4000, 3 / 5000, 4 / 6000, 6 / 8000. */
export const SW = { c2: 'ST03-006', c3: 'ST03-002', c4: 'OP02-054', c6: 'OP02-055' } as const;
/** A {Seven Warlords} Character with cost 8 or less above 4 is [Mihawk] (6); an 8-cost vanilla: */
export const COST8 = 'OP12-082';

export const cardsOf = (g: TestGame, p: 'p1' | 'p2', zone: Parameters<TestGame['zone']>[1]) =>
  g.zone(p, zone).map((c) => c.card);

/** `n` copies of `card`. */
export const times = (n: number, card: string): string[] => Array.from({ length: n }, () => card);

/** A p1 position with 10 active DON!! and fixed decks; the opponent has a plain Leader. */
export function start(
  p1: Partial<PlayerSpec> & { leader?: PlayerSpec['leader'] } = {},
  p2: Partial<PlayerSpec> = {},
  extra: Parameters<typeof game>[2] = {},
): TestGame {
  return game(
    { leader: SN_LEADER, costArea: { active: 10, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2 },
    extra,
  );
}

/**
 * p2 (turn 4) attacks p1's Leader with a 9000-power Character (V.c7 unless given); nobody blocks;
 * p1 is at the Counter Step with `card` in hand and uses its [Counter] when `use` is true.
 */
export function counterGame(
  card: string,
  p1: Partial<PlayerSpec> = {},
  p2: Partial<PlayerSpec> = {},
  use = true,
  attacker: string = V.c7,
  ability = 'counter',
): TestGame {
  const g = game(
    { leader: SN_LEADER, hand: [card], costArea: { active: 4, rested: 0 }, ...p1 },
    { leader: PLAIN_BLUE, ...p2, characters: [attacker, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', attacker), target: g.leader('p1') });
  if (dec(g)?.kind === 'block') passBlock(g);
  expectDecision(g, 'counter', 'p1');
  if (use) g.act({ type: 'activate', card: g.find('p1', 'hand', card), ability });
  return g;
}

/**
 * Like `trigGame`, but the attacker's side (p2) is described in full: p2 attacks p1's Leader with a
 * 9000-power Character beside `p2.characters` and p1's top Life card `top` is revealed.
 */
export function trigAgainst(top: string, p2: Partial<PlayerSpec> = {}): TestGame {
  const g = game(
    { leader: SN_LEADER, life: [top, PURPLE] },
    { leader: PLAIN_BLUE, ...p2, characters: [V.c7, ...(p2.characters ?? [])] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

/** Finish the battle after the [Counter] resolved: pass the counter step, take damage as Life. */
export function finish(g: TestGame): void {
  if (dec(g)?.kind === 'counter') endCounter(g);
  while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
}

export { PURPLE, V };

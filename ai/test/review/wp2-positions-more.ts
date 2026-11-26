/**
 * More planted positions of the M8 WP2 tests: E07 (OP13-001 holds DON!! on purpose) and the Luffy
 * position where only the opponent's real hand decides whether a counter was needed.
 */
import { listOf } from '../support/scenario.ts';
import {
  defendWith,
  HAWKINS,
  HIDDEN,
  KAIDO,
  LUFFY,
  ROCKS,
  USOPP,
  ZORO,
  type Hidden,
} from './wp2-positions.ts';
import { build, lifeOf, step, type Spec } from './wp2-support.ts';

/** E07: 8 DON!!, Usopp (4), 1 given to the Leader, the Leader attacks; Usopp's end-of-turn restands 2. */
export function e07(h: Hidden = HIDDEN): Spec {
  return {
    seed: 4,
    turn: 8,
    activePlayer: 'p1',
    firstPlayer: 'p2',
    p1: {
      leader: LUFFY,
      hand: [USOPP, 'OP13-027', 'OP01-016'],
      life: lifeOf(4, ZORO),
      costArea: { active: 8, rested: 0 },
      decklist: listOf(LUFFY),
    },
    p2: {
      leader: ROCKS,
      hand: h.hand,
      life: h.life,
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS)
        .slice()
        .reverse()
        .slice(h.deckSeed % 5),
    },
  };
}

export const e07Record = (h: Hidden = HIDDEN) =>
  build(e07(h), 'p1', [
    step.play('p1', USOPP),
    ...step.give('p1', 'leader', 1),
    step.attack('p1', 'leader', 'leader'),
    step.endTurn('p1'),
  ]);

/**
 * Their Leader is Luffy (OP13-001): their archetype runs Zoro (OP13-037), which sets itself active
 * (cost 4). They hold 2 cards and 8 active DON!!, with one active and one rested Character, so
 * publicly two more hits are possible after the one you counter. At 3 Life (2 after taking it) that
 * is not provable; what they really hold decides.
 */
export function luffyHindsight(hand: string[], life: string[] = lifeOf(3, ZORO)): Spec {
  return {
    seed: 12,
    turn: 10,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: KAIDO,
      hand: [HAWKINS, 'OP17-054', 'OP17-050'],
      life: lifeOf(3, ZORO),
      costArea: { active: 0, rested: 0 },
      decklist: listOf(KAIDO),
    },
    p2: {
      leader: { card: LUFFY, don: 1 },
      characters: ['EB01-017', { card: 'EB01-017', rested: true }],
      hand,
      life,
      costArea: { active: 8, rested: 0 },
      decklist: listOf(LUFFY),
    },
  };
}

export const luffyRecord = (hand: string[], life?: string[]) =>
  build(
    luffyHindsight(hand, life),
    'p2',
    [step.attack('p2', 'leader', 'leader')],
    defendWith([HAWKINS]),
  );

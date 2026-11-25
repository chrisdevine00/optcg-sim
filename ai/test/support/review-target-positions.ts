/**
 * The attack-target positions of docs/design/explanations.md E08 and E09 as planted records
 * (M8 WP4), and a pair of "worlds" for the hidden-information differential: the same public
 * position with different cards in their hand, Life and deck.
 */
import type { Action, GameState } from '@optcg/engine';
import { lifeOf, listOf } from './scenario.ts';
import { attackAction, plantRecord, type Spec } from './review-plant.ts';

export const ROCKS = 'OP17-039';
export const KAIDO = 'OP17-058';
export const KING = 'EB04-031';
export const NEWGATE = 'OP17-040';
export const SHIKI = 'OP17-048';
export const HAWKINS = 'OP17-073';
/** +2000 [Counter] Events in Rocks's lists (explanations.md E01). */
export const ROCKS_PIRATES = 'OP17-056';
export const NO_AUTHORITY = 'OP17-055';

/**
 * E08, turn 7, your Main. You: Kaido Leader with 3 DON!! (8000), King 7000 active, three DON!! rested.
 * Them: Rocks Leader 5000, 4 Life, 3 cards; their only Character is Edward.Newgate (8000), rested.
 */
export function e08Spec(hidden: 'plain' | 'counters' = 'plain'): Spec {
  const counters = hidden === 'counters';
  return {
    seed: 5,
    turn: 7,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: { card: KAIDO, don: 3 },
      characters: [KING],
      life: lifeOf(4, KING),
      hand: [],
      costArea: { active: 0, rested: 3 },
      decklist: listOf(KAIDO),
    },
    p2: {
      leader: ROCKS,
      characters: [{ card: NEWGATE, rested: true }],
      life: counters ? [ROCKS_PIRATES, NO_AUTHORITY, ROCKS_PIRATES, NO_AUTHORITY] : lifeOf(4, KING),
      hand: counters ? [ROCKS_PIRATES, NO_AUTHORITY, ROCKS_PIRATES] : lifeOf(3, KING),
      costArea: { active: 0, rested: 0 },
      deck: (counters ? listOf(KAIDO) : listOf(ROCKS)).slice(0, 40),
    },
  };
}

/** What you did in E08: the Leader and King both attack their Leader, then end the turn. */
export const e08Plan = (s: GameState): Action[] => [
  attackAction(s, 'p1', KAIDO, 'leader'),
  attackAction(s, 'p1', KING, 'leader'),
  { type: 'endTurn', player: 'p1' },
];

/**
 * E09, turn 9, your Main. You: Rocks.D.Xebec Leader, Shiki 9000 active, two DON!! active that
 * nothing here spends. Them: Kaido Leader 5000, 2 Life, 2 cards; Basil Hawkins (1000) rested.
 */
export function e09Spec(hidden: 'plain' | 'counters' = 'plain'): Spec {
  const counters = hidden === 'counters';
  return {
    seed: 7,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: ROCKS,
      characters: [SHIKI],
      life: lifeOf(4, KING),
      hand: [],
      costArea: { active: 2, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: KAIDO,
      characters: [{ card: HAWKINS, rested: true }],
      life: counters ? [ROCKS_PIRATES, NO_AUTHORITY] : lifeOf(2, KING),
      hand: counters ? [ROCKS_PIRATES, NO_AUTHORITY] : lifeOf(2, KING),
      costArea: { active: 0, rested: 0 },
      deck: (counters ? listOf(ROCKS) : listOf(KAIDO)).slice(0, 40),
    },
  };
}

/** What you did in E09: Shiki attacks Hawkins. */
export const e09Plan = (s: GameState): Action[] => [
  attackAction(s, 'p1', SHIKI, HAWKINS),
  { type: 'endTurn', player: 'p1' },
];

export const e08Record = (hidden: 'plain' | 'counters' = 'plain') =>
  plantRecord(e08Spec(hidden), e08Plan);
export const e09Record = (hidden: 'plain' | 'counters' = 'plain') =>
  plantRecord(e09Spec(hidden), e09Plan);

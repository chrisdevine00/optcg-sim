/**
 * Planted positions of the M8 WP2 tests (E06, E04, E19 and their hidden-zone variants), shared by
 * the detector tests and the differential. The seat under review is p1 (human) unless noted.
 */
import { legalActions, queries, type Action, type GameState } from '@optcg/engine';
import { listOf } from '../support/scenario.ts';
import { build, counterWith, lifeOf, plainAnswer, step, type Spec } from './wp2-support.ts';

export const ROCKS = 'OP17-039';
export const KAIDO = 'OP17-058';
export const LUFFY = 'OP13-001';
export const LINLIN = 'OP17-049';
export const QUEEN = 'EB04-032';
export const ROCKS_PIRATES = 'OP17-056';
export const NO_AUTHORITY = 'OP17-055';
export const KYO = 'OP17-045';
export const SHIKI = 'OP17-048';
export const ZORO = 'EB04-007';
export const USOPP = 'OP14-022';

/** The hidden cards of the opponent (p2): permuted or replaced by the differential. */
export interface Hidden {
  hand: string[];
  life: string[];
  deckSeed: number;
}
export const HIDDEN: Hidden = {
  hand: ['OP17-054', 'OP17-050'],
  life: lifeOf(3, ZORO),
  deckSeed: 1,
};

/**
 * E06: game turn 8 (your 4th), going second: 8 DON!!. You (Rocks) play Charlotte Linlin (cost 5), then
 * your Leader (5000) attacks their Leader (Kaido, 5000, 3 Life). They play Queen (+1000): stopped.
 */
export function e06(h: Hidden = HIDDEN): Spec {
  return {
    seed: 3,
    turn: 8,
    activePlayer: 'p1',
    firstPlayer: 'p2',
    p1: {
      leader: ROCKS,
      hand: [LINLIN, ROCKS_PIRATES, NO_AUTHORITY, KYO, SHIKI],
      life: lifeOf(4, ZORO),
      costArea: { active: 8, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: KAIDO,
      hand: [QUEEN, ...h.hand],
      life: h.life,
      costArea: { active: 0, rested: 0 },
      decklist: listOf(KAIDO)
        .slice()
        .reverse()
        .slice(h.deckSeed % 5),
    },
  };
}

/** The opponent's answers: draw (never trash) for Linlin, counter with Queen while it is in hand. */
export const e06Answer = (s: GameState): Action => {
  const dec = queries.decision(s)!;
  if (dec.kind === 'counter' && queries.zone(s, 'p2', 'hand').some((c) => c.card === QUEEN))
    return counterWith(s, 'p2', QUEEN);
  if (dec.kind === 'choose' && dec.options)
    return { type: 'pick', choice: { option: dec.options[0]!.id }, player: dec.player };
  return plainAnswer(s);
};

export const e06Record = (h: Hidden = HIDDEN) =>
  build(
    e06(h),
    'p1',
    [step.play('p1', LINLIN), step.attack('p1', 'leader', 'leader'), step.endTurn('p1')],
    e06Answer,
  );

export const HAWKINS = 'OP17-073';
export const BUCKIN = 'OP08-051';

/** The human's answers at a defence: no block, play `counters` in order, then end the step. */
export const defendWith =
  (counters: string[]) =>
  (s: GameState): Action => {
    const dec = queries.decision(s)!;
    if (dec.kind === 'counter' && dec.player === 'p1') {
      const left = counters.find((c) => queries.zone(s, 'p1', 'hand').some((x) => x.card === c));
      if (left) return counterWith(s, 'p1', left);
    }
    if (dec.kind === 'choose') {
      const pick = legalActions(s).find((a) => a.type === 'pick' && typeof a.choice === 'string');
      if (pick) return pick;
    }
    return plainAnswer(s);
  };

/**
 * E04: their turn. You (Kaido, p1): 5 Life, 6 cards in hand. They (Rocks, p2): the Leader with 1 DON!!
 * (6000) attacks your Leader; every other Character of theirs is rested. You play Basil Hawkins (+2000).
 * `life` is your Life; `extra` replaces their rested Character by active ones.
 */
export function e04(h: Hidden = HIDDEN, life = 5, extra: string[] = []): Spec {
  return {
    seed: 8,
    turn: 10,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: KAIDO,
      hand: [HAWKINS, 'OP17-054', 'OP17-050', 'OP17-052', 'OP17-045', 'OP17-048'],
      life: lifeOf(life, ZORO),
      costArea: { active: 0, rested: 0 },
      decklist: listOf(KAIDO),
    },
    p2: {
      leader: { card: ROCKS, don: 1 },
      characters: extra.length > 0 ? extra : [{ card: ZORO, rested: true }],
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

export const e04Record = (h: Hidden = HIDDEN, life = 5, extra: string[] = []) =>
  build(e04(h, life, extra), 'p2', [step.attack('p2', 'leader', 'leader')], defendWith([HAWKINS]));

/**
 * E19: their turn. You (Rocks, p1): 3 Life; hand Rocks Pirates (+2000), Buckin (+1000), Kyo, Shiki.
 * They (Kaido, p2): the Leader with 2 DON!! (7000) attacks your Leader. You play Rocks Pirates: 7000
 * against 7000, and the hit lands.
 */
export function e19(h: Hidden = HIDDEN): Spec {
  return {
    seed: 9,
    turn: 8,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: ROCKS,
      hand: [ROCKS_PIRATES, BUCKIN, KYO, SHIKI],
      life: lifeOf(3, ZORO),
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: { card: KAIDO, don: 2 },
      hand: h.hand,
      life: h.life,
      costArea: { active: 0, rested: 0 },
      decklist: listOf(KAIDO)
        .slice()
        .reverse()
        .slice(h.deckSeed % 5),
    },
  };
}

export const e19Record = (h: Hidden = HIDDEN) =>
  build(e19(h), 'p2', [step.attack('p2', 'leader', 'leader')], defendWith([ROCKS_PIRATES]));

/**
 * B3B-R1 (docs/reviews/m6b-block3-A.md): an unlimited, effect-less [Activate: Main] (OP10-030
 * Smoker, EB04-016 Bird Neptunian: set up to 1 DON!! active, no cost, no Once Per Turn) is legal
 * again and again. The Pirate ranked `activate` above `endTurn`, saw an unchanged state tie, and
 * repeated it until the 2,000-action cap (seeds 5031, 5044, 5080 of the review's batch decks).
 * The planners now leave out an activation that changes nothing (`isNoOpActivation`).
 */
import { describe, expect, it, vi } from 'vitest';
import { legalActions, queries, reduce, type GameState, type PlayerId } from '@optcg/engine';
import { isNoOpActivation, type SimContext } from '../src/search/sim.ts';
import { cardMap } from './support.ts';
import { play, session, start, type Tier } from './support/scenario.ts';
import { playMatch } from './support/match.ts';

vi.setConfig({ testTimeout: 120_000 });

const cx = (me: PlayerId): SimContext =>
  ({
    cards: cardMap(),
    evalCtx: { me, first: true, cards: cardMap(), oppAvgCounter: 0 },
    stats: { rollouts: 0, actions: 0 },
  }) as unknown as SimContext;

/** p1's Main Phase with `card` on the board and `active` / `rested` DON!!. */
function pos(card: string, active: number, rested: number): GameState {
  return start({
    seed: 5,
    turn: 5,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-039',
      life: ['OP17-102', 'OP17-102', 'OP17-102', 'OP17-102'],
      characters: [card],
      costArea: { active, rested },
      decklist: ['OP17-102'],
    },
    p2: {
      leader: 'OP10-022',
      life: ['OP17-102', 'OP17-102', 'OP17-102', 'OP17-102'],
      costArea: { active: 2, rested: 0 },
      decklist: ['OP17-102'],
    },
  });
}

const activateOf = (s: GameState) => legalActions(s).find((a) => a.type === 'activate')!;
/** Activate, answering every prompt with the first pick or done, back to the Main decision. */
function activate(s: GameState): GameState {
  let t = reduce(s, activateOf(s)).state;
  for (let i = 0; i < 8 && queries.decision(t)!.kind !== 'main'; i++) {
    const acts = legalActions(t);
    t = reduce(
      t,
      acts.find((a) => a.type === 'pick') ?? acts.find((a) => a.type === 'done')!,
    ).state;
  }
  return t;
}

describe.each(['OP10-030', 'EB04-016'])(
  'B3B-R1 %s: set up to 1 DON!! active, unlimited',
  (card) => {
    it('is a no-op once a restriction is in place and every DON!! is active', () => {
      const s0 = pos(card, 5, 0);
      expect(activateOf(s0)).toBeDefined();
      // The first use still adds the "cannot set DON!! active" restriction: not a no-op.
      expect(isNoOpActivation(s0, activateOf(s0), 'p1', cx('p1'))).toBe(false);
      const s1 = activate(s0);
      expect(legalActions(s1).some((a) => a.type === 'activate')).toBe(true); // still legal
      expect(isNoOpActivation(s1, activateOf(s1), 'p1', cx('p1'))).toBe(true);
      // And again: a second identical restriction changes nothing either.
      expect(isNoOpActivation(activate(s1), activateOf(activate(s1)), 'p1', cx('p1'))).toBe(true);
    });

    it('is not a no-op while a rested DON!! can be set active (first use); the repeat is', () => {
      const s0 = pos(card, 2, 3);
      expect(isNoOpActivation(s0, activateOf(s0), 'p1', cx('p1'))).toBe(false);
      // After the first use took one, the restriction it set bars a second (2 DON!! stay rested):
      // the repeat does nothing, rested DON!! or not.
      const s1 = activate(s0);
      expect(queries.don(s1, 'p1').rested).toBe(2);
      expect(isNoOpActivation(s1, activateOf(s1), 'p1', cx('p1'))).toBe(true);
    });

    it.each<Tier>(['pirate', 'warlord', 'emperor'])(
      '%s uses it at most once with every DON!! active and ends its turn',
      (tier) => {
        const s0 = pos(card, 5, 0);
        const { steps, state } = play(s0, 'p1', { max: 60, ai: session('p1', s0, tier) });
        const uses = steps.filter((x) => x.player === 'p1' && x.action.type === 'activate');
        expect(uses.length).toBeLessThanOrEqual(1);
        expect(queries.turn(state).number).toBeGreaterThan(5);
      },
    );
  },
);

/** Seed 5044's two decks from the review's batch-weighted pool (a Smoker list against ST21-001). */
const counts = (leader: string, c: Record<string, number>) => ({
  leader,
  main: Object.entries(c).flatMap(([id, n]) => Array.from({ length: n }, () => id)),
});
const SEED_5044 = {
  p1: counts('ST21-001', {
    'OP15-020': 4,
    'OP16-013': 1,
    'ST15-002': 4,
    'OP09-003': 2,
    'EB05-061': 4,
    'ST31-005': 4,
    'ST21-012': 4,
    'ST15-005': 3,
    'OP11-014': 3,
    'ST21-017': 4,
    'ST21-006': 4,
    'OP02-013': 1,
    'OP16-020': 2,
    'ST15-003': 2,
    'OP12-012': 3,
    'OP09-002': 3,
    'OP10-008': 1,
    'ST15-004': 1,
  }),
  p2: counts('OP10-022', {
    'OP10-033': 4,
    'OP10-113': 1,
    'OP08-036': 2,
    'OP14-039': 1,
    'OP10-027': 1,
    'EB02-059': 3,
    'OP10-111': 3,
    'OP16-038': 4,
    'OP10-030': 4,
    'OP10-029': 2,
    'ST16-005': 3,
    'OP10-041': 3,
    'OP13-030': 1,
    'PRB02-005': 1,
    'OP10-101': 2,
    'OP13-108': 4,
    'OP16-030': 3,
    'ST20-004': 2,
    'OP16-106': 1,
    'EB04-053': 4,
    'OP05-110': 1,
  }),
};

describe('B3B-R1: a whole game with Smoker in a deck ends', () => {
  it.each(['pirate', 'warlord'] as const)(
    'seed 5044 (%s): finishes under the 2,000-action cap',
    (tier) => {
      const r = playMatch({ seed: 5044, decks: SEED_5044, tiers: { p1: tier, p2: tier } });
      expect(r.capped).toBe(false);
    },
  );
});

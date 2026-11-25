/**
 * Mulligan positions for the M8 WP2 tests: a real game from a seed, up to the seat's mulligan, and a
 * search for a seed whose opening hand has the shape a test needs.
 */
import { appendAction, createGame, queries, reduce, startRecord } from '@optcg/engine';
import type { Action, GameState, PlayerId, RecordWithSnapshots } from '@optcg/engine';
import { lookup, metaDecks } from '../support.ts';
import { shuffled } from './wp2-support.ts';

const ROCKS = 'OP17-039';

/** A game from `seed` up to p1's mulligan: p1 chooses to go first (or second). */
export function atMulligan(
  leader: string,
  seed: number,
  first: boolean,
  oppLeader = ROCKS,
  oppDeckSeed = 0,
): { state: GameState; hand: string[]; rec: (redraw: boolean) => RecordWithSnapshots } {
  const mine = metaDecks().find((d) => d.leader === leader)!;
  const theirs = metaDecks().find((d) => d.leader === oppLeader)!;
  const setup = {
    seed,
    decks: {
      p1: mine,
      p2: oppDeckSeed ? { ...theirs, main: shuffled(theirs.main, oppDeckSeed) } : theirs,
    },
    chooser: 'p1' as PlayerId,
  };
  const g = createGame({ ...setup, cards: lookup });
  const choose: Action = { type: 'chooseFirst', goFirst: first, player: 'p1' };
  let s = reduce(g.state, choose).state;
  // Whoever goes first answers first; p1 is the seat under review.
  const hand = (): string[] => queries.zone(s, 'p1', 'hand').map((c) => c.card);
  while (queries.decision(s)?.player !== 'p1' || queries.decision(s)?.kind !== 'mulligan') {
    const d = queries.decision(s)!;
    s = reduce(s, { type: 'mulligan', redraw: false, player: d.player }).state;
  }
  const state = s;
  return {
    state,
    hand: hand(),
    rec: (redraw) => {
      let r = startRecord({ setup: { seed, decks: setup.decks, chooser: 'p1' } }, g.state);
      let t = g.state;
      for (const a of [choose]) {
        t = reduce(t, a).state;
        r = appendAction(r, a, t);
      }
      while (queries.decision(t)?.player !== 'p1' || queries.decision(t)?.kind !== 'mulligan') {
        const d = queries.decision(t)!;
        const a: Action = { type: 'mulligan', redraw: false, player: d.player };
        t = reduce(t, a).state;
        r = appendAction(r, a, t);
      }
      const a: Action = { type: 'mulligan', redraw, player: 'p1' };
      return appendAction(r, a, reduce(t, a).state);
    },
  };
}

/** The first seed whose hand satisfies `want`. */
export function findSeed(
  leader: string,
  first: boolean,
  want: (hand: string[]) => boolean,
  from = 1,
): number {
  for (let seed = from; seed < from + 4000; seed++) {
    if (want(atMulligan(leader, seed, first).hand)) return seed;
  }
  throw new Error('no seed found');
}

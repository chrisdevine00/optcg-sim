/**
 * Finished `ReviewRecord`s of seeded AI games, for the review pipeline's tests, the 300-decision
 * fixture (scripts/review-fixture.ts) and the review bench.
 */
import {
  actionFromView,
  appendAction,
  createGame,
  startRecord,
  type DeckSpec,
  type PlayerId,
  type RecordWithSnapshots,
} from '@optcg/engine';
import type { Card } from '@optcg/cards';
import type { AiTier, ReviewRecord } from '../../src/index.ts';
import { cardMap, lookup, metaDecks } from '../support.ts';
import { playMatch } from './match.ts';

const pick = (leader: string): DeckSpec => metaDecks().find((d) => d.leader === leader)!;

export interface PlayedGame {
  record: ReviewRecord;
  /** The whole card set (the review worker is sent these, as the app sends `ctl.cards`). */
  cards: Card[];
  seed: number;
  /** Wall-clock ms the game took to play. */
  playMs: number;
  finished: boolean;
}

/** Play `seed` between the two tiers (Rocks p1, Kaido p2 by default) and record every action. */
export function playRecord(
  seed: number,
  tiers: Record<PlayerId, AiTier> = { p1: 'rookie', p2: 'rookie' },
  leaders: [string, string] = ['OP17-039', 'OP17-058'],
  seats: ReviewRecord['seats'] = { p1: 'human', p2: 'ai' },
): PlayedGame {
  const decks: Record<PlayerId, DeckSpec> = { p1: pick(leaders[0]), p2: pick(leaders[1]) };
  const t0 = performance.now();
  const init = createGame({ seed, cards: lookup, decks });
  let rec: RecordWithSnapshots = startRecord({ setup: { seed, decks } }, init.state);
  const m = playMatch({
    seed,
    decks,
    tiers,
    onDecision: (d) => {
      rec = appendAction(rec, actionFromView(d.before, d.player, d.action), d.after);
    },
  });
  const all = cardMap();
  return {
    record: { ...rec, seats, auto: [], rewinds: [] },
    // The whole set, as the app sends it (`ctl.cards`): the review samples cards the game never
    // showed (the seat's undrawn deck, the opponent's sourced list).
    cards: [...all.values()],
    seed,
    playMs: performance.now() - t0,
    finished: m.result !== null,
  };
}

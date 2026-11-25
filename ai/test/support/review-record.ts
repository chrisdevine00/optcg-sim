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
  /** Every card of the game (the review worker is sent these). */
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
  const defs = (init.state as unknown as { defs: Record<string, unknown> }).defs;
  const all = cardMap();
  return {
    record: { ...rec, seats, auto: [], rewinds: [] },
    cards: Object.keys(defs).map((id) => all.get(id)!),
    seed,
    playMs: performance.now() - t0,
    finished: m.result !== null,
  };
}

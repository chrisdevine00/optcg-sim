/**
 * The review fixture (M8 WP1): a seeded Pirate-vs-Pirate game played to at least 300 player-level
 * decisions, as a finished `ReviewRecord`. It is the 60 s gate's input (PLAN row 19): the e2e's
 * globalSetup and the review bench both call `makeFixture`, and `npx tsx scripts/review-fixture.ts
 * [out.json]` writes it to `test-results/review-fixture.json` (git-ignored). It is generated, never
 * committed: playing the seeds takes about 20 s and the record is large.
 *
 * Player-level decisions are the record's `moves()`: every action the AI took is its own move (an AI
 * action carries no `intentId`, so none merge). The fixture's seats are `p1: human, p2: ai`, the
 * reviewed shape (the review analyses the human's turns).
 */
import '../test-setup/scripts.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Card } from '@optcg/cards';
import type { ReviewRecord } from '@optcg/ai';
import { playRecord } from '../ai/test/support/review-record.ts';

export interface Fixture {
  record: ReviewRecord;
  cards: Card[];
  seed: number;
  /** Actions in the record: each a player-level decision. */
  decisions: number;
  /** Wall-clock ms the game took to play. */
  playMs: number;
}

export interface FixtureOptions {
  /** First seed to try; the next is tried when a game is shorter than `min`. Default 70_001. */
  seed?: number;
  /** Fewest decisions; default 300. */
  min?: number;
  /** Seeds to try before settling for the longest; default 12. */
  tries?: number;
  /** Progress lines (the CLI passes console.error). */
  log?: (line: string) => void;
}

export function makeFixture(opts: FixtureOptions = {}): Fixture {
  const min = opts.min ?? 300;
  const base = opts.seed ?? 70_001;
  let best: Fixture | null = null;
  for (let t = 0; t < (opts.tries ?? 12); t++) {
    const g = playRecord(base + t, { p1: 'pirate', p2: 'pirate' });
    opts.log?.(
      `seed ${g.seed}: ${g.record.actions.length} actions, ${Math.round(g.playMs / 1000)} s`,
    );
    if (!g.finished) continue;
    const f: Fixture = {
      record: g.record,
      cards: g.cards,
      seed: g.seed,
      decisions: g.record.actions.length,
      playMs: g.playMs,
    };
    if (!best || f.decisions > best.decisions) best = f;
    if (f.decisions >= min) return f;
  }
  if (!best) throw new Error('no finished game');
  return best;
}

if (process.argv[1] && /review-fixture\.[tj]s$/.test(process.argv[1])) {
  const out = process.argv[2] ?? 'test-results/review-fixture.json';
  const f = makeFixture({ log: (l) => console.error(l) });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(f));
  console.error(`wrote ${out}: seed ${f.seed}, ${f.decisions} decisions, ${f.cards.length} cards`);
}

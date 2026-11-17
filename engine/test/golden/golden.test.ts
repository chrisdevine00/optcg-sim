/**
 * Golden records (ADR 0004): recorded games whose replay must reproduce the stored summary hash,
 * every per-turn snapshot hash and the event-type sequence (M2-15).
 *
 * Re-recording a different result needs a version change (M2-07): an ENGINE_VERSION bump for an
 * engine change, or a new SCRIPTS_VERSION (added or changed effect scripts; random meta games run
 * them). With both versions unchanged, a different result is refused. Bump ENGINE_VERSION, then run
 *   UPDATE_GOLDEN=1 npx vitest run engine/test/golden && npx prettier --write engine/test/golden
 *
 * Known gap (review M4b-17): the guard accepts any SCRIPTS_VERSION change, so an engine change that
 * lands together with a script change can be re-recorded without an ENGINE_VERSION bump. Bump
 * ENGINE_VERSION by hand for every engine behaviour change, whatever else changed.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  appendAction,
  ENGINE_VERSION,
  reduce,
  replay,
  startRecord,
  summaryHash,
  type GameEvent,
  type GameRecord,
} from '../../src/index.ts';
import { hashString } from '../../src/hash.ts';
import { internals } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { playRandomGame } from '../support/random-game.ts';

interface Golden {
  note: string;
  record: GameRecord;
  expected: {
    hash: string;
    actions: number;
    turn: number;
    result: unknown;
    /** Summary hash at each turn boundary. */
    turnHashes: string[];
    /** Hash of the sequence of event types over the whole game. */
    eventTypes: string;
  };
}

const dir = new URL('./', import.meta.url);
const SEEDS: [string, number, 'random' | 'passive'][] = [
  ['rocks-vs-kaido-damage', 1001, 'random'],
  ['meta-random-deckout', 1005, 'passive'],
  ['meta-random-2', 2024, 'random'],
];

/** Replay a record step by step, collecting what the golden pins. */
function measure(record: GameRecord): Golden['expected'] {
  // One pass: each action is applied once to the state before it (replaying from the start for
  // every step was quadratic and took seconds on the meta goldens).
  let step = replay(record, cards(), 0);
  const events: GameEvent[] = [...step.events];
  let rec = startRecord(record.start, step.state);
  for (const action of record.actions) {
    step = reduce(step.state, action);
    events.push(...step.events);
    rec = appendAction(rec, action, step.state);
  }
  const all = { state: step.state };
  const s = internals(all.state);
  return {
    hash: summaryHash(all.state),
    actions: record.actions.length,
    turn: s.turn,
    result: s.result,
    turnHashes: rec.snapshots.map((x) => x.hash),
    eventTypes: hashString(events.map((e) => e.type).join(',')),
  };
}

if (process.env.UPDATE_GOLDEN) {
  for (const [name, seed, policy] of SEEDS) {
    const file = new URL(`${name}.json`, dir);
    const g = playRandomGame({
      seed,
      policy,
      decks: name.startsWith('rocks') ? [0, 12] : undefined,
    });
    const expected = measure(g.record);
    if (existsSync(file)) {
      const old = JSON.parse(readFileSync(file, 'utf8')) as Golden;
      // A changed game needs a new version: ENGINE_VERSION for an engine change, SCRIPTS_VERSION
      // (automatic, the script hash) for added or changed scripts (DECISIONS 2026-11-16).
      if (
        old.record.versions.engine === ENGINE_VERSION &&
        old.record.versions.scripts === g.record.versions.scripts &&
        old.expected.hash !== expected.hash
      )
        throw new Error(
          `${name}: the game changed but ENGINE_VERSION is still ${ENGINE_VERSION} and the scripts are unchanged. Bump ENGINE_VERSION first.`,
        );
    }
    const golden: Golden = {
      note: `Random legal game, seed ${seed}, ${policy} policy. Engine ${ENGINE_VERSION}.`,
      record: g.record,
      expected,
    };
    writeFileSync(file, JSON.stringify(golden) + '\n');
  }
}

describe('golden records', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  it('exist', () => expect(files.length).toBeGreaterThanOrEqual(3));
  for (const f of files) {
    it(`${f} was recorded by this engine version and replays to its recorded hashes`, () => {
      const g = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as Golden;
      // A behaviour change must bump ENGINE_VERSION, which fails here until goldens are re-recorded.
      expect(g.record.versions.engine).toBe(ENGINE_VERSION);
      expect(measure(g.record)).toEqual(g.expected);
    });
  }
});

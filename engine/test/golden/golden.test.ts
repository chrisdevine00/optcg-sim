/**
 * Golden records (ADR 0004): recorded games whose replay must reproduce the stored summary hash.
 * Re-record deliberately when ENGINE_VERSION changes: UPDATE_GOLDEN=1 npx vitest run engine/test/golden && npx prettier --write engine/test/golden
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replay, summaryHash, ENGINE_VERSION, type GameRecord } from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { playRandomGame } from '../support/random-game.ts';

interface Golden {
  note: string;
  record: GameRecord;
  expected: { hash: string; actions: number; turn: number; result: unknown };
}

const dir = new URL('./', import.meta.url);
const SEEDS: [string, number, 'random' | 'passive'][] = [
  ['rocks-vs-kaido-damage', 1001, 'random'],
  ['meta-random-deckout', 1005, 'passive'],
  ['meta-random-2', 2024, 'random'],
];

if (process.env.UPDATE_GOLDEN) {
  for (const [name, seed, policy] of SEEDS) {
    const g = playRandomGame({
      seed,
      policy,
      decks: name.startsWith('rocks') ? [0, 12] : undefined,
    });
    const s = internals(g.final);
    const golden: Golden = {
      note: `Random legal game, seed ${seed}, ${policy} policy. Engine ${ENGINE_VERSION}.`,
      record: { ...g.record, versions: { ...g.record.versions, cards: 'golden' } },
      expected: {
        hash: summaryHash(g.final),
        actions: g.record.actions.length,
        turn: s.turn,
        result: s.result,
      },
    };
    writeFileSync(new URL(`${name}.json`, dir), JSON.stringify(golden) + '\n');
  }
}

describe('golden records', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  it('exist', () => expect(files.length).toBeGreaterThanOrEqual(3));
  for (const f of files) {
    it(`${f} replays to its recorded hash`, () => {
      const g = JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as Golden;
      const step = replay(g.record, cards());
      const s = internals(step.state);
      expect(g.record.actions.length).toBe(g.expected.actions);
      expect(s.result).toEqual(g.expected.result);
      expect(s.turn).toBe(g.expected.turn);
      expect(summaryHash(step.state)).toBe(g.expected.hash);
    });
  }
});

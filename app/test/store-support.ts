/** Test support for the M8 WP5 store tests: a real finished game as a `SessionRecord`, and fixtures. */
import { appendAction, startRecord } from '@optcg/engine';
import type { Explanation, TurnResult } from '@optcg/ai';
import { playRandomGame } from '../../engine/test/support/random-game.ts';
import { cards as engineCards } from '../../engine/test/fixtures/index.ts';
import type { SessionRecord } from '../src/session/index.ts';
import type { StoredGame, StoredReview } from '../src/store/index.ts';

export const lookup = engineCards();

/** A random legal game from the pinned meta decks, with a snapshot at every turn boundary. */
export function sessionRecord(seed: number): SessionRecord {
  const g = playRandomGame({ seed, keepStates: true });
  let rec = startRecord(g.record.start, g.states[0]!);
  g.record.actions.forEach((a, i) => {
    rec = appendAction(rec, a, g.states[i + 1]!);
  });
  return { ...rec, seats: { p1: 'human', p2: 'ai' }, rewinds: [], auto: [] };
}

export function storedGame(id: string, endedAt: number, record: SessionRecord): StoredGame {
  return {
    id,
    record,
    meta: {
      result: 'lost',
      me: 'p1',
      myLeader: 'OP01-001',
      opponentLeader: 'OP01-002',
      tier: 'rookie',
      deckName: 'Test deck',
      turns: record.snapshots.at(-1)?.turn ?? 0,
      endedAt,
      tags: [],
      versions: record.versions,
    },
  };
}

export const explanation = (claim: string): Explanation => ({
  conceptId: 'E01',
  claim,
  evidence: [{ text: 'Their board had 5000 power.', figures: { power: 5000 } }],
  line: [{ kind: 'attack', text: 'Attack their Leader', card: 'OP01-001' }],
  outcome: 'You win this turn.',
  certainty: 'any-hand',
  nextTime: 'Count first.',
  lessonId: 'L01',
  sources: ['CR 7-1'],
});

export function storedReview(gameId: string): StoredReview {
  const result: TurnResult = {
    itemId: 'missed-lethal:3:10',
    turn: 3,
    flags: [
      {
        id: 'missed-lethal:3:10',
        kind: 'missed-lethal',
        turn: 3,
        player: 'p1',
        restoreIndex: 9,
        decisionIndex: 10,
        severity: 'severe',
        certainty: 'any-hand',
        explanation: explanation('You had lethal.'),
        did: [{ kind: 'endTurn', text: 'End turn' }],
        practice: { judge: 'win-this-turn', turn: 3 },
      },
    ],
    notes: [explanation('Not flagged: no counter was needed.')],
    marker: { turn: 3, kind: null, reason: 'search-incomplete' },
  };
  return {
    gameId,
    analysisVersion: 1,
    engineVersion: '0.5.18',
    status: 'complete',
    results: { [result.itemId]: result },
    markers: [{ turn: 5, kind: 'target', reason: 'deadline' }],
    practised: { 'missed-lethal:3:10': 'solved' },
  };
}

/** A `Storage` that lives in a Map, for the localStorage migration. */
export class FakeStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

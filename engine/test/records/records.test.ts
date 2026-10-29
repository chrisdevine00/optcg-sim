/** Records, replay, snapshots and hashes (ARCHITECTURE §2.9, ADR 0004). */
import { describe, expect, it } from 'vitest';
import {
  appendAction,
  checkInvariants,
  createFromScenario,
  ENGINE_VERSION,
  legalActions,
  reduce,
  replay,
  RecordVersionMismatch,
  startRecord,
  summaryHash,
  type GameRecord,
  type ScenarioSpec,
} from '../../src/index.ts';
import { internals } from '../../src/testing.ts';
import { cards } from '../fixtures/index.ts';
import { KAIDO, LUFFY, PUR_1, RED_1, times } from '../support/game.ts';
import { pickAction, playRandomGame } from '../support/random-game.ts';
import { seedRng } from '../../src/index.ts';

describe('replay', () => {
  it('replays a record to the same summary hash, and to any prefix', () => {
    const g = playRandomGame({ seed: 4242, keepStates: true });
    expect(summaryHash(replay(g.record, cards()).state)).toBe(summaryHash(g.final));
    for (const k of [0, 1, 10, 57]) {
      expect(summaryHash(replay(g.record, cards(), k).state)).toBe(summaryHash(g.states[k]!));
    }
  });

  it('a record from another engine version is not replayed live', () => {
    const g = playRandomGame({ seed: 5 });
    const old: GameRecord = { ...g.record, versions: { ...g.record.versions, engine: '0.0.1' } };
    expect(() => replay(old, cards())).toThrow(RecordVersionMismatch);
  });

  it('records can start from a scenario', () => {
    const spec: Omit<ScenarioSpec, 'cards'> = {
      seed: 3,
      turn: 3,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: { leader: LUFFY, deck: times(8, RED_1), life: times(2, RED_1) },
      p2: { leader: KAIDO, deck: times(8, PUR_1), life: times(2, PUR_1) },
    };
    let state = createFromScenario({ ...spec, cards: cards() }).state;
    const record: GameRecord = {
      versions: { engine: ENGINE_VERSION, cards: 'test', scripts: 'none' },
      start: { scenario: spec },
      actions: [],
    };
    let rng = seedRng(1);
    for (let i = 0; i < 40 && internals(state).result === null; i++) {
      let a;
      [a, rng] = pickAction(legalActions(state), rng);
      state = reduce(state, a).state;
      record.actions.push(a);
    }
    expect(summaryHash(replay(record, cards()).state)).toBe(summaryHash(state));
  });
});

describe('snapshots', () => {
  it('a snapshot is taken at the start, at each turn boundary and at the end', () => {
    const g = playRandomGame({ seed: 77, keepStates: true });
    let rec = startRecord(g.record.start, 'test', g.states[0]!);
    g.record.actions.forEach((a, i) => {
      rec = appendAction(rec, a, g.states[i + 1]!);
    });
    const turns = rec.snapshots.map((s) => s.turn);
    expect(turns[0]).toBe(0);
    expect(new Set(turns.slice(0, -1)).size).toBe(turns.length - 1);
    expect(rec.snapshots.at(-1)!.hash).toBe(summaryHash(g.final));
    expect(rec.snapshots.at(-1)!.views.p1.result).not.toBeNull();
    for (const snap of rec.snapshots) {
      expect(summaryHash(replay(rec, cards(), snap.actionIndex).state)).toBe(snap.hash);
    }
  });
});

describe('summaryHash', () => {
  it('is deterministic, and changes when the game changes', () => {
    const a = playRandomGame({ seed: 8, keepStates: true });
    const b = playRandomGame({ seed: 8, keepStates: true });
    expect(summaryHash(a.final)).toBe(summaryHash(b.final));
    expect(summaryHash(a.states[3]!)).not.toBe(summaryHash(a.states[4]!));
  });

  it('ignores instance ids: the same game with re-labelled ids hashes the same', () => {
    const g = playRandomGame({ seed: 9 });
    const s = internals(g.final);
    const map = new Map(Object.keys(s.cards).map((id, i) => [id, `x${i}`]));
    const relabel = JSON.parse(
      JSON.stringify(s).replace(
        /"c[a-z0-9]{7}"/g,
        (m) => `"${map.get(m.slice(1, -1)) ?? m.slice(1, -1)}"`,
      ),
    );
    expect(summaryHash(relabel)).toBe(summaryHash(g.final));
  });
});

describe('checkInvariants', () => {
  it('is clean on a real game and catches corruption', () => {
    const g = playRandomGame({ seed: 10, keepStates: true });
    const s = internals(g.states[30]!);
    expect(checkInvariants(g.states[30]!)).toEqual([]);
    const dup = {
      ...s,
      players: {
        ...s.players,
        p1: { ...s.players.p1, hand: [...s.players.p1.hand, s.players.p1.leader] },
      },
    };
    expect(checkInvariants(dup as never).join('\n')).toMatch(/two places/);
    const don = {
      ...s,
      players: { ...s.players, p2: { ...s.players.p2, donDeck: s.players.p2.donDeck + 1 } },
    };
    expect(checkInvariants(don as never).join('\n')).toMatch(/DON!! in total/);
    const nodec = { ...s, decision: null };
    expect(checkInvariants(nodec as never).join('\n')).toMatch(/No decision/);
    const six = {
      ...s,
      players: {
        ...s.players,
        p1: { ...s.players.p1, characters: ['a', 'b', 'c', 'd', 'e', 'f'] },
      },
    };
    expect(checkInvariants(six as never).join('\n')).toMatch(/max 5/);
  });
});

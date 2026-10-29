/**
 * Named scenario starts (ADR 0013) for tests and the accessibility script: `/play?scenario=defend`.
 * Each is a described position; the engine validates it with its invariants.
 */
import type { ScenarioSpec } from '@optcg/engine';

type Spec = Omit<ScenarioSpec, 'cards'> & { mode: 'ai' | 'hotseat' };

const filler = (id: string, n: number) => Array.from({ length: n }, () => id);

export const SCENARIOS: Record<string, Spec> = {
  /** p2 (hotseat) is about to attack p1's Leader. p1 holds three +1000 Counters and a Blocker. */
  defend: {
    mode: 'hotseat',
    seed: 7,
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'ST01-001',
      life: ['OP01-010', 'OP01-012', 'ST01-003'],
      hand: ['OP01-010', 'ST01-003', 'OP01-012', 'OP01-023'],
      characters: ['OP09-072'],
      deck: filler('OP01-010', 10),
      costArea: { active: 3, rested: 0 },
    },
    p2: {
      leader: { card: 'ST04-001', don: 2 },
      life: ['OP01-010', 'OP01-012'],
      hand: ['OP01-010'],
      deck: filler('OP01-012', 10),
      costArea: { active: 2, rested: 2 },
    },
  },
  /** p1 has a full Character area and a playable Character: the sixth asks to trash one (choose). */
  full: {
    mode: 'ai',
    seed: 9,
    turn: 3,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'ST01-001',
      life: ['OP01-010', 'OP01-012'],
      hand: ['OP01-012', 'OP01-010'],
      characters: ['OP01-010', 'ST01-003', 'OP01-012', 'OP01-023', 'OP01-018'],
      deck: filler('OP01-010', 10),
      costArea: { active: 4, rested: 0 },
    },
    p2: {
      leader: 'ST04-001',
      life: ['OP01-010', 'OP01-012'],
      hand: ['OP01-010', 'OP01-012'],
      deck: filler('OP01-012', 10),
      costArea: { active: 0, rested: 4 },
    },
  },
  /** The AI is at 0 Life on p1's turn: one hit wins (a short game to completion). */
  lethal: {
    mode: 'ai',
    seed: 3,
    turn: 5,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: { card: 'ST01-001', don: 0 },
      life: ['OP01-010', 'OP01-012', 'ST01-003'],
      hand: ['OP01-010', 'OP01-012'],
      characters: ['OP01-023'],
      deck: filler('OP01-010', 10),
      costArea: { active: 4, rested: 0 },
    },
    p2: {
      leader: 'ST04-001',
      life: [],
      hand: [],
      deck: filler('OP01-012', 10),
      costArea: { active: 0, rested: 5 },
    },
  },
};

export const scenarioCardIds = (s: Spec): string[] => {
  const ids: string[] = [];
  for (const p of [s.p1, s.p2]) {
    const one = (x: string | { card: string } | undefined) =>
      x && ids.push(typeof x === 'string' ? x : x.card);
    one(p.leader);
    one(p.stage);
    for (const k of ['hand', 'deck', 'life', 'characters', 'trash', 'decklist'] as const)
      for (const x of (p[k] ?? []) as (string | { card: string })[]) one(x);
  }
  return ids;
};

/**
 * Named scenario starts (ADR 0013) for tests and the accessibility script: `/play?scenario=defend`.
 * Each is a described position; the engine validates it with its invariants.
 */
import type { ScenarioSpec } from '@optcg/engine';

type Spec = Omit<ScenarioSpec, 'cards'> & { mode: 'ai' | 'hotseat' };

const filler = (id: string, n: number) => Array.from({ length: n }, () => id);

export const SCENARIOS: Record<string, Spec> = {
  /**
   * Review M3-35: Player 2's Character attacks; Player 1's Kaido Leader (OP17-058) offers its
   * [On Your Opponent's Attack] DON!! −1 while Player 1's hand is veiled. Private cards have
   * unique names, for the leak checks.
   */
  veiled: {
    mode: 'hotseat',
    seed: 3,
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-058',
      // Vergo, Krieg
      life: ['OP01-065', 'OP01-066'],
      // Hajrudin, Shinobu
      hand: ['OP01-018', 'OP01-043'],
      // Mocha
      deck: filler('OP01-081', 10),
      costArea: { active: 2, rested: 0 },
    },
    p2: {
      leader: 'ST01-001',
      // Fukurokuju
      life: ['OP01-110'],
      // Urashima
      hand: ['OP01-092'],
      characters: ['OP01-023'],
      // Mohji
      deck: filler('OP02-060', 10),
      costArea: { active: 0, rested: 2 },
    },
  },
  /**
   * Review M3-28: Player 2 attacks (Player 1 defends), then Player 1 wins on their own turn by
   * hitting a Leader at 0 Life. The game ends after a defence alert was spoken.
   */
  last: {
    mode: 'hotseat',
    seed: 5,
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'ST01-001',
      life: ['OP01-010', 'OP01-012', 'ST01-003'],
      hand: ['OP01-010'],
      deck: filler('OP01-010', 10),
      costArea: { active: 3, rested: 0 },
    },
    p2: {
      leader: { card: 'ST04-001', don: 2 },
      life: [],
      hand: [],
      deck: filler('OP01-012', 10),
      costArea: { active: 0, rested: 2 },
    },
  },
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
  /**
   * Hotseat leak walk (review M3-01..04): every private card has a name no other card shares, so
   * a test can look for each one. Player 2 attacks; Player 1 defends.
   */
  leak: {
    mode: 'hotseat',
    seed: 11,
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'ST01-001',
      // Vergo, Krieg, Bellamy
      life: ['OP01-065', 'OP01-066', 'OP01-076'],
      // Hajrudin, Shinobu, Jean Bart, Wire
      hand: ['OP01-018', 'OP01-043', 'OP01-045', 'OP01-053'],
      characters: ['OP09-072'],
      // Mocha
      deck: filler('OP01-081', 10),
      costArea: { active: 3, rested: 0 },
    },
    p2: {
      leader: { card: 'ST04-001', don: 2 },
      // Fukurokuju, Atmos
      life: ['OP01-110', 'OP02-003'],
      // Urashima, Babanuki
      hand: ['OP01-092', 'OP01-107'],
      // Mohji
      deck: filler('OP02-060', 10),
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
  /** Rookie's turn; with this seed its first move attacks your Leader while you hold Counters. */
  skip: {
    mode: 'ai',
    seed: 3,
    turn: 4,
    activePlayer: 'p2',
    firstPlayer: 'p1',
    p1: {
      leader: 'ST01-001',
      life: ['OP01-010', 'OP01-012'],
      hand: ['OP01-010', 'OP01-012'],
      deck: filler('OP01-010', 10),
      costArea: { active: 0, rested: 4 },
    },
    p2: {
      leader: { card: 'ST04-001', don: 2 },
      life: ['OP01-010', 'OP01-012'],
      hand: [],
      deck: filler('OP01-012', 10),
      costArea: { active: 0, rested: 2 },
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
  /**
   * M4a: p1's Kaido Leader (OP17-058) with 1 DON!! attacks; its [When Attacking] DON!! −1 can give
   * the AI's Babanuki −2000 (a real scripted effect resolved through the UI).
   */
  kaido: {
    mode: 'ai',
    seed: 5,
    turn: 3,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP17-058',
      life: ['ST05-007', 'ST05-007', 'ST05-007'],
      hand: [],
      deck: filler('ST05-007', 10),
      costArea: { active: 1, rested: 0 },
    },
    p2: {
      leader: 'ST04-001',
      life: ['OP01-010', 'OP01-012', 'OP01-010'],
      hand: [],
      characters: ['OP01-107'],
      deck: filler('OP01-012', 10),
      costArea: { active: 0, rested: 2 },
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

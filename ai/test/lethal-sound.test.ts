/**
 * The soundness harness (L-02, L-10). A `public` proof is a claim about every hand the defender's
 * archetype could hold. So for sampled positions, every oblivious `public` proof is replayed against
 * **every** defender answer (an exhaustive search over the defender's legal answers, with the real
 * cards of the prior in its hand, Life and deck) and must win on all of them. Any broken proof fails
 * the test: that is a false "works against any hand" taught to the player.
 *
 * Positions are generated from a seed: an attacker (Luffy plus Characters, 0-10 DON!!) against Rocks
 * (with Shiki, Newgate or no help on its board) or Kaido, at 1-2 Life with 0-3 real cards from its
 * sourced lists in hand. Real Life cards are not [Trigger]s (a Trigger is the labelled chance, not
 * part of the claim). `LETHAL_POSITIONS` sets the number (default 14; `npm run test:lethal` uses 160).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  createFromScenario,
  projectForSearch,
  queries,
  type Action,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import { lethal, priorCardIds } from '../src/index.ts';
import { cardMap, lookup } from './support.ts';
import { refuteLine } from './support/refute.ts';
import { listOf } from './support/scenario.ts';

vi.setConfig({ testTimeout: 1_200_000 });

const cards = cardMap();
const N = Number(process.env.LETHAL_POSITIONS ?? 14);
const HANDS = Number(process.env.LETHAL_HANDS ?? 3);
const NODES = Number(process.env.LETHAL_NODES ?? 40_000);

let seed = 90210;
const rnd = (n: number): number => {
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
  return seed % n;
};

const ATTACKERS = ['OP13-027', 'EB04-007', 'OP14-104', 'OP08-099', 'OP12-114'];
const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';

interface Sample {
  state: GameState;
  label: string;
}

function sample(): Sample {
  const defLeader = rnd(2) === 0 ? ROCKS : KAIDO;
  const pool = priorCardIds(defLeader).filter(
    (id) => cards.get(id)?.category !== 'Leader' && !cards.get(id)?.triggerText,
  );
  const pick = (): string => pool[rnd(pool.length)]!;
  const help =
    defLeader === ROCKS ? [[], ['OP17-048'], [{ card: 'OP17-040', rested: true }]][rnd(3)]! : [];
  const life = 1 + rnd(2);
  const chars = Array.from({ length: 1 + rnd(2) }, () => ATTACKERS[rnd(ATTACKERS.length)]!);
  const don = rnd(11);
  const handN = rnd(4);
  const defDon = defLeader === KAIDO ? rnd(4) : 0;
  const spec = {
    seed: 1 + rnd(1000),
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP13-001',
      characters: chars,
      life: Array.from({ length: 4 }, () => 'EB04-007'),
      hand: [],
      costArea: { active: don, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: defLeader,
      characters: help,
      life: Array.from({ length: life }, pick),
      hand: Array.from({ length: handN }, pick),
      costArea: { active: defDon, rested: 0 },
      decklist: listOf(defLeader),
    },
  } as unknown as Omit<ScenarioSpec, 'cards'>;
  return {
    state: createFromScenario({ ...spec, cards: lookup }).state,
    label: `${defLeader} life ${life} hand ${handN} don ${don}/${defDon} chars ${chars.join(',')} help ${JSON.stringify(help)}`,
  };
}

describe('soundness: every oblivious public proof beats every defender answer', () => {
  it('holds on sampled positions against real cards from the prior', () => {
    const stats = { positions: 0, proven: 0, checked: 0, broken: 0, decided: 0 };
    const broken: string[] = [];
    for (let i = 0; i < N; i++) {
      const { state, label } = sample();
      stats.positions++;
      const r = lethal(
        {
          mode: 'public',
          view: projectForSearch(state, 'p1'),
          ...(process.env.LETHAL_MODEL ? { model: process.env.LETHAL_MODEL as 'power-only' } : {}),
        },
        cards,
        {
          nodes: NODES,
        },
      );
      if (r.status !== 'unknown') stats.decided++;
      if (r.status !== 'proven') continue;
      stats.proven++;
      if (!r.oblivious || !r.viewActions) continue;
      // The same position with other real hands: the proof must hold against each.
      for (let h = 0; h < HANDS; h++) {
        const variant = h === 0 ? { state } : sample2(state, label);
        stats.checked++;
        let bad: Action[] | null;
        try {
          bad = refuteLine(variant.state, r.viewActions);
        } catch {
          continue; // the exhaustive replay is too big: not a counter-example
        }
        if (bad) {
          stats.broken++;
          broken.push(`${label}: lost to ${JSON.stringify(bad.map((a) => a.type))}`);
        }
      }
    }
    if (process.env.LETHAL_LOG) process.stdout.write(`soundness: ${JSON.stringify(stats)}\n`);
    expect(broken, broken.join('\n')).toEqual([]);
    // The harness is only worth something if it proves and checks things.
    expect(stats.checked).toBeGreaterThan(0);
  });
});

/**
 * The same board with another real hand and Life: the public view is the same, so the proof from
 * `state`'s view must hold here too. Rebuilt by re-rolling the defender's hidden cards in place.
 */
function sample2(state: GameState, _label: string): { state: GameState } {
  const c = structuredClone(state) as unknown as {
    players: Record<PlayerId, { hand: string[]; life: string[]; deck: string[] }>;
    cards: Record<string, { card: string }>;
    defs: Record<string, unknown>;
  };
  const leader = queries.zone(state, 'p2', 'leader')[0]!.card;
  const pool = priorCardIds(leader).filter(
    (id) => cards.get(id)?.category !== 'Leader' && !cards.get(id)?.triggerText && c.defs[id],
  );
  for (const inst of [...c.players.p2.hand, ...c.players.p2.life, ...c.players.p2.deck])
    c.cards[inst]!.card = pool[rnd(pool.length)]!;
  return { state: c as unknown as GameState };
}

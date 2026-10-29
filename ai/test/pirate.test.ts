/**
 * Pirate (ARCHITECTURE §4.2, PLAN §5 "ai"): legal-only and view-only, deterministic under an
 * iteration budget, blind to hidden cards, within its budgets, and sensible on defence: lethal is
 * always defended where possible, and no Counter is thrown away.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { internals } from '../../engine/src/testing.ts';
import { canSee } from '../../engine/src/project.ts';
import { AiSession, BUDGETS } from '../src/index.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch, type DecisionRecord } from './support/match.ts';
import { lifeOf, listOf, session, start } from './support/scenario.ts';

// Searching tests: CI runners are several times slower than a desktop.
vi.setConfig({ testTimeout: 60_000 });

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const decks = () => {
  const all = metaDecks();
  return {
    rocks: all.find((d) => d.leader === ROCKS)!,
    kaido: all.find((d) => d.leader === KAIDO)!,
  };
};

/** A copy of `s` in which the cards hidden from `viewer` are shuffled among their hidden places. */
function reshuffleHidden(g: GameState, viewer: PlayerId, salt: number): GameState {
  const s = internals(g);
  const top = s.stack[s.stack.length - 1];
  const pending = top?.f === 'damage' ? top.pending : null;
  const playing = new Set(s.stack.flatMap((f) => (f.f === 'play' ? [f.card] : [])));
  const cards = { ...s.cards };
  for (const owner of ['p1', 'p2'] as const) {
    const ids = Object.keys(s.cards).filter(
      (id) =>
        s.cards[id]!.owner === owner &&
        !canSee(s, id, viewer) &&
        !playing.has(id) &&
        !(id === pending && owner === viewer),
    );
    const printed = ids.map((id) => s.cards[id]!.card);
    // A fixed rotation: every hidden card moves.
    ids.forEach(
      (id, i) => (cards[id] = { ...cards[id]!, card: printed[(i + 1 + salt) % printed.length]! }),
    );
  }
  return { ...s, cards } as unknown as GameState;
}

describe('Pirate', () => {
  it('is deterministic for a seed under an iteration budget', () => {
    const { rocks, kaido } = decks();
    const run = () => {
      const actions: string[] = [];
      playMatch({
        seed: 501,
        decks: { p1: rocks, p2: kaido },
        tiers: { p1: 'pirate', p2: 'rookie' },
        onDecision: (d) => actions.push(JSON.stringify(d.action)),
      });
      return actions;
    };
    expect(run()).toEqual(run());
  });

  it('decides the same whatever the cards it cannot see are (same determinization seed)', () => {
    const { rocks, kaido } = decks();
    const samples: DecisionRecord[] = [];
    let n = 0;
    playMatch({
      seed: 777,
      decks: { p1: kaido, p2: rocks },
      tiers: { p1: 'pirate', p2: 'rookie' },
      onDecision: (d) => {
        if (d.tier === 'pirate' && n++ % 3 === 0 && d.view.actions.length > 1) samples.push(d);
      },
    });
    expect(samples.length).toBeGreaterThan(20);
    for (const [i, d] of samples.entries()) {
      const variant = reshuffleHidden(d.before, 'p1', i);
      // The variant really differs in hidden cards (the opponent's hand, both decks, Life).
      expect(JSON.stringify(internals(variant).cards)).not.toBe(
        JSON.stringify(internals(d.before).cards),
      );
      const a = projectForSearch(d.before, 'p1');
      const b = projectForSearch(variant, 'p1');
      expect(JSON.stringify(b)).toBe(JSON.stringify(a));
      const x = session('p1', d.before).decide(a, 1000 + i);
      const y = session('p1', variant).decide(b, 1000 + i);
      expect(y.action).toEqual(x.action);
      expect(y.explanation).toEqual(x.explanation);
    }
  });

  it('stays within its iteration budget', () => {
    const { rocks, kaido } = decks();
    let max = 0;
    playMatch({
      seed: 88,
      decks: { p1: rocks, p2: kaido },
      tiers: { p1: 'pirate', p2: 'pirate' },
      onDecision: (d) => (max = Math.max(max, d.rollouts)),
    });
    expect(max).toBeGreaterThan(0);
    // The first round of a step always completes (no candidate unscored), so a plan may run one
    // round of candidates past its budget, never more.
    expect(max).toBeLessThanOrEqual(BUDGETS.pirate.iterations.turn.iterations + 120);
  });

  it('stays within a wall-clock budget by at most 20% (p95)', () => {
    const { rocks, kaido } = decks();
    const positions: {
      view: ReturnType<typeof projectForSearch>;
      leader: string;
      opp: string;
      deck: string[];
    }[] = [];
    playMatch({
      seed: 89,
      decks: { p1: rocks, p2: kaido },
      tiers: { p1: 'pirate', p2: 'rookie' },
      onDecision: (d) => {
        if (
          d.tier === 'pirate' &&
          d.view.decision?.kind === 'main' &&
          !d.planned &&
          positions.length < 16
        )
          positions.push({
            view: projectForSearch(d.before, 'p1'),
            leader: ROCKS,
            opp: KAIDO,
            deck: rocks.main,
          });
      },
    });
    const ms = 120;
    const times: number[] = [];
    for (const p of positions) {
      const s = new AiSession({
        tier: 'pirate',
        ownDeck: p.deck,
        cards: cardMap(),
        leader: p.leader,
        opponentLeader: p.opp,
        budgets: { turn: { ms }, defence: { ms } },
      });
      const t0 = performance.now();
      s.decide(p.view, 3);
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)] ?? times[times.length - 1]!;
    expect(p95).toBeLessThanOrEqual(ms * 1.2);
  });

  it('only ever runs full-state engine calls under src/search (lint enforces it too)', () => {
    const dir = new URL('../src/', import.meta.url);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(new URL(f, dir), 'utf8');
      expect(src, f).not.toMatch(
        /\b(reduce|legalActions|whyNot|autoSkip|replay|determinize|projectForSearch)\(/,
      );
      expect(src, f).not.toMatch(/\bqueries\./);
    }
  });
});

describe('Pirate on defence', () => {
  /** p2 (Rocks AI) is attacked by p1's Kaido Leader with `don` DON!! given. */
  function attacked(
    p2: { life: number; hand: string[]; characters?: string[] },
    don: number,
    extra: string[] = [],
  ) {
    let s = start({
      seed: 4,
      turn: 7,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: { card: KAIDO, don },
        characters: extra,
        life: lifeOf(4, 'OP17-074'),
        hand: ['OP17-062'],
        costArea: { active: 0, rested: 6 - don },
        decklist: listOf(KAIDO),
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(p2.life, 'OP17-045'),
        hand: p2.hand,
        characters: p2.characters ?? [],
        costArea: { active: 2, rested: 4 },
        decklist: listOf(ROCKS),
      },
    });
    const a = queries.zone(s, 'p1', 'leader')[0]!;
    const t = queries.zone(s, 'p2', 'leader')[0]!;
    s = reduce(s, { type: 'attack', attacker: a.instance, target: t.instance, player: 'p1' }).state;
    // Kaido's own [When Attacking] is declined; play reaches the AI's first decision.
    while (queries.decision(s)?.player === 'p1')
      s = reduce(
        s,
        legalActions(s).find((x) => x.type === 'optional' && !x.accept) ?? legalActions(s)[0]!,
      ).state;
    return s;
  }

  /** Let the AI defend this battle; return the actions it took and the state after. */
  function defend(s0: GameState) {
    let s = s0;
    const ai = session('p2', s);
    const took: string[] = [];
    const planned: boolean[] = [];
    for (let i = 0; i < 12 && queries.battle(s) && queries.decision(s)?.player === 'p2'; i++) {
      const v = projectForSearch(s, 'p2');
      const d = ai.decide(v, 10 + i);
      took.push(
        d.action.type === 'block' ? (d.action.blocker ? 'block' : 'noBlock') : d.action.type,
      );
      planned.push(d.stats.planned);

      const k = v.actions.findIndex(
        (x) =>
          JSON.stringify({ ...x, intentId: undefined }) ===
          JSON.stringify({ ...d.action, intentId: undefined }),
      );
      s = reduce(s, legalActions(s)[k]!).state;
      while (queries.battle(s) && queries.decision(s)?.player === 'p1')
        s = reduce(
          s,
          legalActions(s).find((x) => x.type === 'optional' && !x.accept) ?? legalActions(s)[0]!,
        ).state;
    }
    return { took, planned, s };
  }

  it('always blocks a lethal attack when it has a Blocker', () => {
    const { took, s } = defend(
      attacked({ life: 0, hand: ['OP17-048'], characters: ['OP17-046'] }, 1),
    );
    expect(took).toContain('block');
    expect(queries.result(s)).toBeNull();
  });

  it('counters a lethal attack with a whole defence when it has no Blocker', () => {
    // 7000 into 5000 at 0 Life: 3000 needed. Buckin (+1000) and Rocks Pirates (+2000) do it.
    const { s } = defend(attacked({ life: 0, hand: ['OP08-051', 'OP17-056', 'OP17-048'] }, 2));
    expect(queries.result(s)).toBeNull();
    expect(queries.zone(s, 'p2', 'hand').map((c) => c.card)).toEqual(['OP17-048']);
  });

  it('never throws a Counter away: one that cannot stop the attack stays in hand', () => {
    // 9000 into 5000 at 1 Life needs 5000; it holds one +2000.
    const { took, s } = defend(attacked({ life: 1, hand: ['OP17-056', 'OP17-048'] }, 4));
    expect(took).not.toContain('activate');
    expect(took).not.toContain('counter');
    expect(queries.zone(s, 'p2', 'hand').map((c) => c.card)).toContain('OP17-056');
  });

  it('takes a lone hit at high Life instead of spending a card on it (E04)', () => {
    const { took } = defend(
      attacked(
        { life: 5, hand: ['OP17-056', 'OP08-051', 'OP17-048', 'OP17-045', 'OP17-040', 'OP17-049'] },
        1,
      ),
    );
    expect(took).toContain('endCounter');
    expect(took).not.toContain('counter');
    expect(took).not.toContain('activate');
  });

  it('defends a lethal hit even when a second attacker makes every line look lost (review M5a-05)', () => {
    // 7000 into 5000 at 0 Life, with Kaido (12000) still to attack: two +2000 Events stop this hit.
    const { took, s } = defend(
      attacked({ life: 0, hand: ['OP17-056', 'OP17-055', 'OP17-048'] }, 2, ['OP17-062']),
    );
    expect(took.filter((t) => t === 'activate').length).toBe(2);
    expect(queries.result(s)).toBeNull();
  });

  it('keeps to its chosen defence through an Event’s target pick (review M5a-11)', () => {
    const { took, planned } = defend(
      attacked({ life: 0, hand: ['OP17-056', 'OP17-055', 'OP17-048'] }, 2, ['OP17-062']),
    );
    // The second Event comes from the defence chosen at the first, not from a new search.
    const second = took.indexOf('activate', took.indexOf('activate') + 1);
    expect(second).toBeGreaterThan(0);
    expect(planned[second]).toBe(true);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  actionFromView,
  createFromScenario,
  createGame,
  project,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import { attackIsLethal, chooseAction, rookie } from '../src/index.ts';
import { cardMap, lookup, metaDecks } from './support.ts';

const strip = ({ intentId: _i, ...a }: Action) => a;
const counterOf = (id: string) => cardMap().get(id)?.counter ?? null;

/** Plays one game with Rookie on both sides, checking every choice against the view's list. */
function playOut(seed: number, deckA: number, deckB: number) {
  const decks = metaDecks();
  let state: GameState = createGame({
    seed,
    cards: lookup,
    decks: { p1: decks[deckA]!, p2: decks[deckB]! },
  }).state;
  let n = 0;
  for (; n < 3000; n++) {
    const p1 = project(state, 'p1');
    if (p1.result) break;
    const p: PlayerId = p1.decision!.player;
    const view = project(state, p);
    const d = rookie(view, { seed: seed * 7919 + n, counterOf });
    expect(view.actions.map(strip)).toContainEqual(strip(d.action));
    expect(d.action.type).not.toBe('concede');
    expect(d.explanation.claim.length).toBeGreaterThan(0);
    expect(d.alternatives).toEqual([]);
    state = reduce(state, actionFromView(state, p, d.action)).state;
  }
  return { result: project(state, 'p1').result, actions: n };
}

describe('Rookie (ARCHITECTURE §4.2)', () => {
  it('only ever picks an action listed in its view, and finishes games', () => {
    const decks = metaDecks().length;
    for (let g = 0; g < 12; g++) {
      const { result, actions } = playOut(1000 + g, g % decks, (g * 5 + 3) % decks);
      expect(result, `game ${g} ended within the cap (${actions} actions)`).not.toBeNull();
    }
  });

  it('is deterministic for a seed', () => {
    const decks = metaDecks();
    const s = createGame({ seed: 4, cards: lookup, decks: { p1: decks[0]!, p2: decks[3]! } });
    const v = project(s.state, project(s.state, 'p1').decision!.player);
    expect(rookie(v, { seed: 9, counterOf }).action).toEqual(
      rookie(v, { seed: 9, counterOf }).action,
    );
  });

  it('takes a view only: a structured clone of the view gives the same answer', () => {
    const decks = metaDecks();
    let state = createGame({
      seed: 77,
      cards: lookup,
      decks: { p1: decks[1]!, p2: decks[2]! },
    }).state;
    for (let i = 0; i < 40; i++) {
      const p = project(state, 'p1').decision!.player;
      const view = project(state, p);
      const clone = structuredClone(view);
      // A view holds no instance ids and no engine state, only handles.
      expect(JSON.stringify(clone)).not.toMatch(/"rng"|"stack"|"defs"/);
      const a = rookie(view, { seed: i, counterOf }).action;
      expect(rookie(clone, { seed: i, counterOf }).action).toEqual(a);
      state = reduce(state, actionFromView(state, p, a)).state;
    }
    // And the source never touches full-state engine calls (lint enforces this too).
    const src = readFileSync(new URL('../src/rookie.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/\b(reduce|legalActions|whyNot|autoSkip|queries|replay)\(/);
  });
});

// Scenario: p2 (attacker) has a 6000 Leader with 1 DON!! given; p1 is at 0 Life.
const base = (p1: Partial<ScenarioSpec['p1']>, life: string[] = []): ScenarioSpec => ({
  seed: 5,
  cards: lookup,
  turn: 4,
  activePlayer: 'p2',
  firstPlayer: 'p1',
  p1: { leader: 'ST01-001', life, costArea: { active: 0, rested: 0 }, ...p1 },
  p2: {
    leader: { card: 'ST04-001', don: 1 },
    life: ['OP01-010'],
    costArea: { active: 0, rested: 0 },
  },
});

function attackLeader(spec: ScenarioSpec): GameState {
  let s = createFromScenario(spec).state;
  const v = project(s, 'p2');
  const attack = v.actions.find(
    (a) =>
      a.type === 'attack' &&
      a.attacker === v.zones.p2.leader[0]!.handle &&
      a.target === v.zones.p1.leader[0]!.handle,
  )!;
  s = reduce(s, actionFromView(s, 'p2', attack)).state;
  return s;
}

describe('Rookie defends lethal attacks', () => {
  it('blocks with a Blocker when the attack would win', () => {
    for (let seed = 0; seed < 25; seed++) {
      const s = attackLeader(base({ characters: ['OP09-072'] }));
      const v = project(s, 'p1');
      expect(v.decision?.kind).toBe('block');
      expect(attackIsLethal(v)).toBe(true);
      const a = rookie(v, { seed, counterOf }).action;
      expect(a.type === 'block' && a.blocker !== null).toBe(true);
    }
  });

  it('counters with enough when it has no Blocker', () => {
    for (let seed = 0; seed < 25; seed++) {
      let s = attackLeader(base({ hand: ['OP01-010', 'OP01-012', 'ST01-003'] }));
      let v = project(s, 'p1');
      // No Blocker: the block window offers only "no block".
      if (v.decision?.kind === 'block') {
        s = reduce(
          s,
          actionFromView(
            s,
            'p1',
            v.actions.find((a) => a.type === 'block')!,
          ),
        ).state;
        v = project(s, 'p1');
      }
      expect(v.decision?.kind).toBe('counter');
      // 6000 vs 5000: two +1000 Counters are needed; Rookie keeps countering while lethal.
      let played = 0;
      while (attackIsLethal(v)) {
        const a = chooseAction(v, { tier: 'rookie', seed, cards: cardMap() }).action;
        expect(a.type).toBe('counter');
        s = reduce(s, actionFromView(s, 'p1', a)).state;
        v = project(s, 'p1');
        played++;
      }
      expect(played).toBe(2);
    }
  });

  it('plays randomly when the attack is not lethal', () => {
    const kinds = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const s = attackLeader(base({ characters: ['OP09-072'] }, ['OP01-010']));
      const v = project(s, 'p1');
      expect(attackIsLethal(v)).toBe(false);
      const a = rookie(v, { seed, counterOf }).action;
      kinds.add(a.type === 'block' ? String(a.blocker !== null) : a.type);
    }
    expect(kinds).toEqual(new Set(['true', 'false']));
  });
});

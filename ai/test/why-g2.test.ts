/**
 * "Why?" for the group-2 playbooks (ST30-001, OP13-001, OP17-079): the guide citations render, obey
 * the copy rules, and, like every explanation, read the same whatever the AI holds (review M5a-01;
 * see why-differential.test.ts for the Rocks and Kaido version of the second check).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  createFromScenario,
  legalActions,
  nextInt,
  project,
  projectForSearch,
  queries,
  reduce,
  seedRng,
  shuffle,
  type Action,
  type CardPlacement,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import { AiSession } from '../src/index.ts';
import { playMatch } from './support/match.ts';
import { cardMap, lookup, metaDecks } from './support.ts';

vi.setConfig({ testTimeout: 300_000 });

const MINE = ['ST30-001', 'OP13-001', 'OP17-079'];
const deckOf = (leader: string) => metaDecks().find((d) => d.leader === leader)!;
const strip = ({ intentId: _i, ...a }: Action) => JSON.stringify(a);

describe('group-2 citations in "Why?"', () => {
  it('render for each archetype, within the copy rules, and name no hidden card', () => {
    const all = cardMap();
    const cited = new Map<string, number>();
    // A card name counts as one word (as in explanations.test.ts).
    const names = [...new Set([...all.values()].map((c) => c.name))]
      .filter((n) => n.includes(' '))
      .sort((a, b) => b.length - a.length);
    const words = (t: string) => {
      let x = t;
      for (const n of names) if (x.includes(n)) x = x.split(n).join('Name');
      return x.split(/\s+/).filter(Boolean).length;
    };
    const rocks = deckOf('OP17-039');
    for (const [g, leader] of MINE.entries()) {
      for (const seat of ['p1', 'p2'] as const) {
        const mine = deckOf(leader);
        playMatch({
          seed: 70 + g * 2 + (seat === 'p1' ? 0 : 1),
          decks: seat === 'p1' ? { p1: mine, p2: rocks } : { p1: rocks, p2: mine },
          tiers: { p1: 'pirate', p2: 'pirate' },
          onDecision: (d) => {
            if (d.player !== seat) return;
            const e = d.explanation;
            const line = e.evidence.find((x) => x.text.startsWith('Its guide:'));
            if (line) {
              expect(words(line.text), line.text).toBeLessThanOrEqual(30);
              cited.set(leader, (cited.get(leader) ?? 0) + 1);
              // A cite names only a card the move shows: no other card's name.
              const opp = seat === 'p1' ? 'p2' : 'p1';
              const visible = new Set<string>();
              for (const st of [d.before, d.after]) {
                const v = project(st, opp);
                for (const p of ['p1', 'p2'] as const)
                  for (const z of Object.values(v.zones[p]))
                    for (const c of z) if (c.card) visible.add(c.card);
              }
              const acted = (d.action as { card?: string }).card;
              if (acted)
                for (const z of Object.values(d.view.zones[seat])) {
                  const c = z.find((x) => x.handle === acted);
                  if (c?.card) visible.add(c.card);
                }
              const visibleNames = new Set([...visible].map((id) => all.get(id)!.name));
              const hidden = (['p1', 'p2'] as const).flatMap((p) =>
                (['hand', 'deck', 'life'] as const).flatMap((z) => queries.zone(d.before, p, z)),
              );
              for (const id of new Set(hidden.map((c) => c.card))) {
                const name = all.get(id)!.name;
                if (visible.has(id) || visibleNames.has(name)) continue;
                const re = new RegExp(
                  `(^|[^A-Za-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z])`,
                );
                expect(re.test(line.text), `${name} is hidden but named in: ${line.text}`).toBe(
                  false,
                );
              }
              expect(e.sources.length).toBeGreaterThan(0);
            }
          },
        });
      }
    }
    // Every group-2 archetype's guide line reached a "Why?" at least once.
    for (const leader of MINE) expect(cited.get(leader) ?? 0, `${leader} cited`).toBeGreaterThan(0);
  });
});

type Side = { leader: string; hand: string[]; life: CardPlacement[]; deck: string[] };

function pair(seed: number, ai: PlayerId, leader: string) {
  let rng = seedRng(seed * 31 + 7);
  const aiDeck = deckOf(leader);
  const humanDeck = deckOf('OP17-039');
  const side = (d: typeof aiDeck): Side => {
    let m: string[];
    [m, rng] = shuffle(d.main, rng);
    return {
      leader: d.leader,
      hand: m.slice(0, 5),
      life: m
        .slice(5, 5 + (d.leader === 'ST30-001' ? 4 : 5))
        .map((card) => ({ card, faceUp: false })),
      deck: m.slice(10),
    };
  };
  const human: PlayerId = ai === 'p1' ? 'p2' : 'p1';
  const a = side(aiDeck);
  const h = side(humanDeck);
  // B: the AI's hand, Life and deck reshuffled; everything the player can see is equal.
  let pool = [...a.hand, ...a.life.map((l) => l.card), ...a.deck];
  [pool, rng] = shuffle(pool, rng);
  const a2: Side = {
    ...a,
    hand: pool.slice(0, 5),
    life: pool.slice(5, 5 + a.life.length).map((card) => ({ card, faceUp: false })),
    deck: pool.slice(5 + a.life.length),
  };
  const make = (aiSide: Side): GameState =>
    createFromScenario({
      seed,
      turn: 1,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      phase: 'refresh',
      [ai]: aiSide,
      [human]: h,
      cards: lookup,
    } as unknown as ScenarioSpec).state;
  return { A: make(a), B: make(a2), aiDeck, humanDeck, human, rng };
}

function humanAction(s: GameState, r: number): [Action, number] {
  const legal = legalActions(s).filter((x) => x.type !== 'concede');
  const [i, r1] = nextInt(r, 10);
  let rng = r1;
  const attacks = legal.filter((x) => x.type === 'attack');
  if (attacks.length && i < 7) {
    let j: number;
    [j, rng] = nextInt(rng, attacks.length);
    return [attacks[j]!, rng];
  }
  const nonEnd = legal.filter((x) => x.type !== 'endTurn');
  if (nonEnd.length && i < 9) {
    let j: number;
    [j, rng] = nextInt(rng, nonEnd.length);
    return [nonEnd[j]!, rng];
  }
  return [legal.find((x) => x.type === 'endTurn') ?? legal[0]!, rng];
}

describe('"Why?" of the group-2 archetypes reads the same whatever the AI holds', () => {
  it('the explanation of every AI action that reveals nothing, at every AI decision', () => {
    const diffs: string[] = [];
    let compared = 0;
    const kinds = new Map<string, number>();
    for (const leader of MINE) {
      for (let seed = 1; seed <= 8; seed++) {
        const ai: PlayerId = seed % 2 ? 'p1' : 'p2';
        const p = pair(seed, ai, leader);
        let { A, B, rng } = p;
        const s = new AiSession({
          tier: 'pirate',
          ownDeck: p.aiDeck.main,
          cards: cardMap(),
          leader: p.aiDeck.leader,
          opponentLeader: p.humanDeck.leader,
          budgets: { turn: { iterations: 60 }, defence: { iterations: 20 } },
        });
        for (let step = 0; step < 300; step++) {
          const hA = project(A, p.human);
          if (JSON.stringify(hA) !== JSON.stringify(project(B, p.human))) break;
          if (hA.result || !hA.decision) break;
          if (hA.decision.player === ai) {
            const vA = projectForSearch(A, ai);
            const vB = projectForSearch(B, ai);
            const inB = new Set(vB.actions.map(strip));
            for (const a of vA.actions)
              if (
                (a.type === 'giveDon' || a.type === 'attack' || a.type === 'endTurn') &&
                inB.has(strip(a))
              ) {
                compared++;
                kinds.set(a.type, (kinds.get(a.type) ?? 0) + 1);
                const eA = JSON.stringify(s.explain(vA, a, 3));
                const eB = JSON.stringify(s.explain(vB, a, 3));
                if (eA !== eB && diffs.length < 5)
                  diffs.push(`${leader} seed ${seed} step ${step} ${strip(a)}:\n ${eA}\n ${eB}`);
              }
          }
          let act: Action;
          [act, rng] = humanAction(A, rng);
          try {
            A = reduce(A, act).state;
            B = reduce(B, act).state;
          } catch {
            break;
          }
        }
      }
    }
    console.log('COMPARED', compared, JSON.stringify([...kinds]));
    expect(compared).toBeGreaterThan(100);
    expect(diffs).toEqual([]);
  });
});

/**
 * "Why?" is a function of public information (review M5a-01).
 *
 * Two reachable games start from positions that differ only in the AI's hidden cards (its hand,
 * Life and deck), with scripted [Trigger]s on a third of the card ids so damage windows offer real
 * choices, and replay the same actions. Wherever the *player's* views are equal, the AI's "Why?"
 * for an action that reveals no hidden card (a block, taking a hit, adding a Life card to hand, an
 * optional effect, a choice, an attack, DON!!, ending the turn) must read the same, word for word,
 * and so must its presence. On the M5a code this failed: a forced window said "Only legal move."
 * where a free one cited a search term, so the text showed whether the AI held a Counter or its
 * Life card a [Trigger].
 */
import { describe, expect, it, vi } from 'vitest';
import {
  createFromScenario,
  legalActions,
  nextInt,
  project,
  projectForSearch,
  reduce,
  seedRng,
  shuffle,
  type Action,
  type CardPlacement,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import { withAbilities } from '../../engine/src/testing.ts';
import { AiSession } from '../src/index.ts';
import { cardMap, lookup, metaDecks } from './support.ts';

vi.setConfig({ testTimeout: 120_000 });

const SEEDS = Number(process.env.WHY_SEEDS ?? 24);
const strip = ({ intentId: _i, ...a }: Action) => JSON.stringify(a);

/** Actions whose own text reveals no hidden card (a play or a Counter names the card it shows). */
function revealsNothing(a: Action): boolean {
  if (a.type === 'playCard' || a.type === 'counter') return false;
  if (a.type === 'activate') return a.ability !== 'counter';
  if (a.type === 'trigger') return !a.activate;
  return true;
}

type Side = { leader: string; hand: string[]; life: CardPlacement[]; deck: string[] };

type Mode = 'all' | 'life' | 'deck';

function pair(seed: number, ai: PlayerId, mode: Mode) {
  let rng = seedRng(seed * 31 + 7);
  const decks = metaDecks();
  const rocks = decks.find((d) => d.leader === 'OP17-039')!;
  const kaido = decks.find((d) => d.leader === 'OP17-058')!;
  const aiDeck = seed % 2 ? rocks : kaido;
  const humanDeck = aiDeck === rocks ? kaido : rocks;
  const side = (d: typeof rocks): Side => {
    let m: string[];
    [m, rng] = shuffle(d.main, rng);
    return {
      leader: d.leader,
      hand: m.slice(0, 5),
      life: m.slice(5, 10).map((card) => ({ card, faceUp: false })),
      deck: m.slice(10),
    };
  };
  const human: PlayerId = ai === 'p1' ? 'p2' : 'p1';
  const a = side(aiDeck);
  const h = side(humanDeck);
  // B: the AI's hidden cards changed, everything else equal. "all" reshuffles its hand, Life and
  // deck; "life" reverses its Life only and "deck" reshuffles its deck only, so the two games stay
  // in step for longer (its hand, which it plays from, is the same).
  let a2: Side;
  if (mode === 'all') {
    let pool = [...a.hand, ...a.life.map((l) => l.card), ...a.deck];
    [pool, rng] = shuffle(pool, rng);
    a2 = {
      ...a,
      hand: pool.slice(0, 5),
      life: pool.slice(5, 10).map((card) => ({ card, faceUp: false })),
      deck: pool.slice(10),
    };
  } else if (mode === 'life') {
    // Swap the Life cards with the top of the deck too, so the Life card a hit reveals differs.
    const life = [...a.deck.slice(0, 5)].map((card) => ({ card, faceUp: false }));
    a2 = { ...a, life, deck: [...a.life.map((l) => l.card), ...a.deck.slice(5)] };
  } else {
    let deck: string[];
    [deck, rng] = shuffle(a.deck, rng);
    a2 = { ...a, deck };
  }
  const ids = [...new Set([...rocks.main, ...kaido.main])].sort();
  const make = (aiSide: Side): GameState => {
    const spec = {
      seed,
      turn: 1,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      phase: 'refresh',
      [ai]: aiSide,
      [human]: h,
      cards: lookup,
    } as unknown as ScenarioSpec;
    let st = createFromScenario(spec).state;
    ids.forEach((id, k) => {
      if (k % 3 === 0)
        st = withAbilities(st, id, [
          { id: 't', kind: 'trigger', effect: [{ op: 'emit', label: 'trig' }] },
        ]);
    });
    return st;
  };
  return { A: make(a), B: make(a2), aiDeck, humanDeck, human, rng };
}

/** The player: attacks the AI's Leader often (so defences come up), otherwise plays at random. */
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

const session = (deck: { leader: string; main: string[] }, opp: string) =>
  new AiSession({
    tier: 'pirate',
    ownDeck: deck.main,
    cards: cardMap(),
    leader: deck.leader,
    opponentLeader: opp,
    budgets: { turn: { iterations: 60 }, defence: { iterations: 20 } },
  });

describe('"Why?" reads the same whatever the AI holds (review M5a-01)', () => {
  it('the explanation of each AI decision, when the actions agree', () => {
    const diffs: string[] = [];
    const kinds = new Map<string, number>();
    for (let n = 0; n < SEEDS * 3; n++) {
      const seed = Math.floor(n / 3) + 1;
      const mode = (['all', 'life', 'deck'] as const)[n % 3]!;
      const ai: PlayerId = seed % 4 < 2 ? 'p1' : 'p2';
      const p = pair(seed, ai, mode);
      const { aiDeck, humanDeck, human } = p;
      let { A, B, rng } = p;
      const sA = session(aiDeck, humanDeck.leader);
      const sB = session(aiDeck, humanDeck.leader);
      for (let step = 0; step < 500; step++) {
        const hA = project(A, human);
        if (JSON.stringify(hA) !== JSON.stringify(project(B, human))) break;
        if (hA.result || !hA.decision) break;
        let act: Action;
        if (hA.decision.player === ai) {
          const vA = projectForSearch(A, ai);
          const vB = projectForSearch(B, ai);
          const dA = sA.decide(vA, seed * 977 + step);
          const dB = sB.decide(vB, seed * 977 + step);
          if (strip(dA.action) === strip(dB.action) && revealsNothing(dA.action)) {
            const k = vA.decision!.kind;
            kinds.set(k, (kinds.get(k) ?? 0) + 1);
            if (
              JSON.stringify(dA.explanation) !== JSON.stringify(dB.explanation) &&
              diffs.length < 5
            )
              diffs.push(
                `seed ${seed} step ${step} ${k}: ${dA.explanation.claim} / ${JSON.stringify(dA.explanation.evidence.map((e) => e.text))}\n   vs ${dB.explanation.claim} / ${JSON.stringify(dB.explanation.evidence.map((e) => e.text))}`,
              );
          }
          const i = vA.actions.findIndex((x) => strip(x) === strip(dA.action));
          act = legalActions(A)[i]!;
        } else [act, rng] = humanAction(A, rng);
        try {
          A = reduce(A, act).state;
          B = reduce(B, act).state;
        } catch {
          break;
        }
      }
    }
    console.log('KINDS', JSON.stringify([...kinds]));
    // Every kind of window came up.
    for (const k of ['main', 'counter', 'trigger', 'block', 'optional', 'choose'])
      expect(kinds.get(k) ?? 0, `${k} decisions compared`).toBeGreaterThan(4);
    expect(diffs).toEqual([]);
  });

  it('the explanation of every AI action that reveals nothing, at every AI decision', () => {
    const diffs: string[] = [];
    let compared = 0;
    for (let n = 0; n < SEEDS * 3; n++) {
      const seed = Math.floor(n / 3) + 1;
      const mode = (['all', 'life', 'deck'] as const)[n % 3]!;
      const ai: PlayerId = seed % 4 < 2 ? 'p1' : 'p2';
      const p = pair(seed, ai, mode);
      const { aiDeck, humanDeck, human } = p;
      let { A, B, rng } = p;
      const s = session(aiDeck, humanDeck.leader);
      for (let step = 0; step < 300; step++) {
        const hA = project(A, human);
        if (JSON.stringify(hA) !== JSON.stringify(project(B, human))) break;
        if (hA.result || !hA.decision) break;
        if (hA.decision.player === ai) {
          const vA = projectForSearch(A, ai);
          const vB = projectForSearch(B, ai);
          const inB = new Set(vB.actions.map(strip));
          for (const a of vA.actions)
            if (a.type !== 'concede' && revealsNothing(a) && inB.has(strip(a))) {
              compared++;
              const eA = JSON.stringify(s.explain(vA, a, 3));
              const eB = JSON.stringify(s.explain(vB, a, 3));
              if (eA !== eB && diffs.length < 5)
                diffs.push(`seed ${seed} step ${step} ${strip(a)}:\n ${eA}\n ${eB}`);
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
    console.log('COMPARED', compared);
    expect(compared).toBeGreaterThan(200);
    expect(diffs).toEqual([]);
  });
});

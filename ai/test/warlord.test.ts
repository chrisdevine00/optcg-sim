/**
 * Warlord and Emperor (ADR 0008, PLAN M5b): information-set MCTS over turn plans.
 *
 * Covered here: the lethal check runs first and short-circuits the search; determinization never
 * sees a hidden card (the decision and its "Why?" are a function of the view and the seed, and
 * the explanations name no hidden card); the tree is reused inside a turn and a search runs again
 * only when the plan breaks; budgets are honoured (iterations exactly, milliseconds within 20%);
 * the DON!! count of "give up to N" can be chosen below N; Emperor's deepening is a prefix of the
 * same search. Strength gates are in `strength.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  actionFromView,
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { internals } from '../../engine/src/testing.ts';
import { canSee } from '../../engine/src/project.ts';
import { BUDGETS } from '../src/index.ts';
import { Mcts, treeCandidates } from '../src/search/mcts.ts';
import { simContext, type PirateSetup } from '../src/search/pirate.ts';
import { determinizations } from '../src/search/sample.ts';
import { cardMap, metaDecks } from './support.ts';
import { playMatch, type DecisionRecord } from './support/match.ts';
import {
  cardOf,
  lifeOf,
  listOf,
  play,
  plainAnswer,
  session,
  setTier,
  start,
  type Spec,
} from './support/scenario.ts';
import { asVanilla } from './support/vanilla.ts';

vi.setConfig({ testTimeout: 120_000 });
asVanilla('OP13-001', 'OP13-027');

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const decks = () => {
  const all = metaDecks();
  return {
    rocks: all.find((d) => d.leader === ROCKS)!,
    kaido: all.find((d) => d.leader === KAIDO)!,
  };
};
/** Small budgets: these tests check behaviour, not strength. */
const SMALL = { turn: { iterations: 120 }, defence: { iterations: 40 } };
const same = (a: Action, b: Action) =>
  JSON.stringify({ ...a, intentId: undefined }) === JSON.stringify({ ...b, intentId: undefined });

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
    ids.forEach(
      (id, i) => (cards[id] = { ...cards[id]!, card: printed[(i + 1 + salt) % printed.length]! }),
    );
  }
  return { ...s, cards } as unknown as GameState;
}

/** Positions at the AI's decisions in a game against Rookie. */
function sampleGame(tier: 'warlord' | 'emperor', seed: number, every = 3) {
  const { rocks, kaido } = decks();
  const out: DecisionRecord[] = [];
  let n = 0;
  playMatch({
    seed,
    decks: { p1: kaido, p2: rocks },
    tiers: { p1: tier, p2: 'rookie' },
    budgets: SMALL,
    onDecision: (d) => {
      if (d.tier === tier && n++ % every === 0 && d.view.actions.length > 1) out.push(d);
    },
  });
  return out;
}

describe.each(['warlord', 'emperor'] as const)('%s', (tier) => {
  it('is deterministic for a seed under an iteration budget', () => {
    const { rocks, kaido } = decks();
    const run = () => {
      const actions: string[] = [];
      playMatch({
        seed: 501,
        decks: { p1: rocks, p2: kaido },
        tiers: { p1: tier, p2: 'rookie' },
        budgets: SMALL,
        onDecision: (d) => actions.push(JSON.stringify(d.action)),
      });
      return actions;
    };
    expect(run()).toEqual(run());
  });

  it('decides, and explains, the same whatever the cards it cannot see are', () => {
    const samples = sampleGame(tier, 777);
    expect(samples.length).toBeGreaterThan(12);
    let searched = 0;
    for (const [i, d] of samples.entries()) {
      const variant = reshuffleHidden(d.before, 'p1', i);
      // The variant really differs in hidden cards (the opponent's hand, both decks, Life).
      expect(JSON.stringify(internals(variant).cards)).not.toBe(
        JSON.stringify(internals(d.before).cards),
      );
      const a = projectForSearch(d.before, 'p1');
      const b = projectForSearch(variant, 'p1');
      expect(JSON.stringify(b)).toBe(JSON.stringify(a));
      const x = session('p1', d.before, tier, true, { budgets: SMALL }).decide(a, 2000 + i);
      const y = session('p1', variant, tier, true, { budgets: SMALL }).decide(b, 2000 + i);
      expect(y.action).toEqual(x.action);
      expect(y.explanation).toEqual(x.explanation);
      expect(y.alternatives).toEqual(x.alternatives);
      if (x.stats.rollouts > 0) searched++;
    }
    // The comparison is not vacuous: most of these decisions ran a search.
    expect(searched).toBeGreaterThan(samples.length / 3);
  });

  it('gives a public-only "Why?" for every decision: no hidden card is named', () => {
    const { rocks } = decks();
    const samples = sampleGame(tier, 91);
    const pubName = (id: string) => cardMap().get(id)?.name ?? '';
    for (const d of samples) {
      // Every card name the text mentions is on the AI's own side or visible to it.
      const view = projectForSearch(d.before, 'p1');
      const visible = new Set<string>();
      for (const p of ['p1', 'p2'] as const)
        for (const z of ['leader', 'characters', 'stage', 'trash', 'hand', 'life'] as const)
          for (const c of view.zones[p][z]) if (c.card) visible.add(c.card);
      const text = JSON.stringify(d.explanation);
      // A hidden card of the opponent's prior list that is not visible must not be named.
      for (const id of new Set(rocks.main)) {
        if (visible.has(id) || id === 'OP17-058') continue;
        const name = pubName(id);
        if (name && !visible.has(id)) {
          // Names shared with a visible card are fine (same printed name).
          const shared = [...visible].some((v) => pubName(v) === name);
          if (!shared && d.view.zones.p2.hand.every((c) => c.card !== id))
            expect(text, `${d.index}: names ${name}`).not.toContain(name);
        }
      }
    }
  });

  it('plans the turn once, then follows the plan without searching', () => {
    const samples = sampleGame(tier, 313, 1).filter(
      (d) => d.view.decision?.kind === 'main' && d.view.turn.number >= 3,
    );
    expect(samples.length).toBeGreaterThan(3);
    const d = samples[0]!;
    const view = projectForSearch(d.before, 'p1');
    const s = session('p1', d.before, tier, true, { budgets: SMALL });
    const plan = s.planTurn(view, 5);
    expect(plan.rollouts).toBeGreaterThan(0);
    expect(plan.rollouts).toBeLessThanOrEqual(SMALL.turn.iterations);
    const first = s.decide(view, 5);
    // The search was done ahead: the first decision costs nothing.
    expect(first.stats.rollouts).toBe(0);
    expect(first.stats.planned).toBe(true);
  });

  it('searches again only when the plan breaks', () => {
    const { rocks, kaido } = decks();
    // Warlord against Rookie: count the searches in each of its turns.
    const perTurn = new Map<number, { searches: number; moves: number }>();
    playMatch({
      seed: 4242,
      decks: { p1: kaido, p2: rocks },
      tiers: { p1: tier, p2: 'rookie' },
      budgets: SMALL,
      onDecision: (d) => {
        if (d.tier !== tier || d.view.decision?.kind !== 'main') return;
        const t = perTurn.get(d.view.turn.number) ?? { searches: 0, moves: 0 };
        t.moves++;
        if (d.rollouts > 0) t.searches++;
        perTurn.set(d.view.turn.number, t);
      },
    });
    const turns = [...perTurn.values()];
    const moves = turns.reduce((a, t) => a + t.moves, 0);
    const searches = turns.reduce((a, t) => a + t.searches, 0);
    expect(moves).toBeGreaterThan(turns.length);
    // Far fewer searches than moves: most moves follow the tree.
    expect(searches).toBeLessThan(moves * 0.6);
    // And at least one turn searched (the first decision of a turn with no pre-plan).
    expect(searches).toBeGreaterThan(0);
  });

  it('searches again when what it sees is not what any determinization predicted', () => {
    const samples = sampleGame(tier, 313, 1).filter(
      (d) => d.view.decision?.kind === 'main' && d.view.turn.number >= 3,
    );
    const d = samples[1]!;
    const s = session('p1', d.before, tier, true, { budgets: SMALL });
    const view = projectForSearch(d.before, 'p1');
    s.planTurn(view, 9);
    const one = s.decide(view, 9);
    expect(one.stats.rollouts).toBe(0);
    // The game goes a different way: another legal move is played (not the planned one).
    const legal = legalActions(d.before).filter((a) => a.type !== 'concede');
    const planned = actionFromView(d.before, 'p1', one.action);
    const other = legal.find((a) => !same(a, planned) && a.type !== 'endTurn') ?? legal[0]!;
    let next = reduce(d.before, other).state;
    // Answer everything else plainly until the AI owes a Main decision again.
    for (let i = 0; i < 40; i++) {
      const dd = queries.decision(next);
      if (!dd || queries.result(next) || (dd.player === 'p1' && dd.kind === 'main')) break;
      next = reduce(
        next,
        actionFromView(next, dd.player, plainAnswer(projectForSearch(next, dd.player))),
      ).state;
    }
    const dec = queries.decision(next);
    expect(dec && dec.player === 'p1' && dec.kind === 'main').toBe(true);
    const view2 = projectForSearch(next, 'p1');
    const two = s.decide(view2, 10);
    expect(two.stats.rollouts).toBeGreaterThan(0);
    expect(two.stats.planned).toBe(false);
  });

  it('reports other first moves it kept in reserve', () => {
    const samples = sampleGame(tier, 313, 1).filter(
      (d) => d.view.decision?.kind === 'main' && d.view.actions.length > 3,
    );
    const d = samples[0]!;
    const out = session('p1', d.before, tier, true, { budgets: SMALL }).decide(
      projectForSearch(d.before, 'p1'),
      3,
    );
    expect(out.alternatives!.length).toBeGreaterThan(0);
    for (const a of out.alternatives!) expect(d.view.actions.some((x) => same(x, a))).toBe(true);
    expect(out.alternatives!.some((a) => same(a, out.action))).toBe(false);
  });
});

describe('Warlord: lethal first', () => {
  // Luffy (5000 Leader) and Sanji (7000) against Rocks at 1 Life with an empty hand: the Leader
  // hits first (a tie wins), then Sanji (see lethal.test.ts "proven: the weaker attack first").
  const spec: Spec = {
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: 'OP13-001',
      characters: ['OP13-027'],
      life: lifeOf(4, 'EB04-007'),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: ROCKS,
      characters: [],
      life: lifeOf(1, 'EB04-007'),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  };

  it('plays the proven line with no search, and wins', () => {
    let s = start(spec);
    const ai = session('p1', s, 'warlord');
    let searched = 0;
    for (let i = 0; i < 20 && !queries.result(s); i++) {
      const dec = queries.decision(s)!;
      if (dec.player === 'p1') {
        const d = ai.decide(projectForSearch(s, 'p1'), 1);
        searched += d.stats.rollouts;
        s = reduce(s, actionFromView(s, 'p1', d.action)).state;
      } else {
        s = reduce(s, actionFromView(s, 'p2', plainAnswer(projectForSearch(s, 'p2')))).state;
      }
    }
    const r = queries.result(s);
    expect(r && 'winner' in r && r.winner).toBe('p1');
    expect(searched).toBe(0);
  });

  it('a Warlord with no lethal check searches (the check is what short-circuits)', () => {
    const s = start(spec);
    const view = projectForSearch(s, 'p1');
    const a = session('p1', s, 'warlord').decide(view, 1);
    expect(a.stats.rollouts).toBe(0);
    const b = session('p1', s, 'warlord', true, {
      budgets: { ...SMALL, lethal: { nodes: 0 } },
    }).decide(view, 1);
    expect(b.stats.rollouts).toBeGreaterThan(0);
  });
});

describe('Warlord: budgets', () => {
  it('runs exactly the iterations it is given', () => {
    const [d] = sampleGame('warlord', 12, 1).filter((x) => x.view.decision?.kind === 'main');
    const view = projectForSearch(d!.before, 'p1');
    for (const n of [1, 7, 50]) {
      const s = session('p1', d!.before, 'warlord', true, { budgets: SMALL });
      expect(s.planTurn(view, 3, { iterations: n }).rollouts).toBeLessThanOrEqual(n);
    }
    const s = session('p1', d!.before, 'warlord', true, { budgets: SMALL });
    expect(s.planTurn(view, 3, { iterations: 50 }).rollouts).toBe(50);
  });

  it('spends the turn budget on a first Main decision and no more than the defence budget elsewhere', () => {
    // Counted in iterations, so it cannot flake on a loaded machine. The wall-clock check against
    // the app's real millisecond budgets is `budget.test.ts` (one check, not two).
    const samples = sampleGame('warlord', 89, 1).slice(0, 40);
    const budgets = {
      turn: { iterations: 60 },
      defence: { iterations: 25 },
      lethal: { nodes: 2000 },
    };
    const turn: number[] = [];
    const defence: number[] = [];
    for (const d of samples) {
      const s = session('p1', d.before, 'warlord', true, { budgets });
      const r = s.decide(projectForSearch(d.before, 'p1'), 3).stats.rollouts;
      if (d.view.decision?.kind === 'main') turn.push(r);
      else defence.push(r);
    }
    expect(turn.length).toBeGreaterThan(3);
    // A first decision with no plan made ahead: the whole budget, or none when lethal was proven.
    for (const r of turn) expect([0, budgets.turn.iterations]).toContain(r);
    expect(turn.some((r) => r === budgets.turn.iterations)).toBe(true);
    for (const r of defence) expect(r).toBeLessThanOrEqual(budgets.defence.iterations);
  });

  it('scales: Emperor spends more than Warlord, in iterations and in milliseconds', () => {
    expect(BUDGETS.emperor.iterations.turn.iterations).toBeGreaterThan(
      BUDGETS.warlord.iterations.turn.iterations * 2,
    );
    expect(BUDGETS.emperor.ms.turn.ms).toBeGreaterThan(BUDGETS.warlord.ms.turn.ms * 2);
    // The ADR: about 2.5 s and 6 s; defence 0.4 s.
    expect(BUDGETS.warlord.ms.turn.ms).toBe(2500);
    expect(BUDGETS.emperor.ms.turn.ms).toBe(6000);
    expect(BUDGETS.warlord.ms.defence.ms).toBe(400);
  });
});

describe('Warlord: the tree', () => {
  function tree(seed: number, deepening = false) {
    const [d] = sampleGame('warlord', 313, 1).filter(
      (x) => x.view.decision?.kind === 'main' && x.view.turn.number >= 3,
    );
    const view = projectForSearch(d!.before, 'p1');
    const s = session('p1', d!.before, 'warlord', true, { budgets: SMALL });
    // Build the same setup the session builds.
    const setup = (s as unknown as { setup: PirateSetup }).setup;
    const dets = determinizations(view, setup, 4, seed);
    const m = new Mcts({
      me: 'p1',
      ctx: simContext(view, setup),
      setup,
      dets,
      horizon: 2,
      deepening,
    });
    return { m, view, d: d! };
  }

  it('keeps every determinization when the view is the one it was built from', () => {
    const { m, view } = tree(1);
    m.search({ iterations: 40 });
    expect(m.consistent(m.root, view)).toEqual([0, 1, 2, 3]);
  });

  it('drops the determinizations that disagree with what the AI sees, and reroots', () => {
    const { m } = tree(2);
    m.search({ iterations: 200 });
    const best = m.ranked(m.root)[0]!;
    m.reroot(best.kid, [0, 1]);
    expect(m.active).toEqual([0, 1]);
    expect(m.root).toBe(best.kid);
    // Statistics read only the active determinizations.
    expect(m.aggN(best.kid)).toBe(best.kid.n[0]! + best.kid.n[1]!);
  });

  it('tries the playbook-and-structure order first and widens as visits grow', () => {
    const { m } = tree(3);
    m.search({ iterations: 6 });
    const few = m.root.kids.size;
    m.search({ iterations: 300 });
    expect(m.root.kids.size).toBeGreaterThan(few);
    // Progressive widening: never more moves than the rule allows for the visits.
    const n = m.aggN(m.root);
    expect(m.root.kids.size).toBeLessThanOrEqual(Math.ceil(2 * Math.pow(n + 1, 0.5)) + 1);
  });

  it('iterative deepening is a prefix of the same search: it only ever adds depth', () => {
    const a = tree(4, true);
    const b = tree(4, false);
    a.m.search({ iterations: 120 });
    b.m.search({ iterations: 120 });
    expect(a.m.iterations).toBe(120);
    expect(b.m.iterations).toBe(120);
    // The first stage is capped at 3 plies: the deepening tree's first 24 iterations cannot
    // have reached depth 4, so its root visits equal the budget either way.
    expect(a.m.aggN(a.m.root)).toBe(120);
  });

  it('gives a card that asks "how many DON!!" a macro for every count, including none', () => {
    // ST01-011 Brook: [On Play] give up to 2 rested DON!! to a Character (M4b-03).
    const cardsById = cardMap();
    const brook = [...cardsById.values()].find((c) => c.id === 'ST01-011');
    expect(brook, 'ST01-011 is in the card data').toBeTruthy();
    const s0 = start({
      seed: 3,
      turn: 5,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: ROCKS,
        characters: ['OP13-027'],
        life: lifeOf(4, 'EB04-007'),
        hand: ['ST01-011'],
        costArea: { active: 5, rested: 2 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: KAIDO,
        characters: [],
        life: lifeOf(4, 'EB04-007'),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(KAIDO),
      },
    });
    const view = projectForSearch(s0, 'p1');
    const sess = session('p1', s0, 'warlord');
    const setup = (sess as unknown as { setup: PirateSetup }).setup;
    const [det] = determinizations(view, setup, 1, 1);
    const cands = treeCandidates(det!, 'p1', simContext(view, setup), setup);
    const brookPlays = cands.filter((c) => {
      const a = c.actions[0]!;
      return a.type === 'playCard' && queries.card(det!, a.card).card === 'ST01-011';
    });
    const counts = brookPlays
      .map((c) => c.actions[1])
      .filter((a): a is Extract<Action, { type: 'pick' }> => a?.type === 'pick')
      .map((a) => (typeof a.choice === 'object' && 'option' in a.choice ? a.choice.option : ''));
    expect(counts).toContain('0');
    expect(new Set(counts).size).toBeGreaterThanOrEqual(2);
  });

  it('gives fewer than all its DON!! when a later play needs them, and all when nothing does (M5b-10)', () => {
    // Kyo (4000) attacks a rested 6000 Character: 2 DON!! win the fight. With 4 active DON!! and a
    // second Kyo (cost 2) in hand, giving all 4 forfeits the play; with an empty hand it gives all.
    const turn = (hand: string[]) =>
      start({
        seed: 7,
        turn: 5,
        activePlayer: 'p1',
        firstPlayer: 'p1',
        p1: {
          leader: ROCKS,
          life: lifeOf(5, 'OP17-050'),
          costArea: { active: 4, rested: 0 },
          characters: ['OP17-045'],
          decklist: listOf(ROCKS),
          hand,
        },
        p2: {
          leader: KAIDO,
          hand: [],
          characters: [{ card: 'OP17-060', rested: true }],
          life: lifeOf(5, 'OP17-074'),
          costArea: { active: 6, rested: 0 },
          decklist: listOf(KAIDO),
        },
      });
    /** DON!! given before each attack, and whether the hand card was played. */
    const run = (hand: string[]) => {
      setTier('warlord');
      const { steps } = play(turn(hand), 'p1', { biases: true });
      const given: number[] = [];
      let n = 0;
      let played = false;
      for (const x of steps) {
        if (x.player !== 'p1') continue;
        if (x.action.type === 'giveDon') n++;
        if (x.action.type === 'attack') {
          given.push(n);
          n = 0;
        }
        if (x.action.type === 'playCard' && cardOf(x.view, x.action.card) === 'OP17-045')
          played = true;
      }
      setTier('pirate');
      return { given, played };
    };
    const withCard = run(['OP17-045']);
    expect(withCard.played).toBe(true);
    expect(Math.max(...withCard.given)).toBeLessThan(4);
    expect(withCard.given.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(2);
    const without = run([]);
    expect(without.played).toBe(false);
    expect(Math.max(...without.given)).toBe(4);
  });
});

/**
 * L fix round 2: the search-free refutation (`bound.ts`), draws in the attackers bound (L-12), and the
 * Trigger caveat by certainty (L-13, L-14).
 *
 * The refutation's argument is in the file header of `bound.ts`. What these tests guard:
 * - planted: a card that takes cards from their hand (X.Drake) and two copies of a power Event each
 *   count, so the bound cannot refute what they win;
 * - the **bound-agreement property**: wherever the bound (or the reduced-defender pass) refutes, the
 *   full search with both turned off must not prove. A bound that overstates a Counter fails it;
 * - the hidden-information differential, with bound refutations among the positions;
 * - L-12 (the reviewer's repro) and L-13 / L-14 (the wording).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  appendAction,
  createFromScenario,
  legalActions,
  projectForSearch,
  queries,
  reduce,
  startRecord,
  type Action,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import {
  explainLethal,
  lethal,
  priorCardIds,
  reviewMissedLethal,
  tier1,
  type LethalResult,
} from '../src/index.ts';
import { SCRIPTS } from '@optcg/cards';
import { attackerPotential, refutedByBound } from '../src/search/lethal/bound.ts';
import { attackersPossible } from '../src/search/lethal/lethal.ts';
import { cardMap, lookup } from './support.ts';
import { lifeOf, listOf, start } from './support/scenario.ts';

vi.setConfig({ testTimeout: 600_000 });

const cards = cardMap();
const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const LUFFY = 'OP13-001'; // plain 5000 Leader
const ZORO = 'EB04-007'; // 9000 vanilla
const DRAKE = 'OP17-075'; // [On Play] DON!! -2: trash 1 card from your opponent's hand
const LINLIN = 'OP17-049'; // [On Play] your opponent chooses: you draw 2, or they trash 2
const TORCH = 'EB04-040'; // Event, [Main] +3000, cost 1
type Spec = Omit<ScenarioSpec, 'cards'>;

const pubOf = (s: GameState, o: { bound?: 'on' | 'off' | 'overstated'; nodes?: number } = {}) =>
  lethal(
    { mode: 'public', view: projectForSearch(s, 'p1'), ...(o.bound ? { bound: o.bound } : {}) },
    cards,
    { nodes: o.nodes ?? 20_000 },
  );

describe('planted: the bound counts what their hand can lose and every copy', () => {
  /**
   * Luffy (5000) and Zoro (9000) attack Rocks (5000) at 1 Life, so 2 hits land it; one attack may be
   * stopped, not both. Rocks holds 2 hidden cards, each at worst a plain +2000 Counter. With 3
   * active DON!!: if they keep 2 cards, one stop costs up to 2 cards (+4000): both attacks must
   * reach 9000, Luffy needs 4 DON!! (more than 3), so the bound refutes. With X.Drake in hand
   * (it takes 1 card from their hand) they keep 1: +2000, both must reach 7000, Luffy needs 2 DON!!:
   * the bound must not refute.
   */
  const position = (hand: string[], don = 3, theirs = 2): GameState =>
    start({
      seed: 8,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [ZORO],
        hand,
        life: lifeOf(4, ZORO),
        costArea: { active: don, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(1, ZORO),
        hand: Array.from({ length: theirs }, () => ZORO),
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    } as Spec);
  const input = { hand: 2, plain: 2000 };

  it('refutes with a vanilla card in hand', () => {
    const s = position([ZORO]);
    expect(refutedByBound(s, 'p1', cards, input)).toBe(true);
    expect(pubOf(s).defence?.reason).toBe('bound');
  });

  it('does not refute when X.Drake can take one of their cards', () => {
    const s = position([DRAKE]);
    expect(attackerPotential(s, 'p1', cards)!.handLoss).toBe(1);
    expect(refutedByBound(s, 'p1', cards, input)).toBe(false);
    expect(pubOf(s).defence?.reason).not.toBe('bound');
    // ... and it is the hand loss that decides it: the same bound with a hand of 1 refutes nothing either.
    expect(refutedByBound(s, 'p1', cards, { hand: 1, plain: 2000 })).toBe(false);
  });

  it('counts a hand loss per copy (two Drakes take two cards) and Linlin as a loss too', () => {
    expect(attackerPotential(position([DRAKE, DRAKE]), 'p1', cards)!.handLoss).toBe(2);
    expect(attackerPotential(position([LINLIN]), 'p1', cards)!.handLoss).toBe(2);
  });

  it('a Character taken off the board and played again repeats its [On Play] (OP17-056 + X.Drake)', () => {
    // 1 DON!!: with Drake alone it takes 1 card (they keep 1: +2000, Luffy needs 2 DON!!): refuted.
    // OP17-056 returns up to 1 Character of cost 6 or less to its owner's hand, so Drake can be
    // played again: 2 cards (they keep 0): the bound must not refute.
    const alone = position([DRAKE], 1);
    expect(refutedByBound(alone, 'p1', cards, input)).toBe(true);
    const bounced = position([DRAKE, 'OP17-056'], 1);
    expect(attackerPotential(bounced, 'p1', cards)!.handLoss).toBeGreaterThanOrEqual(2);
    expect(refutedByBound(bounced, 'p1', cards, input)).toBe(false);
  });

  it('an active Blocker is a free stop: two attackers cannot land two hits past it', () => {
    // Luffy and Zoro need 2 landed attacks against 1 Life; Rocks has an active [Blocker] (OP17-042)
    // that stops one for nothing, so two attackers are not enough whatever their DON!! and whatever
    // is in their hand (even none).
    const s = start({
      seed: 8,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [ZORO],
        life: lifeOf(4, ZORO),
        costArea: { active: 10, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        characters: ['OP17-042'],
        life: lifeOf(1, ZORO),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    } as Spec);
    expect(refutedByBound(s, 'p1', cards, { hand: 0, plain: 2000 })).toBe(true);
    // ... unless the seat holds a card that can K.O. or rest a Character (OP17-060 K.O.s one).
    const withKo = start({
      seed: 8,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [ZORO],
        hand: ['OP17-060'],
        life: lifeOf(4, ZORO),
        costArea: { active: 10, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        characters: ['OP17-042'],
        life: lifeOf(1, ZORO),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    } as Spec);
    expect(attackerPotential(withKo, 'p1', cards)!.blockerLoss).toBeGreaterThan(0);
    // ... and the outcome, not only the potential: the bound does not refute it (L-16).
    expect(refutedByBound(withKo, 'p1', cards, { hand: 0, plain: 2000 })).toBe(false);
  });

  it('adds the power of each copy of an Event, not of each card id', () => {
    const one = attackerPotential(position([TORCH]), 'p1', cards)!;
    const two = attackerPotential(position([TORCH, TORCH]), 'p1', cards)!;
    expect(one.gainTotal).toBeGreaterThan(0);
    expect(two.gainTotal).toBe(2 * one.gainTotal);
  });

  it('a Drake in hand is a real way to win where the bound would have refuted', () => {
    // 4 DON!!: play Drake (2) and its [On Play] (DON!! -2 returns 2 DON!!), leaving them 1 card.
    // Whatever the search says, the bound must agree with it (the property below samples this widely).
    const s = position([DRAKE], 6);
    const on = pubOf(s);
    const off = pubOf(s, { bound: 'off', nodes: 150_000 });
    if (on.defence?.reason === 'bound' || on.defence?.reason === 'reduced')
      expect(off.status).not.toBe('proven');
  });
});

// ---------------------------------------------------------------------------------------------
// The bound-agreement property and the hidden-information differential.

let seed = 4242;
const rnd = (n: number): number => {
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
  return (seed >>> 8) % n;
};
const pick = <T>(xs: readonly T[]): T => xs[rnd(xs.length)]!;

const ATTACK_HAND = [
  DRAKE,
  LINLIN,
  TORCH,
  TORCH,
  'EB04-030', // Rush Kaido
  'EB04-032', // Queen: draws
  'OP17-076', // a draw Event
  'OP07-076', // an Event with power
  ZORO,
  ZORO,
];
const ATTACK_CHARS = [ZORO, 'OP13-027', 'OP17-060', 'EB04-031', 'OP17-062', 'OP14-104'];

function sample(): { state: GameState; label: string } {
  const defLeader = rnd(2) === 0 ? ROCKS : KAIDO;
  const pool = priorCardIds(defLeader).filter(
    (id) => cards.get(id)?.category !== 'Leader' && !cards.get(id)?.triggerText,
  );
  const hand = Array.from({ length: rnd(3) }, () => pick(ATTACK_HAND));
  const chars = Array.from({ length: rnd(4) }, () => pick(ATTACK_CHARS));
  const life = 1 + rnd(3);
  const defHand = Array.from({ length: rnd(6) }, () => pick(pool));
  const don = rnd(11);
  const leader = pick([LUFFY, LUFFY, KAIDO, ROCKS]);
  const spec = {
    seed: 1 + rnd(1000),
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader,
      characters: chars,
      hand,
      life: lifeOf(4, ZORO),
      costArea: { active: don, rested: 0 },
      decklist: listOf(leader === LUFFY ? ROCKS : leader),
    },
    p2: {
      leader: defLeader,
      characters: rnd(3) === 0 ? ['OP17-042'] : [], // a [Blocker] now and then
      hand: defHand,
      life: Array.from({ length: life }, () => pick(pool)),
      costArea: { active: defLeader === KAIDO ? rnd(4) : 0, rested: 0 },
      decklist: listOf(defLeader),
    },
  } as unknown as Spec;
  return {
    state: createFromScenario({ ...spec, cards: lookup }).state,
    label: `${leader} ${chars.join(',')} hand ${hand.join(',')} don ${don} v ${defLeader} life ${life} hand ${defHand.length}`,
  };
}

/** The same position with every card the attacker cannot see re-rolled in place. */
function rerolled(state: GameState): GameState {
  const c = structuredClone(state) as unknown as {
    players: Record<PlayerId, { hand: string[]; life: string[]; deck: string[] }>;
    cards: Record<string, { card: string }>;
    defs: Record<string, unknown>;
  };
  const leader = queries.zone(state, 'p2', 'leader')[0]!.card;
  const dpool = priorCardIds(leader).filter(
    (id) => cards.get(id)?.category !== 'Leader' && !cards.get(id)?.triggerText && c.defs[id],
  );
  for (const inst of [...c.players.p2.hand, ...c.players.p2.life, ...c.players.p2.deck])
    c.cards[inst]!.card = pick(dpool);
  const mine = Object.keys(c.defs).filter((id) => cards.get(id)?.category === 'Character');
  for (const inst of [...c.players.p1.life, ...c.players.p1.deck]) c.cards[inst]!.card = pick(mine);
  return c as unknown as GameState;
}

const norm = (r: unknown): string => {
  const seen = new Map<string, string>();
  return JSON.stringify(r).replace(/h[0-9a-f]{12}/g, (h) => {
    if (!seen.has(h)) seen.set(h, `H${seen.size}`);
    return seen.get(h)!;
  });
};

const N = Number(process.env.BOUND_POSITIONS ?? 60);

describe('the bound agrees with the search, and leaks nothing', () => {
  it('wherever the bound or the reduced defender refutes, the full search proves nothing', () => {
    const stats = { n: 0, bound: 0, reduced: 0, attackers: 0, checked: 0, diff: 0, diffBound: 0 };
    const bad: string[] = [];
    for (let i = 0; i < N; i++) {
      const { state, label } = sample();
      stats.n++;
      const r = pubOf(state, { nodes: 12_000 });
      const reason = r.defence?.reason;
      if (r.status === 'refuted' && (reason === 'bound' || reason === 'reduced')) {
        stats[reason]++;
        const off = pubOf(state, { bound: 'off', nodes: 120_000 });
        stats.checked++;
        if (off.status === 'proven')
          bad.push(`${label}: ${reason} refutes, the full search proves`);
      }
      if (reason === 'attackers') stats.attackers++;
      // The differential: re-rolled hidden cards, the same answer.
      if (i % 2 === 0) {
        const r2 = pubOf(rerolled(state), { nodes: 12_000 });
        if (norm(r) !== norm(r2)) {
          stats.diff++;
          if (reason === 'bound' || reason === 'reduced') stats.diffBound++;
          bad.push(`${label}: the answer changed with their hidden cards`);
        }
      }
    }
    if (process.env.LETHAL_LOG) process.stdout.write(`bound agreement: ${JSON.stringify(stats)}\n`);
    expect(bad, bad.join('\n')).toEqual([]);
    // Worth something only if the bound fired and was checked.
    expect(stats.bound).toBeGreaterThan(0);
    expect(stats.checked).toBeGreaterThan(0);
  });

  it('a bound that believes a Counter is worth twice as much is caught', () => {
    // Luffy (5000) and Zoro (9000) against Rocks at 1 Life with 1 hidden card (+2000), 2 DON!!.
    // Hand-worked: Luffy with 2 DON!! (7000) attacks first; 7000 against 5000 + 2000 ties and hits,
    // Life 1 -> 0 and their hand is 2; Zoro (9000) against 5000 + 4000 ties and hits: a win.
    // The sound bound (thr 7000, Luffy needs 2 DON!!) does not refute. A Counter believed to be +4000
    // would (thr 9000, 4 DON!!), and the full search with the bound off proves it: the property
    // above fails against such a bound.
    const s = createFromScenario({
      cards: lookup,
      seed: 8,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [ZORO],
        life: lifeOf(4, ZORO),
        costArea: { active: 2, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(1, ZORO),
        hand: [ZORO],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    } as unknown as ScenarioSpec).state;
    expect(pubOf(s, { bound: 'overstated' }).defence?.reason).toBe('bound');
    expect(pubOf(s, { bound: 'off', nodes: 150_000 }).status).toBe('proven');
    expect(pubOf(s).defence?.reason).not.toBe('bound');
    expect(pubOf(s).status).toBe('proven');
  });
});

// ---------------------------------------------------------------------------------------------
// L-12

describe('L-12: a draw can find the Rush Character', () => {
  /**
   * p1 Kaido (OP17-058), hand Queen (EB04-032) and OP17-076, deck top EB04-030 then Zoro, 10 active
   * DON!!; p2 Rocks at 1 Life, no hand, no DON!!. Play Queen (trash OP17-076, draw 2, among them
   * EB04-030), play EB04-030 (DON!! -2, Rush), attack with it, then the Leader: 2 hits, a win.
   */
  const spec = {
    seed: 5,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: KAIDO,
      hand: ['EB04-032', 'OP17-076'],
      deck: ['EB04-030', ZORO, ...listOf(KAIDO).slice(0, 25)],
      life: lifeOf(3, ZORO),
      costArea: { active: 10, rested: 0 },
    },
    p2: {
      leader: ROCKS,
      life: lifeOf(1, ZORO),
      hand: [],
      costArea: { active: 0, rested: 0 },
      decklist: listOf(ROCKS),
    },
  } as unknown as Spec;
  const state = (): GameState => createFromScenario({ ...spec, cards: lookup }).state;

  it('actual mode proves it: the deck is known and the draw is played', () => {
    // `proven` (255 nodes), not only "not refuted": a search that does not play a `draw` when the
    // deck is known (`DECK_OPS`) ends `refuted` or `unknown` here (L-16).
    const r = lethal({ mode: 'actual', state: state() }, cards, { nodes: 200_000 });
    expect(r.status).toBe('proven');
    expect(r.defence?.reason).not.toBe('attackers');
  });

  it('actual mode plays a card whose only ops are a look at the top and a draw (DECK_OPS)', () => {
    // Queen above also has an [Activate] that adds DON!!, so it matters to the search whatever its
    // draw is. OP17-050 (look at 2, reorder, draw 1) has nothing else: it is played only because the
    // deck is known, and then the Rush Kaido on top is drawn, played and attacks with the Leader.
    const s = createFromScenario({
      ...(spec as object),
      cards: lookup,
      p1: { ...spec.p1, hand: ['OP17-050'] },
    } as unknown as ScenarioSpec).state;
    const r = lethal({ mode: 'actual', state: s }, cards, { nodes: 200_000 });
    expect(r.status).toBe('proven');
  });

  it('public mode never says "any hand" about a refutation that ignores a draw, and says so', () => {
    const r = lethal({ mode: 'public', view: projectForSearch(state(), 'p1') }, cards, {
      nodes: 100_000,
    });
    if (r.status === 'refuted') {
      expect(r.certainty).not.toBe('any-hand');
      expect(r.defence?.drawsIgnored).toBe(true);
      expect(tier1(r).sr).toContain('from what you hold');
      expect(explainLethal(r, cards, 'coach').claim).toContain('from what you hold');
    }
  });

  it('review does not skip that turn', () => {
    const init = createFromScenario({ ...spec, cards: lookup });
    let rec = startRecord({ scenario: spec as never }, init.state);
    const a: Action = { type: 'endTurn', player: 'p1' };
    const s1 = reduce(init.state, a).state;
    rec = appendAction(rec, a, s1);
    const next = legalActions(s1).find((x) => x.type !== 'concede')!;
    rec = appendAction(rec, next, reduce(s1, next).state);
    const flags = reviewMissedLethal(rec, lookup, cards, { seats: ['p1'] });
    expect(flags.filter((f) => f.kind === 'missed-lethal')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------
// L-13, L-14

describe('the Trigger caveat follows the certainty (L-13) and is not dropped (L-14)', () => {
  const trigger = { exposed: 1, triggersInPrior: 5, probabilityNone: 0.4 };

  it("the reviewer's case: Sabo, 1 Life, empty hand is 'depends on their hand', never 'any hand'", () => {
    const s = start({
      seed: 3,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [ZORO, ZORO, ZORO],
        life: lifeOf(4, ZORO),
        costArea: { active: 10, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: 'OP13-004',
        life: lifeOf(1, ZORO),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf('OP13-004'),
      },
    } as Spec);
    const r = pubOf(s, { nodes: 100_000 });
    expect(r.status).toBe('proven');
    expect(r.certainty).toBe('needed-hidden-info');
    const t = tier1(r);
    expect(t.sr.toLowerCase()).not.toContain('any hand');
    expect(t.chip).toBe('Depends on their hand');
    if (r.trigger && r.trigger.probabilityNone < 1) {
      expect(t.triggerNote).toMatch(/^Depends on their hand, and a Life card's Trigger/);
      expect(t.sr).toContain('Trigger');
    }
  });

  const proven = (certainty: LethalResult['certainty']): LethalResult => {
    const s = start({
      seed: 3,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [ZORO, ZORO],
        life: lifeOf(4, ZORO),
        costArea: { active: 10, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(1, ZORO),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    } as Spec);
    const r = pubOf(s);
    expect(r.status).toBe('proven');
    return { ...r, certainty, trigger };
  };

  it.each([
    ['any-hand', /^Works against any hand, unless a Life card's Trigger stops it/],
    ['needed-hidden-info', /^Depends on their hand, and a Life card's Trigger could stop it/],
  ] as const)('%s: the note, the screen-reader line and the chip agree', (certainty, note) => {
    const t = tier1(proven(certainty));
    expect(t.triggerNote).toMatch(note);
    expect(t.sr).toBe(`Lethal: proven. ${t.triggerNote}`);
    expect(t.sr).toContain('Trigger'); // dropping the caveat from the polite line fails here
    if (certainty === 'needed-hidden-info') expect(t.sr.toLowerCase()).not.toContain('any hand');
  });

  it('with no Trigger chance there is no caveat', () => {
    const r = { ...proven('any-hand'), trigger: null };
    expect(tier1(r).triggerNote).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------
// L-16: every term of the refutation is pinned by a planted position, built through the engine. The
// real bound must not refute it (or, for the two terms that only ever weaken it, must refute it),
// and a bound with that one term wrong would say the opposite. Where the full search (bound off)
// proves the position the assertion is `proven`, so a bound that refutes it is unsound. Where no
// position is both provable and refuted by the mutant (the bound is sound but not tight there), the
// position is one the search refutes by its own reduced pass and the assertion is that the bound
// itself makes no claim.

describe('L-16: each term of the bound is pinned by a planted position', () => {
  const BLOCKER = 'OP17-042'; // [Blocker] 6000
  const WEAK = 'OP06-108'; // vanilla 2000, no script
  const WEAK0 = 'OP13-014'; // vanilla 0
  const PLUS2 = 'OP08-051'; // [On Play] +2000 to a Leader or Character, cost 1
  type Side = Record<string, unknown>;
  const pos = (o: {
    p1?: Side;
    p2?: Side;
    don: number;
    life: number;
    hand: number;
    leader?: string;
    defender?: string;
  }): GameState => {
    const leader = o.leader ?? LUFFY;
    const defender = o.defender ?? ROCKS;
    return start({
      seed: 8,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader,
        life: lifeOf(4, ZORO),
        costArea: { active: o.don, rested: 0 },
        decklist: listOf(leader === LUFFY ? ROCKS : leader),
        ...o.p1,
      },
      p2: {
        leader: defender,
        life: lifeOf(o.life, ZORO),
        hand: Array.from({ length: o.hand }, () => ZORO),
        costArea: { active: 0, rested: 0 },
        decklist: listOf(defender),
        ...o.p2,
      },
    } as unknown as Spec);
  };
  const plain = (hand: number) => ({ hand, plain: 2000 });
  const proves = (s: GameState): void => {
    expect(pubOf(s, { nodes: 30_000 }).status).toBe('proven');
    expect(pubOf(s, { bound: 'off', nodes: 150_000 }).status).toBe('proven');
  };

  it('blockerLoss: Torch rests their Blocker, so the two attackers still land (proven)', () => {
    // Kaido Leader and Zoro against Rocks at 1 Life behind an active [Blocker]; Torch (EB04-040)
    // rests it. With `free = blockers` the bound counts the Blocker as a stop and refutes.
    const s = pos({
      leader: KAIDO,
      p1: { characters: [ZORO], hand: [TORCH] },
      p2: { characters: [BLOCKER] },
      don: 7,
      life: 1,
      hand: 0,
    });
    expect(attackerPotential(s, 'p1', cards)!.blockerLoss).toBe(1);
    expect(refutedByBound(s, 'p1', cards, plain(0))).toBe(false);
    proves(s);
  });

  it('need + free: the attackers a Blocker can stop must all be strong, so a weak third attacker refutes', () => {
    // Luffy 5000, Zoro 9000 and a 2000 vanilla against Rocks at 1 Life, an active [Blocker] and 1
    // hidden card, 3 DON!!: the defender blocks one attack and counters another, so all three must
    // get past +2000, and the 2000 attacker cannot (it needs 5 DON!!). Dropping `+ free` from the
    // loop looks at the best two only and does not refute.
    const s = pos({
      p1: { characters: [ZORO, WEAK] },
      p2: { characters: [BLOCKER] },
      don: 3,
      life: 1,
      hand: 1,
    });
    expect(refutedByBound(s, 'p1', cards, plain(1))).toBe(true);
    expect(pubOf(s).defence?.reason).toBe('bound');
    expect(pubOf(s, { bound: 'off', nodes: 150_000 }).status).not.toBe('proven');
  });

  it('gainTotal: every copy of a power card counts (one +2000 card is refuted, two are not)', () => {
    // Luffy and Zoro against Rocks at 1 Life with 3 hidden cards and 4 DON!!, OP08-051 (+2000 for 1
    // DON!!) in hand. One copy: the bound refutes. Two: the gap shrinks by 4000 and the bound makes no
    // claim (the search refutes it itself, by its reduced pass). Not subtracting `gainTotal` refutes
    // both.
    const copies = (n: number): GameState =>
      pos({ p1: { characters: [ZORO], hand: Array(n).fill(PLUS2) }, don: 4, life: 1, hand: 3 });
    expect(refutedByBound(copies(1), 'p1', cards, plain(3))).toBe(true);
    expect(refutedByBound(copies(2), 'p1', cards, plain(3))).toBe(false);
    expect(pubOf(copies(2)).defence?.reason).not.toBe('bound');
    expect(pubOf(copies(2), { bound: 'off', nodes: 150_000 }).status).not.toBe('proven');
  });

  it('gain: a permanent power boost to the seat counts (a planted card; no printed card has one)', () => {
    // No scripted card boosts its own side permanently, so one is planted on a vanilla Character for
    // this test and removed after. Luffy and it against Rocks at 1 Life, 1 DON!!, no hand: the aura
    // makes the Leader 7000 and the bound must not refute. Not subtracting `gain` would. The aura is
    // real in the engine: with 5 DON!! the search proves it.
    const planted = {
      cardId: WEAK,
      textHash: 'planted',
      verified: { source: 'planted for L-16', date: '2026-11-09' },
      abilities: [
        {
          id: 'aura',
          label: 'aura',
          kind: 'permanent',
          apply: [
            { power: { target: { from: ['leader', 'characters'], owner: 'you' }, amount: 2000 } },
          ],
        },
      ],
    };
    const table = SCRIPTS as unknown as Record<string, unknown>;
    expect(table[WEAK]).toBeUndefined();
    table[WEAK] = planted;
    try {
      const low = pos({ p1: { characters: [WEAK] }, don: 1, life: 1, hand: 0 });
      expect(attackerPotential(low, 'p1', cards)!.gain).toBe(2000);
      expect(refutedByBound(low, 'p1', cards, plain(0))).toBe(false);
      expect(pubOf(low).defence?.reason).not.toBe('bound');
      proves(pos({ p1: { characters: [WEAK] }, don: 5, life: 1, hand: 0 }));
    } finally {
      Reflect.deleteProperty(table, WEAK);
    }
  });

  it('unblockable: an [Unblockable] attacker lands past their Blocker (proven)', () => {
    // The Rocks Leader gets [Unblockable] from OP17-055 (rest 1 DON!!) and attacks Kaido at 0 Life:
    // one landed attack wins. The 0-power vanilla is a second attacker that could not land. Counting
    // the Blocker anyway makes both attackers need to land, and the bound refutes.
    const s = pos({
      leader: ROCKS,
      defender: KAIDO,
      p1: { characters: [WEAK0], hand: ['OP17-055'] },
      p2: { characters: [BLOCKER] },
      don: 1,
      life: 0,
      hand: 0,
    });
    expect(attackerPotential(s, 'p1', cards)!.unblockable).toBe(true);
    expect(refutedByBound(s, 'p1', cards, plain(0))).toBe(false);
    proves(s);
  });

  it('Double Attack: one Double Attack hit takes two Life (proven)', () => {
    // Luffy and OP13-118 (Double Attack, 7000) against Rocks at 2 Life, 4 DON!!: the Double Attack
    // takes both Life, then the Leader (9000 with all 4 DON!!) lands at 0 against 2 cards. With `h = 1`
    // the bound needs 3 landed attacks out of 2 and refutes.
    const s = pos({ p1: { characters: ['OP13-118'] }, don: 4, life: 2, hand: 0 });
    expect(attackerPotential(s, 'p1', cards)!.da).toBe(true);
    expect(refutedByBound(s, 'p1', cards, plain(0))).toBe(false);
    proves(s);
  });

  it("addDon: the reviewer's King case, a rested King adds a DON!! (proven)", () => {
    // Kaido Leader, a rested King (EB04-031: adds 1 active DON!!), Zoro and 1 active DON!! against
    // Rocks at 1 Life with 1 hidden card. The search proves it; with `addDon` dropped the bound thinks
    // the seat has 1 DON!! and refutes.
    const s = pos({
      leader: KAIDO,
      p1: { characters: [ZORO, { card: 'EB04-031', rested: true }] },
      don: 1,
      life: 1,
      hand: 1,
    });
    expect(attackerPotential(s, 'p1', cards)!.don).toBe(2);
    expect(refutedByBound(s, 'p1', cards, plain(1))).toBe(false);
    proves(s);
  });

  it('bounces: more than four ways to take a Character off the board, and the bound makes no claim', () => {
    // Zoro and Luffy against Rocks at 1 Life with 2 hidden cards, 3 DON!!: the bound refutes (the first
    // planted test). With five copies of OP17-056 (return a Character to hand) in hand the replays of
    // an [On Play] are too many to bound: `attackerPotential` is null and nothing is refuted. With four
    // it still computes and refutes. Without the guard the five-copy position is refuted.
    const copies = (n: number): GameState =>
      pos({
        p1: { characters: [ZORO], hand: Array(n).fill('OP17-056') },
        don: 3,
        life: 1,
        hand: 2,
      });
    expect(refutedByBound(copies(4), 'p1', cards, plain(2))).toBe(true);
    expect(attackerPotential(copies(5), 'p1', cards)).toBeNull();
    expect(refutedByBound(copies(5), 'p1', cards, plain(2))).toBe(false);
    expect(pubOf(copies(5)).defence?.reason).not.toBe('bound');
  });

  it('rushy: a Rush Character that is taken off the board and played again attacks again', () => {
    // Kaido Leader, EB04-030 (gives itself [Rush]: 2 attacks counted) and OP17-056 (one way to take
    // a Character off the board) in hand, against Rocks at 3 Life: 4 attacks are needed and 1 + 2 + 1
    // are counted. Dropping the replay attack leaves 3 and "too few attackers" refutes it.
    const s = pos({
      leader: KAIDO,
      p1: { hand: ['EB04-030', 'OP17-056'] },
      don: 10,
      life: 3,
      hand: 0,
    });
    expect(attackersPossible(s, 'p1', cards, false)).toBe(true);
    expect(refutedByBound(s, 'p1', cards, plain(0))).toBe(false);
    expect(pubOf(s).defence?.reason).not.toBe('attackers');
  });

  it('the reduced-defender pass decides, within a node budget, what the full search cannot', () => {
    // The Rocks Leader and a 12000 Kaido against Kaido (OP17-058) at 1 Life with 3 hidden cards and
    // 4 DON!!: the bound makes no claim, the reduced pass refutes it in about 540 nodes, and the full
    // search (bound off, which also turns the pass off) is still `unknown` at 3000.
    const s = pos({
      leader: ROCKS,
      defender: KAIDO,
      p1: { characters: ['OP17-062'] },
      don: 4,
      life: 1,
      hand: 3,
    });
    expect(refutedByBound(s, 'p1', cards, plain(3))).toBe(false);
    const on = pubOf(s, { nodes: 3000 });
    expect(on.status).toBe('refuted');
    expect(on.defence?.reason).toBe('reduced');
    expect(on.nodes).toBeLessThan(3000);
    expect(pubOf(s, { bound: 'off', nodes: 3000 }).status).toBe('unknown');
  });
});

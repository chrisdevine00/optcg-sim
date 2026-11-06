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
import { attackerPotential, refutedByBound } from '../src/search/lethal/bound.ts';
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

  it('actual mode does not refute: the deck is known and the draw is played', () => {
    const r = lethal({ mode: 'actual', state: state() }, cards, { nodes: 200_000 });
    expect(r.status).not.toBe('refuted');
    expect(r.defence?.reason).not.toBe('attackers');
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

/**
 * Lethal search (ARCHITECTURE §4.4, PLAN row 13 and §5 "Lethal positions with known answers").
 *
 * Every position is planted, and every expected answer is worked by hand in the comment above it
 * from the rules, not read off the search:
 * - the attacker wins a battle when its power is at least the defender's (CR 7-1-4-1), so stopping an
 *   attack takes (attack − defence + 1000);
 * - a hit on a Leader with 0 Life wins (CR 7-1-4-1-1-1); with Life left it moves the top Life card
 *   to the defender's hand (CR 7-1-4-1-1-2), so the defence grows by one card per hit;
 * - [Banish] trashes that Life card instead (CR 10-1-3-1); [Double Attack] takes two (CR 10-1-2-1), but
 *   at 1 Life it takes the last one and does not win (CR 7-1-4-1-1-1, RL-20);
 * - one [Blocker] can stop one attack, and then it is rested (CR 7-1-2-1, 10-1-4-1).
 *
 * Rocks.D.Xebec (OP17-039) is the defender in the `public` positions: its sourced lists run no
 * [Trigger] and its biggest Counter is +2000 (explanations.md E01, E20), so each hidden card counts
 * +2000 and each hit adds a card.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  actionFromView,
  appendAction,
  createFromScenario,
  startRecord,
  legalActions,
  projectForSearch,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
  type ScenarioSpec,
} from '@optcg/engine';
import {
  certaintyLabel,
  checkGuidedCount,
  explainLethal,
  guidedCount,
  lethal,
  attackersPossible,
  reviewMissedLethal,
  priorCardIds,
  tier1,
  tier2,
  type LethalResult,
} from '../src/index.ts';
import { counterProfile } from '../src/search/lethal/profile.ts';
import { cardMap, lookup } from './support.ts';
import { docExample } from './support/doc.ts';
import { lifeOf, listOf, start } from './support/scenario.ts';

vi.setConfig({ testTimeout: 120_000 });

const ROCKS = 'OP17-039';
const KAIDO = 'OP17-058';
const LUFFY = 'OP13-001'; // a plain 5000 Leader: unscripted, nothing to search but its power
const SANJI = 'OP13-027'; // 7000, no Counter, vanilla
const ZORO = 'EB04-007'; // 9000, no Counter, vanilla
const MORIA = 'OP14-104'; // 10000, no Counter, vanilla
const LUFFY_DA = 'OP13-118'; // 7000 [Double Attack]
const QUEEN = 'OP17-065'; // 10000 [Banish]
const KAIDO_BLOCKER = 'OP17-042'; // 6000 [Blocker]
const NO_COUNTER = ZORO; // a card with no Counter value: hidden filler and real Life cards

const cards = cardMap();
const CAP = { nodes: 250_000 };

type Spec = Omit<ScenarioSpec, 'cards'>;

/** Player 1 attacks. `mine` and `theirs` are the two sides. */
function position(o: {
  chars: string[];
  don: number;
  /** Player 2 */
  life: number;
  hand: string[];
  blockers?: (string | { card: string; rested: boolean })[];
  leader?: string;
  lifeCard?: string;
}): GameState {
  const spec: Spec = {
    seed: 11,
    turn: 9,
    activePlayer: 'p1',
    firstPlayer: 'p1',
    p1: {
      leader: LUFFY,
      characters: o.chars,
      life: lifeOf(4, NO_COUNTER),
      hand: [],
      costArea: { active: o.don, rested: 0 },
      decklist: listOf(ROCKS),
    },
    p2: {
      leader: o.leader ?? ROCKS,
      characters: o.blockers ?? [],
      life: lifeOf(o.life, o.lifeCard ?? NO_COUNTER),
      hand: o.hand,
      costArea: { active: 0, rested: 0 },
      decklist: listOf(o.leader ?? ROCKS),
    },
  };
  return start(spec);
}

const pub = (s: GameState, nodes = CAP.nodes) =>
  lethal({ mode: 'public', view: projectForSearch(s, 'p1') }, cards, { nodes });
const act = (s: GameState, nodes = CAP.nodes) =>
  lethal({ mode: 'actual', state: s }, cards, { nodes });

type Attack = Extract<NonNullable<LethalResult['line']>[number], { kind: 'attack' }>;
const attacks = (r: LethalResult): Attack[] =>
  (r.line ?? []).filter((s): s is Attack => s.kind === 'attack');
const donOf = (r: LethalResult): number => attacks(r).reduce((t, a) => t + a.don, 0);

/**
 * How the defender answers in a replay. `greedy` counters every attack with everything it has;
 * `thrifty` counters only an attack that its hand can actually stop (then with the fewest cards);
 * `never` takes every hit. A winning line must beat all three.
 */
type Policy = 'greedy' | 'thrifty' | 'never';

function defenceAction(s: GameState, policy: Policy): Action {
  const acts = legalActions(s).filter((a) => a.type !== 'concede');
  const blocker =
    policy === 'never' ? undefined : acts.find((a) => a.type === 'block' && a.blocker !== null);
  if (blocker) return blocker;
  const counters = acts
    .filter((a) => a.type === 'counter')
    .sort(
      (x, y) => (queries.card(s, y.card).counter ?? 0) - (queries.card(s, x.card).counter ?? 0),
    );
  let counter: Action | undefined;
  if (policy === 'greedy') counter = counters[0];
  else if (policy === 'thrifty' && counters.length > 0) {
    const b = queries.battle(s)!;
    const need =
      (queries.card(s, b.attacker).power ?? 0) - (queries.card(s, b.target).power ?? 0) + 1000;
    const total = counters.reduce((t, c) => t + (queries.card(s, c.card).counter ?? 0), 0);
    // Counter only if the hand reaches `need` (the cards left are all that matters here).
    if (total >= need) counter = counters[0];
  }
  return (
    counter ??
    (policy !== 'never' ? acts.find((a) => a.type === 'optional' && a.accept) : undefined) ??
    acts.find((a) => a.type === 'optional' && !a.accept) ??
    acts.find((a) => a.type === 'trigger' && !a.activate) ??
    acts.find((a) => a.type === 'pick') ??
    acts.find((a) => a.type === 'block' && a.blocker === null) ??
    acts.find((a) => a.type === 'endCounter') ??
    acts.find((a) => a.type === 'done') ??
    acts[0]!
  );
}

/** Play the attacker's `actions` against a defender policy; return the end state. */
function playOut(
  s0: GameState,
  actions: Action[],
  viaView = true,
  policy: Policy = 'thrifty',
): GameState {
  let s = s0;
  const queue = [...actions];
  for (let i = 0; i < 400; i++) {
    if (queries.result(s)) break;
    const dec = queries.decision(s);
    if (!dec) break;
    if (dec.player === 'p1') {
      const a = queue.shift();
      if (!a) break;
      s = reduce(s, viaView ? actionFromView(s, 'p1', a) : a).state;
    } else s = reduce(s, defenceAction(s, policy)).state;
  }
  return s;
}

/** Engine actions: for each `[card, don]` give that many DON!! to it, then attack their Leader with it. */
function attackLine(s: GameState, plan: [string, number][]): Action[] {
  const legal = legalActions(s);
  const theirLeader = queries.zone(s, 'p2', 'leader')[0]!.instance;
  const mine = [...queries.zone(s, 'p1', 'leader'), ...queries.zone(s, 'p1', 'characters')];
  const out: Action[] = [];
  for (const [card, don] of plan) {
    const c = mine.find((x) => x.card === card)!;
    const give = legal.find((a) => a.type === 'giveDon' && a.target === c.instance)!;
    for (let i = 0; i < don; i++) out.push(give);
    out.push({ type: 'attack', attacker: c.instance, target: theirLeader, player: 'p1' });
  }
  return out;
}

/** A proven line beats every policy when played against the real position. */
function beatsEveryDefence(s: GameState, r: LethalResult): boolean {
  return (['greedy', 'thrifty', 'never'] as const).every((p) =>
    won(playOut(s, r.viewActions!, true, p)),
  );
}
const won = (s: GameState, p: PlayerId = 'p1'): boolean => {
  const r = queries.result(s);
  return !!r && 'winner' in r && r.winner === p;
};

describe('lethal: planted positions with known answers', () => {
  /**
   * PROVEN. Luffy (leader, 5000) and Sanji (7000); Rocks at 1 Life with 0 cards. 2 hits needed.
   * Hit 1: Leader 5000 against 5000 is a tie, the attacker wins, Life 1 → 0, hand 0 → 1.
   * Hit 2: Sanji 7000 against 5000 + 2000 (one card) is a tie, a hit at 0 Life: win. No DON!! needed.
   * Sanji first would give the Leader's 5000 an opponent of 7000: so the Leader goes first.
   */
  it('proven: the weaker attack first, no DON!!, works against any hand', () => {
    const s = position({ chars: [SANJI], don: 0, life: 1, hand: [] });
    const r = pub(s);
    expect(r.status).toBe('proven');
    expect(r.certainty).toBe('any-hand');
    expect(r.oblivious).toBe(true);
    expect(r.facts).toMatchObject({
      opponentLife: 1,
      hitsNeeded: 2,
      handSize: 0,
      maxPerCard: 2000,
    });
    expect(r.facts.attackers.map((a) => a.card).sort()).toEqual([LUFFY, SANJI].sort());
    expect(attacks(r).map((a) => [a.card, a.don])).toEqual([
      [LUFFY, 0],
      [SANJI, 0],
    ]);
    expect(attacks(r).map((a) => [a.need, a.maxDefence, a.handSize])).toEqual([
      [1000, 0, 0], // 5000 − 5000 + 1000; no cards
      [3000, 2000, 1], // 7000 − 5000 + 1000; one card, +2000: tied, so it lands
    ]);
    // Replayed against the strongest defence (a real hand of Counters would not change it).
    expect(won(playOut(s, r.viewActions!))).toBe(true);
    // Tier 1 and 2 (learning-ui §3.1).
    expect(tier1(r)).toMatchObject({
      text: 'Lethal is on the board.',
      chip: 'Works against any hand',
    });
    expect(tier2(r).text).toBe('You need 2 hits. You have 2 attackers that can hit their Leader.');
  });

  /**
   * REFUTED. Same board, but Rocks holds 2 cards (up to +4000) and the Leader and Sanji have 3 DON!!.
   * 2 hits needed. Sanji with 3 DON!! is 10000 against 5000 + 4000 = 9000: that hit always lands
   * (Life 1 → 0, hand 3, +6000). The Leader then has 5000 against 11000, and no DON!! left.
   * The other way round, the Leader with 3 DON!! is 8000 against 9000: they stop it. So no order
   * lands two hits, and the best order lands one.
   */
  it('refuted: the defender can stop a hit, and the best order lands one', () => {
    const s = position({ chars: [SANJI], don: 3, life: 1, hand: [NO_COUNTER, NO_COUNTER] });
    // The search-free bound refutes this too (lethal-bound.test.ts); here the search's own line is read.
    expect(pub(s).defence?.reason).toBe('bound');
    const r = lethal({ mode: 'public', view: projectForSearch(s, 'p1'), bound: 'off' }, cards, CAP);
    expect(r.status).toBe('refuted');
    expect(r.certainty).toBe('needed-hidden-info');
    expect(r.defence).toMatchObject({ lifeTaken: 1, hitsNeeded: 2 });
    expect(tier1(r).text).toBe('No lethal: they can stop at least 1 of the 2 hits you need.');
    const e = explainLethal(r, cards, 'coach');
    expect(e.claim).toBe('No lethal: they can stop at least 1 of the 2 hits.');
    expect(e.line).toBeNull();
    // Against the hand they really hold (two cards with no Counter) the same attack wins: the
    // refutation is the worst case, and `actual` mode says what the real hand allowed.
    expect(act(s).status).toBe('proven');
  });

  /**
   * NEEDS A SPECIFIC DON!! SPLIT. Luffy 5000, Sanji 7000, Zoro 9000; Rocks at 2 Life with 1 card.
   * 3 hits needed, against 1, 2 and 3 cards: at most +2000, +4000, +6000, so the attacks need
   * 7000, 9000 and 11000. Pairing the attackers (5000, 7000, 9000) with those costs, in DON!!:
   * 2 + 2 + 2 = 6 for the ascending pairing; 0 + 2 + 6 = 8 for 9000 → 7000, 7000 → 9000,
   * 5000 → 11000; no pairing is cheaper than 6 (each attack must reach its need, and the sum of the
   * shortfalls is smallest when the order matches). With 5 DON!! none works; with 6 some do. And 6
   * DON!! on one attacker does not: Zoro with all 6, then Sanji and the Leader bare, faces a
   * Counter that stops the third hit.
   */
  it('needs a specific DON!! split: 6 DON!! win, 5 do not, all 6 on one attacker lose', () => {
    const chars = [SANJI, ZORO];
    const six = position({ chars, don: 6, life: 2, hand: [NO_COUNTER] });
    const r = pub(six);
    expect(r.status).toBe('proven');
    expect(donOf(r)).toBe(6);
    expect(attacks(r).map((a) => a.maxDefence)).toEqual([2000, 4000, 6000]);
    // Each attack reaches 5000 + the most they can add by then.
    expect(attacks(r).every((a) => a.power >= 5000 + a.maxDefence)).toBe(true);
    expect(beatsEveryDefence(six, r)).toBe(true);
    expect(pub(position({ chars, don: 5, life: 2, hand: [NO_COUNTER] })).status).toBe('refuted');
    // Played with a real +2000 Counter (OP12-114) in their hand: the lopsided split loses to it.
    const real = position({ chars, don: 6, life: 2, hand: ['OP12-114'] });
    expect(
      won(
        playOut(
          real,
          attackLine(real, [
            [ZORO, 6],
            [SANJI, 0],
            [LUFFY, 0],
          ]),
          false,
        ),
      ),
    ).toBe(false);
    // ... and the search's split wins against the same hand.
    expect(
      won(
        playOut(
          real,
          attackLine(
            real,
            attacks(r).map((a) => [a.card, a.don] as [string, number]),
          ),
          false,
        ),
      ),
    ).toBe(true);
  });

  /**
   * DEFENCE THAT GROWS BY ONE CARD PER HIT. Luffy 5000, Sanji 7000, Zoro 9000, no DON!!; Rocks at 2
   * Life, 0 cards. 3 hits. Cards at each attack: 0, 1, 2 (each hit adds one), so they can add 0,
   * 2000 and 4000 and the attacks must be at least 5000, 7000 and 9000. Only the ascending order
   * Luffy, Sanji, Zoro meets that: Zoro first would leave Luffy's 5000 against 5000 + 4000.
   */
  it('a defence that grows by one card per hit: only the ascending order wins', () => {
    const s = position({ chars: [SANJI, ZORO], don: 0, life: 2, hand: [] });
    const r = pub(s);
    expect(r.status).toBe('proven');
    expect(attacks(r).map((a) => a.card)).toEqual([LUFFY, SANJI, ZORO]);
    expect(attacks(r).map((a) => a.handSize)).toEqual([0, 1, 2]);
    expect(attacks(r).map((a) => a.maxDefence)).toEqual([0, 2000, 4000]);
    const e = explainLethal(r, cards, 'coach');
    expect(e.evidence.find((x) => x.text.startsWith('Each hit gives them a card'))).toMatchObject({
      text: 'Each hit gives them a card: 0 cards for your first attack, 1 for the second, 2 for the third.',
      figures: { cardsAtFirst: 0, cardsAtSecond: 1, cardsAtThird: 2 },
    });
    expect(won(playOut(s, r.viewActions!))).toBe(true);
  });

  /**
   * DOUBLE ATTACK at 1 Life (explanations.md E18, RL-20). Luffy 5000 and Luffy (OP13-118, 7000,
   * [Double Attack]); Rocks at 1 Life with 0 cards. Leader first: tie, Life 1 → 0, hand 1. Luffy
   * 7000 against 5000 + 2000: tie, a hit at 0 Life wins. Luffy first: Double Attack takes the last
   * Life card and the second point does nothing; then the Leader's 5000 faces 7000: stopped. So the
   * line is Leader, then Luffy, and it is the only order.
   */
  it('Double Attack at 1 Life counts as one hit: the Leader goes first', () => {
    const s = position({ chars: [LUFFY_DA], don: 0, life: 1, hand: [] });
    const r = pub(s);
    expect(r.status).toBe('proven');
    expect(attacks(r).map((a) => a.card)).toEqual([LUFFY, LUFFY_DA]);
    expect(r.facts.attackers.find((a) => a.card === LUFFY_DA)?.doubleAttack).toBe(true);
    expect(r.facts.hitsNeeded).toBe(2);
    const e = explainLethal(r, cards, 'coach');
    expect(e.evidence.some((x) => x.text.includes('Double Attack takes 2 Life cards'))).toBe(true);
    expect(beatsEveryDefence(s, r)).toBe(true);
    // The other order, when the Life card is a real +2000 Counter (OP12-114): the Double
    // Attack hit takes the last Life card without winning, and the Counter stops the Leader.
    const real = position({ chars: [LUFFY_DA], don: 0, life: 1, hand: [], lifeCard: 'OP12-114' });
    expect(
      won(
        playOut(
          real,
          attackLine(real, [
            [LUFFY_DA, 0],
            [LUFFY, 0],
          ]),
          false,
        ),
      ),
    ).toBe(false);
    expect(
      won(
        playOut(
          real,
          attackLine(real, [
            [LUFFY, 0],
            [LUFFY_DA, 0],
          ]),
          false,
        ),
      ),
    ).toBe(true);
  });

  /**
   * BANISH (CR 10-1-3-1): the Life card is trashed, so the hand does not grow. Luffy 5000 and Queen
   * (OP17-065, 10000, [Banish]); 4 DON!!; Rocks at 1 Life with 2 cards (up to +4000). 2 hits.
   * Queen first: 10000 against 5000 + 4000 lands, Life 1 → 0, the card is banished: hand stays 2.
   * The Leader with 4 DON!! is 9000 against 5000 + 4000: tied, wins. The same position with a
   * vanilla 10000 (Moria): after the first hit the hand is 3 (+6000), the Leader's 9000 is short of
   * 11000, and Leader first (9000 against 9000) leaves Moria's 10000 against 11000: refuted.
   */
  it('Banish: the hand does not grow, so the same attacks win', () => {
    const banish = position({ chars: [QUEEN], don: 4, life: 1, hand: [NO_COUNTER, NO_COUNTER] });
    const r = pub(banish);
    expect(r.status).toBe('proven');
    expect(attacks(r).map((a) => [a.card, a.don, a.handSize])).toEqual([
      [QUEEN, 0, 2],
      [LUFFY, 4, 2], // still 2 cards: the Life card was banished, not added to the hand
    ]);
    expect(won(playOut(banish, r.viewActions!))).toBe(true);
    const vanilla = position({ chars: [MORIA], don: 4, life: 1, hand: [NO_COUNTER, NO_COUNTER] });
    expect(pub(vanilla).status).toBe('refuted');
  });

  /**
   * A BLOCKER that must be forced. Rocks at 1 Life, 0 cards, an active [Blocker] (Kaido, OP17-042).
   * 2 hits needed, and the Blocker can stop one attack (then it is rested). With Luffy and Sanji:
   * they block one, the other lands one hit: not enough. With Zoro too, whichever of the three they
   * block the other two land: Luffy 5000 on 0 cards, then the next on 1 card (+2000): Sanji 7000
   * ties it, Zoro 9000 beats it. A rested Blocker cannot block, so with it rested two attackers win.
   */
  it('a Blocker stops one attack: two attackers lose, three win, a rested Blocker is nothing', () => {
    const two = position({ chars: [SANJI], don: 0, life: 1, hand: [], blockers: [KAIDO_BLOCKER] });
    const r2 = pub(two);
    expect(r2.status).toBe('refuted');
    expect(r2.facts.blockers).toEqual([KAIDO_BLOCKER]);
    const three = position({
      chars: [SANJI, ZORO],
      don: 0,
      life: 1,
      hand: [],
      blockers: [KAIDO_BLOCKER],
    });
    const r3 = pub(three);
    expect(r3.status).toBe('proven');
    expect(won(playOut(three, r3.viewActions!))).toBe(true);
    const rested = position({
      chars: [SANJI],
      don: 0,
      life: 1,
      hand: [],
      blockers: [{ card: KAIDO_BLOCKER, rested: true }],
    });
    expect(pub(rested).status).toBe('proven');
    expect(pub(rested).facts.blockers).toEqual([]);
  });

  /**
   * DEPENDS ON A TRIGGER. Kaido (OP17-058) defends at 1 Life with 0 cards. Its sourced lists run
   * [Trigger] cards and a biggest Counter of +4000 (E02). Luffy 5000, Sanji 7000 and Zoro 9000, no
   * DON!!: Leader first (tie; no cards yet, so nothing to Counter or rest), hand 1 (+4000, and the
   * card may rest an unattacked Character), then Zoro 9000 against 5000 + 4000 ties: wins. The proof
   * needs the one Life card it takes not to be a [Trigger]: with T Triggers in a 50-card list the
   * chance is (50 − T) / 50, averaged over the lists by recency weight 3, 2, 1.
   */
  it('depends on a Trigger: proven, labelled, with the chance worked out from the lists', () => {
    const s = position({ chars: [SANJI, ZORO], don: 4, life: 1, hand: [], leader: KAIDO });
    const r = pub(s);
    expect(r.status).toBe('proven');
    // With no DON!! on their field the +4000 cards (DON!! −1) cannot be paid: OP17-076's +3000 is the most.
    expect(r.facts.maxPerCard).toBe(3000);
    expect(r.trigger).not.toBeNull();
    expect(r.trigger!.exposed).toBe(1);
    expect(r.trigger!.triggersInPrior).toBeGreaterThan(0);
    // The chance, from the sourced lists directly.
    const lists = metaLists(KAIDO);
    const weights = lists.map((_, i) => lists.length - i);
    const p =
      lists.reduce((t, l, i) => t + weights[i]! * (1 - triggersIn(l) / 50), 0) /
      weights.reduce((a, b) => a + b, 0);
    expect(r.trigger!.probabilityNone).toBeCloseTo(p, 10);
    expect(r.trigger!.probabilityNone).toBeLessThan(1);
    const t1 = tier1(r);
    expect(t1.triggerNote).toBe(
      `Works against any hand, unless a Life card's Trigger stops it (their usual lists run ${r.trigger!.triggersInPrior}).`,
    );
    // Rocks runs none: nothing to say.
    expect(
      tier1(pub(position({ chars: [SANJI], don: 0, life: 1, hand: [] }))).triggerNote,
    ).toBeNull();
    // In `actual` mode a real Trigger is the engine's: no chance node.
    expect(act(s).trigger).toBeNull();
  });

  /** CAP REACHED: a tiny node cap on a position that needs a real search is `unknown`, never "no lethal". */
  it('cap reached: unknown, not fully checked', () => {
    const s = position({ chars: [SANJI, ZORO], don: 6, life: 2, hand: [NO_COUNTER] });
    const r = pub(s, 5);
    expect(r.status).toBe('unknown');
    expect(r.certainty).toBe('search-incomplete');
    expect(r.line).toBeNull();
    expect(tier1(r).text).toBe("Couldn't finish checking.");
    const e = explainLethal(r, cards, 'coach');
    expect(e.claim).toBe("This turn wasn't fully checked for lethal.");
    expect(e.certainty).toBe('search-incomplete');
    expect(e.outcome).toBe('Unknown: no win proven, none ruled out.');
    expect(certaintyLabel(e.certainty, 'coach')).toBe('Best found, not fully checked');
    // The same position with room finishes.
    expect(pub(s).status).toBe('proven');
  });
});

/** The sourced lists of a leader, newest first, as card-id counts. */
function metaLists(leader: string): { id: string; count: number }[][] {
  const file = JSON.parse(
    readFileSync(new URL('../../docs/research/meta-lists.json', import.meta.url), 'utf8'),
  ) as {
    archetypes: {
      leaderId: string;
      lists: { date: string; main: { id: string; count: number }[] }[];
    }[];
  };
  const a = file.archetypes.find((x) => x.leaderId === leader)!;
  return [...a.lists].sort((x, y) => (x.date < y.date ? 1 : -1)).map((l) => l.main);
}
const triggersIn = (list: { id: string; count: number }[]): number =>
  list.reduce((t, c) => t + (cards.get(c.id)?.triggerText ? c.count : 0), 0);

describe('E20: the live lethal detector, three tiers (explanations.md)', () => {
  /**
   * Game turn 11, going first: 10 DON!! active. Kaido (OP17-058) Leader 5000, Ulti & Page One
   * (OP17-060) 6000, Kaido (OP17-062) 12000; Rocks Leader 5000 at 2 Life with 1 card, and a rested
   * Newgate (OP17-040: once per turn, trash a card for +3000). Hand: 1, 2, 3 cards at the three
   * attacks. The most they can add: 3000 (the card to Newgate), 3000 + 2000, 3000 + 2000 + 2000. The attacks
   * need 5000 + that: 8000, 10000, 12000. Ulti 6000 + 2 DON!! = 8000, the Leader 5000 + 5 = 10000,
   * Kaido 12000 with none: 7 DON!!, the fewest (Kaido takes the last slot with no DON!!; the other
   * two pairings cost the same, and Ulti goes first as its attack is the smaller).
   */
  const e20 = (): GameState =>
    start({
      seed: 3,
      turn: 11,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: KAIDO,
        characters: ['OP17-060', 'OP17-062'],
        life: lifeOf(3, NO_COUNTER),
        hand: [],
        costArea: { active: 10, rested: 0 },
        decklist: listOf(KAIDO),
      },
      p2: {
        leader: ROCKS,
        characters: [{ card: 'OP17-040', rested: true }],
        life: lifeOf(2, NO_COUNTER),
        hand: ['OP17-055'],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    });

  it('tier 3 equals the example, word for word, and every figure is recomputed from the position', () => {
    const s = e20();
    const r = pub(s);
    expect(r.status).toBe('proven');
    expect(r.oblivious).toBe(true);
    const e = explainLethal(r, cards, 'coach');
    expect(e).toEqual(docExample('E20'));
    expect(certaintyLabel(e.certainty, 'coach')).toBe('Works against any hand');
    // Figures from the position and the rules, worked here (not from the search).
    const f = Object.assign({}, ...e.evidence.map((x) => x.figures ?? {})) as Record<
      string,
      number
    >;
    const life = queries.zone(s, 'p2', 'life').length;
    expect(f.opponentLife).toBe(life);
    expect(f.hitsNeeded).toBe(life + 1);
    expect(f.attackers).toBe(3);
    expect(f.handSize).toBe(queries.zone(s, 'p2', 'hand').length);
    expect(f.ultiPower).toBe(6000 + 2 * 1000);
    expect(f.stopUlti).toBe(f.ultiPower! - 5000 + 1000);
    expect(f.leaderPower).toBe(5000 + 5 * 1000);
    expect(f.stopLeader).toBe(f.leaderPower! - 5000 + 1000);
    expect(f.kaidoPower).toBe(12000);
    expect(f.stopKaido).toBe(12000 - 5000 + 1000);
    expect([f.cardsAtFirst, f.cardsAtSecond, f.cardsAtThird]).toEqual([1, 2, 3]);
    expect([f.maxAtFirst, f.maxAtSecond, f.maxAtThird]).toEqual([3000, 5000, 7000]);
    expect(
      f.maxAtFirst! < f.stopUlti! && f.maxAtSecond! < f.stopLeader! && f.maxAtThird! < f.stopKaido!,
    ).toBe(true);
    // The line replayed through the engine against the strongest defence wins.
    expect(won(playOut(s, r.viewActions!))).toBe(true);
    // Tiers 1 and 2.
    expect(tier1(r).text).toBe('Lethal is on the board.');
    expect(tier2(r).text).toBe('You need 3 hits. You have 3 attackers that can hit their Leader.');
  });

  it('the guided count carries what its four questions check', () => {
    const r = pub(e20());
    const g = guidedCount(r)!;
    expect(g.hits).toEqual({ opponentLife: 2, hitsNeeded: 3, doubleAttack: false });
    expect(g.attackers.map((a) => a.card).sort()).toEqual([KAIDO, 'OP17-060', 'OP17-062'].sort());
    expect(g.defence).toMatchObject({
      blockers: 0,
      handSize: 1,
      maxPerCard: 2000,
      cardsAtEachAttack: [1, 2, 3],
    });
    expect(g.defence.effects).toEqual([
      { card: 'OP17-040', kind: 'boost', amount: 3000, costsCard: true, oncePerTurn: true },
    ]);
    expect(g.split.map((x) => [x.card, x.don, x.need, x.maxDefence])).toEqual([
      ['OP17-060', 2, 4000, 3000],
      [KAIDO, 5, 6000, 5000],
      ['OP17-062', 0, 8000, 7000],
    ]);
    expect([g.donUsed, g.donSpare]).toEqual([7, 3]);
    const refs = Object.fromEntries(g.split.map((x) => [x.card, x.ref]));
    const right = {
      hits: 3,
      attackers: g.attackers.map((a) => a.ref),
      split: [
        { ref: refs['OP17-060']!, don: 2 },
        { ref: refs[KAIDO]!, don: 5 },
        { ref: refs['OP17-062']!, don: 0 },
      ],
    };
    const ok = checkGuidedCount(g, right);
    expect([ok.hits.correct, ok.attackers.correct, ok.split.correct]).toEqual([true, true, true]);
    // A split that also works (the Leader first with 3, Ulti 4): accepted, it is not "the" line.
    const alt = checkGuidedCount(g, {
      ...right,
      split: [
        { ref: refs[KAIDO]!, don: 3 },
        { ref: refs['OP17-060']!, don: 4 },
        { ref: refs['OP17-062']!, don: 0 },
      ],
    });
    expect(alt.split.correct).toBe(true);
    // Wrong answers say why.
    const wrong = checkGuidedCount(g, {
      hits: 2,
      attackers: [refs[KAIDO]!],
      split: [
        { ref: refs['OP17-062']!, don: 10 },
        { ref: refs['OP17-060']!, don: 0 },
        { ref: refs[KAIDO]!, don: 0 },
      ],
    });
    expect(wrong.hits).toEqual({
      correct: false,
      reason: 'They have 2 Life, so you need 2 + 1 = 3 hits.',
    });
    expect(wrong.attackers.correct).toBe(false);
    expect(wrong.attackers.reason).toBe('2 attackers missing.');
    expect(wrong.split.correct).toBe(false);
  });
});

describe('too few attackers, and the copy rules', () => {
  /**
   * Luffy alone against 2 Life: 3 hits needed, 1 attacker. Each attack lands one hit (CR
   * 7-1-4-1-1-1), so nothing can be done with DON!!, whatever their hand: certainty any-hand, and the
   * answer is immediate (no search nodes).
   */
  it('refutes without a search, whatever their hand', () => {
    const s = position({ chars: [], don: 10, life: 2, hand: [NO_COUNTER, NO_COUNTER, NO_COUNTER] });
    for (const r of [pub(s), act(s)]) {
      expect(r.status).toBe('refuted');
      expect(r.nodes).toBe(0);
      expect(r.defence).toMatchObject({ reason: 'attackers', hitsNeeded: 3 });
      expect(tier1(r).text).toBe('No lethal: you need 3 hits and have 1 attacker.');
    }
    expect(pub(s).certainty).toBe('any-hand');
    expect(explainLethal(pub(s), cards, 'coach').outcome).toBe(
      'No win this turn: not enough attackers.',
    );
    // A Double Attack Character can make 2 attackers enough for 2 Life (it takes 2): the bound lets the search run.
    const da = position({ chars: [LUFFY_DA], don: 0, life: 2, hand: [] });
    expect(pub(da).defence?.reason).not.toBe('attackers');
  });

  const SLUGS = ['lethal-math', 'hand-reading'];
  const names = [...new Set([...cards.values()].map((c) => c.name))]
    .filter((n) => n.includes(' '))
    .sort((a, b) => b.length - a.length);
  const words = (t: string): number => {
    let x = t;
    for (const n of names) if (x.includes(n)) x = x.split(n).join('Name');
    return x.split(/\s+/).filter(Boolean).length;
  };
  /** explanations.md "Copy rules", as the existing snapshot tests enforce them. */
  function wellFormed(e: ReturnType<typeof explainLethal>): void {
    expect(SLUGS).toContain(e.conceptId);
    expect(words(e.claim), e.claim).toBeLessThanOrEqual(12);
    expect(e.claim).not.toMatch(/!$/);
    for (const ev of e.evidence) expect(words(ev.text), ev.text).toBeLessThanOrEqual(30);
    expect(e.nextTime.length).toBeGreaterThan(0);
    expect(e.sources.length).toBeGreaterThan(0);
    expect(e.lessonId).toMatch(/^L1[56]-/);
    const text = [
      e.claim,
      e.outcome,
      ...e.evidence.map((x) => x.text),
      ...(e.line ?? []).map((m) => m.text),
    ].join(' ');
    expect(text).not.toMatch(/(^|[\s(])-\d/);
    expect(text).not.toMatch(/\d\s+-\s+\d/);
    expect(text).not.toMatch(/DON!(?!!)/);
    expect(text).not.toMatch(/you should have/i);
    expect(text).not.toMatch(/\b1 (cards|hits|attackers|Life cards|Triggers|active Blockers)\b/);
    // Every figure named in the evidence is a finite number.
    for (const ev of e.evidence)
      for (const [k, v] of Object.entries(ev.figures ?? {}))
        expect(Number.isFinite(v), k).toBe(true);
  }

  it('every explanation the detector writes follows them', () => {
    const made: ReturnType<typeof explainLethal>[] = [];
    const add = (r: LethalResult, ctx: 'coach' | 'review', p?: LethalResult) =>
      made.push(explainLethal(r, cards, ctx, p));
    const proven = position({ chars: [SANJI, ZORO], don: 0, life: 2, hand: [] });
    const refuted = position({ chars: [SANJI], don: 3, life: 1, hand: [NO_COUNTER, NO_COUNTER] });
    const trig = position({ chars: [SANJI, ZORO], don: 4, life: 1, hand: [], leader: KAIDO });
    const few = position({ chars: [], don: 0, life: 2, hand: [] });
    for (const s of [proven, refuted, trig, few]) {
      for (const ctx of ['coach', 'review'] as const) {
        add(pub(s), ctx);
        add(act(s), ctx, pub(s));
      }
      add(pub(s, 3), 'coach');
    }
    expect(made.length).toBe(20);
    for (const e of made) wellFormed(e);
    // The Trigger chance reads in plain numbers.
    const t = explainLethal(pub(trig), cards, 'review').evidence.find((x) =>
      x.text.includes('Trigger'),
    )!;
    expect(t.figures).toMatchObject({ exposedLife: 1 });
  });
});

describe('A1 is sound against every [Counter] effect in the prior', () => {
  /**
   * Kaido (OP17-058) defends at 2 Life, no hand. Luffy 5000, Sanji 7000, Zoro 9000, 6 DON!!.
   * 3 hits needed. The superseded A1 (a hidden card is only +4000, Kaido's biggest Counter): the
   * Leader first (no cards, 5000 hits; Life 2 → 1, hand 1), Zoro second (9000 against 5000 + 4000
   * ties and hits; Life 0, hand 2), Sanji third with 6 DON!! (13000 against 5000 + 8000 ties and
   * wins): "proven, any hand". But Kaido's lists run OP07-076 (+2000, then rest up to 1 of your
   * opponent's Characters; cost DON!! −1). As the Life card from the first hit it is in their hand on
   * the second attack, and playing it rests the Character that has not attacked yet; a rested
   * Character cannot attack. Two hits land and the third attacker is gone. (The Leader is no
   * Character, so it could attack last, but then it faces the cards from two hits: 13000 is not
   * reachable.) So the corrected `public` model must not prove it.
   */
  it('a Counter that rests an attacker refutes a line the +power-only model proves', () => {
    const s = start({
      seed: 11,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [SANJI, ZORO],
        life: lifeOf(4, NO_COUNTER),
        hand: [],
        costArea: { active: 6, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: KAIDO,
        life: lifeOf(2, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(KAIDO),
      },
    });
    const view = projectForSearch(s, 'p1');
    const old = lethal({ mode: 'public', view, model: 'power-only' }, cards, { nodes: 300_000 });
    expect(old.status).toBe('proven'); // what the first A1 claimed
    const r = lethal({ mode: 'public', view }, cards, { nodes: 200_000 });
    expect(r.status).toBe('refuted');
    expect(r.defence?.lifeTaken).toBeLessThan(r.defence?.hitsNeeded ?? 0);
    expect(r.facts.defenceExtras).toEqual({ rests: true, draws: true });
  });

  /**
   * Every [Counter] ability in the cards of every slice prior (Rocks, Kaido) uses only effects the
   * placeholder models: +power, rest an opponent Character, draw. A future card with another effect
   * fails here instead of silently making `public` unsound (profile.ts `gaps`).
   */
  it('covers every [Counter] ability in the slice priors', () => {
    for (const leader of [ROCKS, KAIDO]) {
      const profile = counterProfile(priorCardIds(leader), cards);
      expect(profile.gaps, leader).toEqual([]);
    }
    // And the model is not empty: Kaido's lists rest and draw, Rocks's only add power.
    const k = counterProfile(priorCardIds(KAIDO), cards);
    expect([k.rests, k.draws]).toEqual([true, true]);
    const r = counterProfile(priorCardIds(ROCKS), cards);
    expect([r.rests, r.draws]).toEqual([false, false]);
    // A card the model does not know downgrades the claim rather than hiding it.
    expect(counterProfile(['OP13-001'], cards).gaps).toEqual([]);
  });
});

describe('L fix round: the attackers bound, hand costs that name a type, certainty with gaps', () => {
  /**
   * L-01. Kaido (OP17-058) Leader and EB04-030 Kaido in hand ("[On Play] DON!! −2: … this Character
   * gains Rush during this turn", printed without brackets), 10 active DON!!; Rocks at 1 Life with
   * nothing: no hand, no DON!!, no Blockers. 2 hits needed. The Leader attacks first (5000 against
   * 5000 ties and hits; Life 1 → 0, hand 1: one card, +2000), then EB04-030 (played, Rush, 9000)
   * against 5000 + 2000: a hit at 0 Life wins. The old bound counted a hand Character only if its
   * text had "[Rush", saw 1 attacker, and said "No lethal" at any-hand.
   */
  const rush = () =>
    start({
      seed: 4,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: KAIDO,
        hand: ['EB04-030'],
        life: lifeOf(3, NO_COUNTER),
        costArea: { active: 10, rested: 0 },
        decklist: listOf(KAIDO),
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(1, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    });

  it('a Character that gains Rush is a possible attacker: proven, not "too few attackers"', () => {
    const s = rush();
    expect(attackersPossible(s, 'p1', cards)).toBe(true);
    for (const r of [pub(s), act(s)]) {
      expect(r.status).toBe('proven');
      expect(r.defence).toBeNull();
    }
    expect(pub(s).certainty).toBe('any-hand');
    expect(pub(s).actions!.some((a) => a.type === 'playCard')).toBe(true);
    // The line is a real win: play it (view actions) against the strongest defence.
    expect(won(playOut(s, pub(s).viewActions!))).toBe(true);
  });

  it('review flags that turn as a missed lethal, any-hand, when the seat ended the turn', () => {
    const spec = {
      seed: 4,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: KAIDO,
        hand: ['EB04-030'],
        life: lifeOf(3, NO_COUNTER),
        costArea: { active: 10, rested: 0 },
        decklist: listOf(KAIDO),
      },
      p2: {
        leader: ROCKS,
        life: lifeOf(1, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    } as const;
    const init = createFromScenario({
      ...(spec as unknown as Omit<ScenarioSpec, 'cards'>),
      cards: lookup,
    });
    let rec = startRecord({ scenario: spec as never }, init.state);
    const a: Action = { type: 'endTurn', player: 'p1' };
    const s1 = reduce(init.state, a).state;
    rec = appendAction(rec, a, s1);
    // a later action, so the turn is not the record's end
    const next = legalActions(s1).find((x) => x.type !== 'concede')!;
    rec = appendAction(rec, next, reduce(s1, next).state);
    const flags = reviewMissedLethal(rec, lookup, cards, { seats: ['p1'] });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ kind: 'missed-lethal', severity: 'severe' });
    expect(flags[0]!.explanation.certainty).toBe('any-hand');
  });

  /**
   * The bound is conservative: a card that untaps, plays or grants Rush anywhere in the seat's reach
   * turns it off, so it can only err toward searching. And a text regex decides nothing.
   */
  it('the bound is off when a script can add an attacker, and decided from keywords and scripts', () => {
    // No such card: Luffy alone against 2 Life still has too few attackers.
    const none = position({ chars: [], don: 10, life: 2, hand: [NO_COUNTER] });
    expect(attackersPossible(none, 'p1', cards)).toBe(false);
    expect(attackersPossible(rush(), 'p1', cards)).toBe(true);
  });

  /**
   * L-02. Rocks's Shiki (OP17-048) on the board: "[When Attacking]/[On Your Opponent's Attack] [Once
   * Per Turn] trash 1 card with a type including Rocks Pirates from your hand: give up to 1 of your
   * opponent's Characters −3000". A hidden hand card must be able to pay it. Defender: Rocks, Shiki
   * on the board, 1 Life, 1 card in hand. Sanji 7000 attacks first, then Luffy with 4 DON!! (9000).
   * Hand-worked against a real Rocks Pirates card: Shiki trashes it, Sanji is 4000 against 5000 and
   * is stopped; the Leader's hit then takes the last Life and no attacker is left. The old model never
   * let Shiki fire and proved this "any hand". The placeholder now carries every type in the prior.
   */
  it('a hidden card pays Shiki: the old "proof" no longer stands', () => {
    const s = start({
      seed: 6,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [SANJI],
        life: lifeOf(4, NO_COUNTER),
        hand: [],
        costArea: { active: 4, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        characters: ['OP17-048'],
        life: lifeOf(1, NO_COUNTER),
        hand: ['OP17-052'],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    });
    const r = pub(s);
    expect(r.status).toBe('refuted');
    // The superseded model (a placeholder with no types) never let Shiki fire, and proved it.
    const old = lethal(
      { mode: 'public', view: projectForSearch(s, 'p1'), model: 'power-only' },
      cards,
      CAP,
    );
    expect(old.status).toBe('proven');
  });

  /** L-10 M2: a model gap means no `any-hand`, whatever the proof (a card whose Counter does something else). */
  it('a proof with a model gap is not any-hand', () => {
    // A defender whose board has an ability that spends a named card from hand: the placeholder
    // cannot be one (OP17-061 chooses by name), so the claim must drop.
    const s = start({
      seed: 6,
      turn: 9,
      activePlayer: 'p1',
      firstPlayer: 'p1',
      p1: {
        leader: LUFFY,
        characters: [SANJI],
        life: lifeOf(4, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
      p2: {
        leader: ROCKS,
        characters: [{ card: 'OP17-061', rested: true }],
        life: lifeOf(1, NO_COUNTER),
        hand: [],
        costArea: { active: 0, rested: 0 },
        decklist: listOf(ROCKS),
      },
    });
    const r = pub(s);
    expect(r.facts.modelGaps.length).toBeGreaterThan(0);
    expect(r.status).toBe('proven');
    expect(r.certainty).toBe('needed-hidden-info');
    expect(tier1(r).chip).toBe('Depends on their hand');
  });
});

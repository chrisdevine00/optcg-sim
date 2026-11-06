/**
 * `lethal` (ARCHITECTURE §4.1, §4.4): can this seat win this turn, and against what?
 *
 * - `public`: from the requesting seat's `SearchView` only. The defender's hidden hand and Life are
 *   the worst case from the archetype prior (`public.ts`). A proof holds against any hand the
 *   deck could have held, except a [Trigger] chance reported in `trigger`.
 * - `actual`: from the full state (review, open-hands games). The real hand, real Life, real
 *   Triggers; the defender's every legal answer is searched.
 *
 * One pass per DON!! budget, smallest first: the first budget that proves lethal gives the tidy
 * line (the fewest DON!! given, smaller attacks first, `search.ts`); a full-budget pass that finds
 * no win refutes. Either may stop at the cap: `unknown`, never "no lethal".
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  queries,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
} from '@optcg/engine';
import { counterValueOf, priorFor } from '../../knowledge.ts';
import { defenceEffectsOf, type DefenceEffect } from './defence.ts';
import { analyseLine, type LineStep } from './analyse.ts';
import { attackReach, refutedByBound } from './bound.ts';
import { publicState, triggerRisk, type TriggerRisk } from './public.ts';
import { search, searchGreedy, searchPlan, type Cap } from './search.ts';

export type LethalMode = 'public' | 'actual';

/** A full game state, for `actual` mode only (review and open-hands games; never a live hidden game). */
export type LethalState = GameState;

export type LethalInput =
  | {
      mode: 'public';
      view: SearchView;
      /** `power-only` is the superseded A1 (a hidden card is only +power): kept so a test can show what it got wrong. */
      model?: 'full' | 'power-only';
      /**
       * The search-free bound (`bound.ts`). `off` turns it off (the soundness harness compares it with
       * the search); `overstated` makes it believe a plain Counter is worth twice what it is, to show a
       * test catches a broken bound. `off` also skips the reduced-defender pass.
       */
      bound?: 'on' | 'off' | 'overstated';
    }
  | { mode: 'actual'; state: GameState; attacker?: PlayerId };

/** An attacker the player can use against the opponent's Leader this turn. */
export interface AttackerFact {
  ref: string;
  card: string;
  power: number;
  /** [Double Attack] (CR 10-1-2): two Life cards for one hit. */
  doubleAttack: boolean;
}

/** Tier 2, and the answers the guided count checks (learning-ui §3.2). */
export interface LethalFacts {
  /** Life cards the defender has: question 1's count is `opponentLife + 1`. */
  opponentLife: number;
  hitsNeeded: number;
  /** Question 2: who can attack their Leader this turn. */
  attackers: AttackerFact[];
  /** Question 3: what they can stop with. */
  handSize: number;
  /** The biggest defence one hidden card can give (the prior's biggest Counter). */
  maxPerCard: number;
  /** Active Blockers they have (card ids, CR 7-1-2-1). */
  blockers: string[];
  /** Their visible on-attack effects, by card id. */
  defenderCards: string[];
  /** Active DON!! the attacker has to give. */
  activeDon: number;
  /** No sourced list for their Leader: `maxPerCard` is the assumed fallback. */
  noPrior: boolean;
  /** Public mode: their Counter cards may also rest one of your Characters, or draw. */
  defenceExtras: { rests: boolean; draws: boolean };
  /** Public mode: Counter effects the model could not represent. */
  modelGaps: string[];
  /** Their visible on-attack effects (public card scripts). */
  defence: DefenceEffect[];
  /** `actual` mode: the Counter value their real hand holds (printed Counters and [Counter] Events); else null. */
  actualCounter: number | null;
}

export interface LethalResult {
  status: 'proven' | 'refuted' | 'unknown';
  mode: LethalMode;
  /** Review certainty (explanations.md): proven in `public` = any-hand; in `actual` = hindsight. */
  certainty: 'any-hand' | 'needed-hidden-info' | 'search-incomplete';
  /** Proven: the line, step by step. Otherwise null. */
  line: LineStep[] | null;
  /** Proven: the attacker's engine actions, replayable with `reduce` from the root state. */
  actions: Action[] | null;
  /** The same moves with ids as the requesting view names them (`public`: handles), for `actionFromView`. A card that did not exist in the view (just played) keeps its search id. */
  viewActions: Action[] | null;
  /** Proven: the same moves work against every answer (no adapting between attacks). */
  oblivious: boolean;
  /** Refuted: the best attempt, and what stopped it. */
  defence: {
    lifeTaken: number;
    hitsNeeded: number;
    line: LineStep[];
    stoppedAt: number;
    /** `attackers`: too few attackers could ever hit their Leader (no search was needed). */
    reason?: 'attackers' | 'bound' | 'reduced';
    /** Public mode: a card the seat holds draws or searches, and the draw is not counted (A3). */
    drawsIgnored?: boolean;
  } | null;
  /** Public mode, proven: the chance a hidden Life [Trigger] stops it (null when none can). */
  trigger: TriggerRisk | null;
  facts: LethalFacts;
  nodes: number;
  /** Why no search ran, if so. */
  reason?: string;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

function factsOf(
  s: GameState,
  attacker: PlayerId,
  maxPerCard: number,
  noPrior: boolean,
  refOf: (id: string) => string,
  cards: ReadonlyMap<string, Card>,
  actual: boolean,
): LethalFacts {
  const def = other(attacker);
  const life = queries.zone(s, def, 'life').length;
  const oppLeader = queries.zone(s, def, 'leader')[0]!.instance;
  const seen = new Set<string>();
  const attackers: AttackerFact[] = [];
  for (const a of legalActions(s))
    if (a.type === 'attack' && a.target === oppLeader && !seen.has(a.attacker)) {
      seen.add(a.attacker);
      const c = queries.card(s, a.attacker);
      attackers.push({
        ref: refOf(a.attacker),
        card: c.card,
        power: c.power ?? 0,
        doubleAttack: c.keywords.includes('Double Attack'),
      });
    }
  const blockers = queries
    .zone(s, def, 'characters')
    .filter((c) => !c.rested && c.keywords.includes('Blocker'))
    .map((c) => c.card);
  const defenderCards = [
    ...queries.zone(s, def, 'leader'),
    ...queries.zone(s, def, 'characters'),
    ...queries.zone(s, def, 'stage'),
  ].map((c) => c.card);
  return {
    opponentLife: life,
    hitsNeeded: life + 1,
    attackers,
    handSize: queries.zone(s, def, 'hand').length,
    maxPerCard,
    blockers,
    defenderCards,
    activeDon: queries.don(s, attacker).active,
    noPrior,
    defenceExtras: { rests: false, draws: false },
    modelGaps: [],
    defence: defenderCards.flatMap(defenceEffectsOf),
    actualCounter: actual
      ? queries.zone(s, def, 'hand').reduce((t, c) => t + counterValueOf(cards.get(c.card)), 0)
      : null,
  };
}

/**
 * Can this seat get enough attackers on their Leader to win at all? Its attackers now, plus every
 * Character in its hand with printed [Rush], plus the attacks its scripts can add (untap, play, grant
 * [Rush]; `reachOf`), against the Life it must remove: each attack takes one Life card, or two with
 * [Double Attack], and the last attack lands at 0 (CR 7-1-4-1-1-1, 10-1-2-1).
 *
 * Decided from keywords and scripts, never from text, and conservative: every card the seat can reach
 * (hand, Leader, Characters, Stage) adds the most its script could, so it can only err toward searching.
 */
export function attackersPossible(
  s: GameState,
  attacker: PlayerId,
  cards: ReadonlyMap<string, Card>,
  /** The seat's deck is known (a full state); `public` passes false: a draw finds a blank there (A3). */
  deckKnown = true,
): boolean {
  const life = queries.zone(s, other(attacker), 'life').length;
  const { n, da } = attackReach(s, attacker, cards, deckKnown);
  return n >= 1 && (n - 1) * (da ? 2 : 1) >= life;
}

/** `a` with every card id passed through `f` (view handles for `actionFromView`). */
function mapIds(a: Action, f: (id: string) => string): Action {
  const o = { ...a } as Record<string, unknown>;
  for (const k of ['target', 'attacker', 'card', 'blocker'])
    if (typeof o[k] === 'string') o[k] = f(o[k]);
  const ch = o.choice;
  if (typeof ch === 'string') o.choice = f(ch);
  else if (ch && typeof ch === 'object' && 'card' in ch)
    o.choice = { ...ch, card: f((ch as { card: string }).card) };
  return o as Action;
}

function remaining(cap: Cap, used: number, t0: number): Cap {
  return {
    ...(cap.nodes !== undefined ? { nodes: Math.max(1, cap.nodes - used) } : {}),
    ...(cap.ms !== undefined ? { ms: Math.max(1, cap.ms - (performance.now() - t0)) } : {}),
    ...(cap.deckKnown ? { deckKnown: true } : {}),
  };
}

function run(
  root: GameState,
  attacker: PlayerId,
  mode: LethalMode,
  cap: Cap,
  cards: ReadonlyMap<string, Card>,
  refOf: (id: string) => string,
  extra: {
    maxPerCard: number;
    noPrior: boolean;
    rests: boolean;
    draws: boolean;
    /** Counter effects the model does not know: a proof cannot claim any-hand. */
    gaps: string[];
    hiddenLife: number;
    prior: ReturnType<typeof priorFor>;
    /** Public mode: what the search-free refutation may assume (`bound.ts`); null: no bound. */
    bound: { hand: number; plain: number } | null;
    /**
     * Public mode: the same position against the reduced defender (every hidden card only its plain
     * +power mode). A refutation there is a refutation against the real one (it has more answers);
     * a proof there says nothing. null: not tried.
     */
    reducedRoot: GameState | null;
  },
): LethalResult {
  const facts: LethalFacts = factsOf(
    root,
    attacker,
    extra.maxPerCard,
    extra.noPrior,
    refOf,
    cards,
    mode === 'actual',
  );
  facts.defenceExtras = { rests: extra.rests, draws: extra.draws };
  facts.modelGaps = extra.gaps;
  const base = {
    mode,
    facts,
    line: null,
    actions: null,
    viewActions: null,
    oblivious: false,
    defence: null,
    trigger: null,
    nodes: 0,
  } as const;
  const dec = queries.decision(root);
  if (queries.result(root) || !dec || dec.kind !== 'main' || dec.player !== attacker)
    return {
      ...base,
      status: 'unknown',
      certainty: 'search-incomplete',
      reason: 'It is not that seat’s Main Phase decision.',
    };
  // In `public` a draw finds a blank (A3): when a card the seat holds draws or searches, a refutation
  // by count is "from what you hold", not "against any hand" (L-12).
  const drawsIgnored = mode === 'public' && attackReach(root, attacker, cards, false).drawsIgnored;
  // Too few attackers: no search can find lethal, and the answer is immediate (CR 7-1-4-1-1-1).
  if (!attackersPossible(root, attacker, cards, mode === 'actual'))
    return {
      ...base,
      status: 'refuted',
      certainty: drawsIgnored ? 'needed-hidden-info' : 'any-hand',
      defence: {
        lifeTaken: 0,
        hitsNeeded: facts.hitsNeeded,
        line: [],
        stoppedAt: 0,
        reason: 'attackers',
        ...(drawsIgnored ? { drawsIgnored } : {}),
      },
    };
  // Too many cards in their hand for any DON!! split to beat: refuted without a search (`bound.ts`).
  if (extra.bound && refutedByBound(root, attacker, cards, extra.bound))
    return {
      ...base,
      status: 'refuted',
      certainty: 'needed-hidden-info',
      defence: {
        lifeTaken: 0,
        hitsNeeded: facts.hitsNeeded,
        line: [],
        stoppedAt: 0,
        reason: 'bound',
        ...(drawsIgnored ? { drawsIgnored } : {}),
      },
    };
  const t0 = performance.now();
  let nodes = 0;
  const refutedFrom = (
    attempt: NonNullable<ReturnType<typeof search>['bestAttempt']>,
    reason?: 'reduced',
  ): LethalResult => {
    const mine = attempt.trace.filter((a) => a.player === attacker);
    const an = analyseLine(root, attacker, mine, refOf, cards);
    return {
      ...base,
      status: 'refuted',
      certainty: 'needed-hidden-info',
      defence: {
        lifeTaken: attempt.lifeTaken,
        hitsNeeded: facts.hitsNeeded,
        line: an.steps,
        stoppedAt: Math.min(
          an.steps.filter((s) => s.kind === 'attack').length,
          attempt.lifeTaken + 1,
        ),
        ...(reason ? { reason } : {}),
        ...(drawsIgnored ? { drawsIgnored } : {}),
      },
      nodes,
    };
  };
  // `actual` mode knows the seat's real deck: draws and searches are searched, not idle (L-12).
  if (mode === 'actual') cap = { ...cap, deckKnown: true };
  const trigger =
    mode === 'public' && extra.hiddenLife > 0
      ? triggerRisk(extra.hiddenLife, extra.prior, cards)
      : null;
  const proven = (mine: Action[], oblivious: boolean): LethalResult => ({
    ...base,
    status: 'proven',
    certainty: mode === 'public' && extra.gaps.length === 0 ? 'any-hand' : 'needed-hidden-info',
    line: analyseLine(root, attacker, mine, refOf, cards).steps,
    actions: mine,
    viewActions: mine.map((a) => mapIds(a, refOf)),
    oblivious,
    trigger,
    nodes,
  });
  // 0. The reduced defender (public only): a refutation here holds against the real one. A proof or
  //    a cap hit here is thrown away, so it comes after a short try at the cheap path (a position
  //    that is provable is usually found there at once) and gets a share of the cap.
  if (extra.reducedRoot) {
    const share = (f: number): Cap => ({
      ...(cap.nodes !== undefined ? { nodes: Math.max(1, Math.floor(cap.nodes * f)) } : {}),
      ...(cap.ms !== undefined ? { ms: Math.max(1, cap.ms * f) } : {}),
    });
    const g0 = searchGreedy(root, attacker, share(0.1));
    nodes += g0.nodes;
    if (g0.status === 'proven') return proven(g0.actions, true);
    const r0 = search(extra.reducedRoot, attacker, share(0.85));
    nodes += r0.nodes;
    if (r0.status === 'refuted') return refutedFrom(r0.bestAttempt!, 'reduced');
  }
  // 1. The cheap path: a plan in which every attack lands, the fewest DON!! first (what a person
  //    can follow without adapting).
  const g = searchGreedy(root, attacker, remaining(cap, nodes, t0));
  nodes += g.nodes;
  if (g.status === 'unknown')
    return { ...base, status: 'unknown', certainty: 'search-incomplete', nodes };
  if (g.status === 'proven') return proven(g.actions, true);
  // 2. Adapting to the defender's answers: decides proven (with a line that depends on them),
  //    refuted, or unknown.
  const out = search(root, attacker, remaining(cap, nodes, t0));
  nodes += out.nodes;
  if (out.status === 'unknown')
    return { ...base, status: 'unknown', certainty: 'search-incomplete', nodes };
  if (out.status === 'proven') {
    // 3. A proof that adapts: look for a fixed plan with a bait attack too, with what is left.
    const rest = remaining(cap, nodes, t0);
    const p = searchPlan(root, attacker, {
      ...(rest.nodes !== undefined ? { nodes: Math.min(rest.nodes, 40_000) } : {}),
      ...(rest.ms !== undefined ? { ms: rest.ms } : {}),
      ...(rest.deckKnown ? { deckKnown: true } : {}),
    });
    nodes += p.nodes;
    if (p.status === 'proven') return proven(p.actions, true);
    return proven(
      out.trace.filter((a) => a.player === attacker),
      false,
    );
  }
  return refutedFrom(out.bestAttempt!);
}

/** `lethal({ view, mode, capMs })` of ARCHITECTURE §4.1; `cap` carries a node and a millisecond cap. */
export function lethal(
  input: LethalInput,
  cards: ReadonlyMap<string, Card>,
  cap: Cap,
): LethalResult {
  if (input.mode === 'public') {
    const view = input.view;
    const me = view.player;
    const model = input.model ?? 'full';
    const pub = publicState(view, cards, model);
    const reduced =
      model === 'full' && input.bound !== 'off' ? publicState(view, cards, 'power-only') : null;
    const handles = view.skeleton.handles;
    const leader = view.zones[other(me)].leader[0]?.card ?? '';
    return run(pub.state, me, 'public', cap, cards, (id) => handles[id] ?? id, {
      maxPerCard: pub.maxPerCard,
      noPrior: pub.noPrior,
      rests: pub.rests,
      draws: pub.draws,
      gaps: pub.gaps,
      hiddenLife: pub.hiddenLife,
      prior: leader ? priorFor(leader) : null,
      reducedRoot: reduced ? reduced.state : null,
      bound:
        input.bound === 'off'
          ? null
          : {
              hand: pub.hiddenHand,
              plain: input.bound === 'overstated' ? pub.plain * 2 : pub.plain,
            },
    });
  }
  const state = input.state;
  const attacker = input.attacker ?? queries.turn(state).activePlayer;
  return run(state, attacker, 'actual', cap, cards, (id) => id, {
    maxPerCard: 0,
    noPrior: false,
    rests: false,
    draws: false,
    gaps: [],
    hiddenLife: 0,
    prior: null,
    bound: null,
    reducedRoot: null,
  });
}

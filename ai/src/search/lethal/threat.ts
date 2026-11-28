/**
 * The opponent's-turn threat check (M7 WP3, learning-ui §3.1 "Both players"): once the opponent is
 * in their Main Phase, does their board threaten lethal against you?
 *
 * Read from the asking seat's own `SearchView` (the engine keeps a foreign Main decision searchable,
 * `determinize.ts`). What is searched and what is not:
 *
 * - **Their hidden hand is not counted.** The attacker's hand is filled with blank cards and the
 *   search is told not to play from it (`Cap.attackerHand`), so a "threat" is what their board and
 *   DON!! alone can do. Their hand can only add to it; the copy says so.
 * - **Your hand and Blockers are your defence, as they really are.** They are in your view.
 * - **Your face-down Life is blank** in the search (nothing hidden is guessed); a [Trigger] among it
 *   is a chance stated outside the search, from your own deck list when it is given.
 *
 * Two searches. The first asks what the board threatens against a defender that takes every hit
 * (`Cap.defence: 'none'`): that is `status`. When it threatens, the second searches your real
 * defence: whether your hand and Blockers, as they are, stop it (`holds`). "You must stop 2 of
 * their 3 attacks" is the count of attacks that must fail, from the attackers and your Life.
 */
import type { Card } from '@optcg/cards';
import {
  determinize,
  queries,
  legalActions,
  type Action,
  type GameState,
  type PlayerId,
  type SearchView,
} from '@optcg/engine';
import type { Evidence, Explanation, Move } from '../../explanation.ts';
import type { AiRequest, AiResponse } from '../../protocol.ts';
import type { ThreatResult } from '../../coach/types.ts';
import { counterValueOf } from '../../knowledge.ts';
import { BLANK, placeholder } from './public.ts';
import { search, type Cap } from './search.ts';
import { shortName } from './explain.ts';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');
const plural = (n: number, one: string, many = one + 's'): string => `${n} ${n === 1 ? one : many}`;

const NOT_THEIR_MAIN = 'It is not their Main Phase.';
const HAND_NOT_COUNTED = 'This does not count the cards in their hand.';

export type ThreatRequest = Extract<AiRequest, { type: 'threat' }>;

/** The most time a threat check may take when the request names none (it delays the next request). */
export const THREAT_CAP_MS = 1500;

/** The state the search runs on, or null when the view is not an opponent's Main Phase. */
function stateFrom(
  view: SearchView,
  cards: ReadonlyMap<string, Card>,
): { root: GameState; attacker: PlayerId } | null {
  const me = view.player;
  const attacker = other(me);
  const dec = view.decision;
  if (!dec || dec.kind !== 'main' || dec.player !== attacker) return null;
  if (view.skeleton.opaque || view.result) return null;
  const blank = placeholder(BLANK, 'Unknown card', 'Character', null);
  const fill: Record<string, string> = {};
  for (const pos of Object.values(view.skeleton.hidden)) {
    const owner = pos.split('.')[0] as PlayerId;
    // Their cards are blank whatever the view knows of them: their hand is not counted. Your own
    // known cards (a Life card you looked at) are real.
    const known = owner === me ? view.known[pos] : undefined;
    fill[pos] = known && cards.has(known) ? known : BLANK;
  }
  const lookup = (id: string) => (id === BLANK ? blank : cards.get(id));
  return { root: determinize(view, fill, lookup, 1), attacker };
}

/** Chance that at least one of `life` unknown Life cards is a [Trigger], from the unseen part of your list. */
export function triggerChance(
  view: SearchView,
  ownDeck: readonly string[],
  cards: ReadonlyMap<string, Card>,
): number | null {
  const me = view.player;
  const unseen = new Map<string, number>();
  for (const id of ownDeck) unseen.set(id, (unseen.get(id) ?? 0) + 1);
  const take = (id: string | null): void => {
    if (id) unseen.set(id, (unseen.get(id) ?? 0) - 1);
  };
  const z = view.zones[me];
  for (const zone of ['hand', 'characters', 'stage', 'trash'] as const)
    for (const c of z[zone]) take(c.card);
  for (const c of z.life) if (c.faceUp) take(c.card);
  for (const c of view.resolving) if (c.handle && c.card) take(c.card);
  let life = 0;
  let deck = 0;
  for (const pos of Object.values(view.skeleton.hidden)) {
    const [owner, zone] = pos.split('.') as [PlayerId, string];
    if (owner !== me) continue;
    const known = view.known[pos];
    if (known) take(known);
    else if (zone === 'life') life++;
    else if (zone === 'deck') deck++;
  }
  if (life === 0) return 0;
  let pool = 0;
  let triggers = 0;
  for (const [id, n] of unseen) {
    if (n < 0) return null; // the list does not hold what the view shows
    pool += n;
    if (cards.get(id)?.triggerText) triggers += n;
  }
  if (pool !== life + deck) return null;
  let none = 1;
  for (let i = 0; i < life; i++) none *= (pool - triggers - i) / (pool - i);
  return Math.max(0, Math.min(1, 1 - none));
}

interface Facts {
  life: number;
  hitsNeeded: number;
  attackers: { card: string; power: number; doubleAttack: boolean }[];
  blockers: string[];
  counters: number;
  hand: number;
}

function factsOf(root: GameState, attacker: PlayerId, cards: ReadonlyMap<string, Card>): Facts {
  const me = other(attacker);
  const leader = queries.zone(root, me, 'leader')[0]!.instance;
  const seen = new Set<string>();
  const attackers: Facts['attackers'] = [];
  for (const a of legalActions(root))
    if (a.type === 'attack' && a.target === leader && !seen.has(a.attacker)) {
      seen.add(a.attacker);
      const c = queries.card(root, a.attacker);
      attackers.push({
        card: c.card,
        power: c.power ?? 0,
        doubleAttack: c.keywords.includes('Double Attack'),
      });
    }
  const hand = queries.zone(root, me, 'hand');
  const life = queries.zone(root, me, 'life').length;
  return {
    life,
    hitsNeeded: life + 1,
    attackers,
    blockers: queries
      .zone(root, me, 'characters')
      .filter((c) => !c.rested && c.keywords.includes('Blocker'))
      .map((c) => c.card),
    counters: hand.reduce(
      (t, c) => t + counterValueOf(cards.get(c.card), queries.zone(root, me, 'leader')[0]?.card),
      0,
    ),
    hand: hand.length,
  };
}

const nameOf = (cards: ReadonlyMap<string, Card>, id: string): string =>
  shortName(cards.get(id)?.name ?? id);

/** Their attacks, in order, as the explanation's line. */
function lineOf(
  root: GameState,
  actions: Action[],
  attacker: PlayerId,
  cards: ReadonlyMap<string, Card>,
): Move[] {
  const out: Move[] = [];
  for (const a of actions) {
    if (a.player !== attacker) continue;
    try {
      if (a.type === 'attack') {
        const who = queries.card(root, a.attacker);
        const target = queries.card(root, a.target);
        out.push({
          kind: 'attack',
          text:
            target.zone === 'leader'
              ? `${nameOf(cards, who.card)} attacks your Leader.`
              : `${nameOf(cards, who.card)} attacks ${nameOf(cards, target.card)}.`,
          card: who.card,
        });
      } else if (a.type === 'giveDon') {
        const to = queries.card(root, a.target);
        const last = out[out.length - 1];
        if (last?.kind === 'giveDon' && last.card === to.card) last.count = (last.count ?? 1) + 1;
        else
          out.push({
            kind: 'giveDon',
            text: `They give DON!! to ${nameOf(cards, to.card)}.`,
            card: to.card,
            count: 1,
          });
      }
    } catch {
      // A card that only exists later in the line (just played) has nothing to name here.
    }
  }
  for (const m of out)
    if (m.kind === 'giveDon') m.text = `They give ${m.count} DON!! to ${nameOf(cards, m.card!)}.`;
  return out;
}

function unknown(nodes: number, why = ''): ThreatResult {
  void nodes;
  return {
    status: 'unknown',
    explanation: {
      conceptId: 'counters-and-blockers',
      claim: why ? "Their threat can't be checked now." : "Their threat wasn't fully checked.",
      evidence: [
        {
          text: why || 'The check stopped before it found a win for them or ruled one out.',
        },
        { text: HAND_NOT_COUNTED },
      ],
      line: null,
      outcome: 'Unknown: no lethal found, none ruled out.',
      certainty: 'search-incomplete',
      nextTime:
        'On their turn, count their attackers against your Life + 1 before they attack, and plan which attacks you will stop.',
      lessonId: 'L05-block-and-counter',
      sources: ['CR 7-1-4-1'],
    },
    certainty: 'search-incomplete',
  };
}

const SOURCES = ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'CR 7-1-2-1'];
const NEXT_TIME =
  'On their turn, count their attackers against your Life + 1 before they attack, and keep your Counters and Blockers for the attacks you must stop.';

/** `chance` as the copy says it: "about 3 in 10", never a bare decimal. */
const percent = (p: number): string => `${Math.max(1, Math.round(p * 100))}%`;

/**
 * The threat check. `cards` is public card data; `ownDeck` is the asking player's own list (optional).
 * `cap` carries a node cap (deterministic, tests) and/or a millisecond cap (the app).
 */
export function threat(
  view: SearchView,
  cards: ReadonlyMap<string, Card>,
  cap: Cap,
  opts: { ownDeck?: readonly string[] } = {},
): ThreatResult & { nodes: number } {
  const built = stateFrom(view, cards);
  if (!built) return { ...unknown(0, NOT_THEIR_MAIN), nodes: 0 };
  const { root, attacker } = built;
  const base: Cap = { ...cap, attackerHand: 'ignored' };
  const facts = factsOf(root, attacker, cards);

  // 1. What the board threatens against a defender that takes every hit.
  const bare = search(root, attacker, { ...base, defence: 'none' });
  let nodes = bare.nodes;
  if (bare.status === 'unknown') return { ...unknown(nodes), nodes };

  const chance =
    opts.ownDeck && facts.life > 0
      ? triggerChance(view, opts.ownDeck, cards)
      : facts.life > 0
        ? null
        : 0;
  const triggerRow = (): Evidence | null => {
    const hidden = Object.values(view.skeleton.hidden).filter(
      (p) => p.startsWith(`${view.player}.life.`) && !view.known[p],
    ).length;
    if (hidden === 0) return null;
    if (chance === null)
      return {
        text: `Your ${plural(hidden, 'face-down Life card')} are not counted: a [Trigger] among them could change this.`,
        figures: { faceDownLife: hidden },
      };
    if (chance === 0)
      return {
        text: `None of your ${plural(hidden, 'face-down Life card')} can be a [Trigger], from your deck list.`,
        figures: { faceDownLife: hidden },
      };
    return {
      text: `A [Trigger] among your ${plural(hidden, 'face-down Life card')} could change this: about ${percent(chance)} that at least one is.`,
      figures: { faceDownLife: hidden, triggerPercent: Math.round(chance * 100) },
    };
  };
  const tRow = triggerRow();

  if (bare.status === 'refuted') {
    const attackers = facts.attackers.length;
    return {
      status: 'refuted',
      certainty: 'needed-hidden-info',
      nodes,
      explanation: {
        conceptId: 'counters-and-blockers',
        claim: 'Their board does not threaten lethal this turn.',
        evidence: [
          {
            text: `You have ${plural(facts.life, 'Life card')}, so they need ${plural(facts.hitsNeeded, 'hit')}; their board has ${plural(attackers, 'attacker')} for your Leader.`,
            figures: { life: facts.life, hitsNeeded: facts.hitsNeeded, attackers },
          },
          { text: HAND_NOT_COUNTED },
        ],
        line: null,
        outcome: 'They cannot win this turn from their board alone, unless their hand adds to it.',
        certainty: 'needed-hidden-info',
        nextTime: NEXT_TIME,
        lessonId: 'L05-block-and-counter',
        sources: SOURCES,
      },
    };
  }

  // 2. Your real defence.
  const mine = bare.trace.filter((a) => a.player === attacker);
  const real = search(root, attacker, base);
  nodes += real.nodes;
  if (real.status === 'unknown') return { ...unknown(nodes), nodes };
  const holds = real.status === 'refuted';

  const n = facts.attackers.length;
  const da = facts.attackers.some((a) => a.doubleAttack);
  const stop = n - facts.hitsNeeded + 1;
  const mustStop = !da && stop >= 1 && stop <= n ? { stop, of: n } : undefined;
  const line = lineOf(root, mine, attacker, cards);
  const names = facts.attackers.map((a) => `${nameOf(cards, a.card)} (${a.power})`).join(', ');
  const defence: string[] = [];
  if (facts.blockers.length)
    defence.push(
      `${plural(facts.blockers.length, 'active Blocker')} (${facts.blockers.map((b) => nameOf(cards, b)).join(', ')})`,
    );
  if (facts.counters > 0) defence.push(`${facts.counters} of Counters in your hand`);
  const evidence: Evidence[] = [
    {
      text: `You have ${plural(facts.life, 'Life card')}, so they need ${plural(facts.hitsNeeded, 'hit')}.`,
      figures: { life: facts.life, hitsNeeded: facts.hitsNeeded },
    },
    {
      text: `They can attack your Leader with ${names || 'nothing'}.`,
      figures: { attackers: n },
    },
    {
      text: defence.length
        ? `Your defence: ${defence.join(' and ')}.`
        : 'You have no Blocker and no Counter to stop an attack with.',
      figures: { blockers: facts.blockers.length, counters: facts.counters },
    },
    { text: HAND_NOT_COUNTED },
  ];
  if (tRow) evidence.push(tRow);

  const claim = mustStop
    ? `Their board threatens lethal: you must stop ${mustStop.stop} of their ${mustStop.of} attacks.`
    : 'Their board threatens lethal on you.';
  const outcome = holds
    ? mustStop
      ? `You lose this turn unless you stop ${mustStop.stop} of their ${mustStop.of} attacks; your hand and Blockers can.`
      : 'You lose this turn unless you stop enough of their attacks; your hand and Blockers can.'
    : 'You lose this turn: nothing you hold stops enough of their attacks.';
  const certainty: ThreatResult['certainty'] = chance === 0 ? 'any-hand' : 'needed-hidden-info';
  const explanation: Explanation = {
    conceptId: 'counters-and-blockers',
    claim,
    evidence,
    line: line.length ? line : null,
    outcome,
    certainty,
    nextTime: NEXT_TIME,
    lessonId: 'L05-block-and-counter',
    sources: SOURCES,
  };
  return {
    status: 'proven',
    ...(line.length ? { line } : {}),
    explanation,
    certainty,
    holds,
    ...(mustStop ? { mustStop } : {}),
    triggerChance: chance,
    nodes,
  };
}

/** Answer a `threat` request (the worker calls this; tests call it directly). */
export function answerThreat(
  req: ThreatRequest,
  cards: ReadonlyMap<string, Card>,
): Extract<AiResponse, { type: 'threat' }> {
  const t0 = performance.now();
  const cap: Cap =
    req.nodes !== undefined ? { nodes: req.nodes } : { ms: req.capMs || THREAT_CAP_MS };
  const { nodes: _nodes, ...result } = threat(req.view, cards, cap, {
    ...(req.ownDeck ? { ownDeck: req.ownDeck } : {}),
  });
  void _nodes;
  return { type: 'threat', id: req.id, result, ms: performance.now() - t0 };
}

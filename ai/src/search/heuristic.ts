/**
 * The position heuristic (ARCHITECTURE §4.2, strategy-concepts.md "Proposed evaluation features").
 * It scores a determinized state from the AI's side, in rough "card" units: one card in hand is
 * worth about 1. Every weight is named below with the concept it comes from. The concept file marks
 * every weight and threshold as an inference to tune in self-play; these values were tuned against
 * Rookie in the M5a strength runs (docs/benchmarks.md), not taken from any source.
 *
 * The score has seven terms, kept apart so explanations can say which one a move changed:
 * life, hand, counter, board, don, threat and deck (plus a win or loss).
 */
import type { Card } from '@optcg/cards';
import { queries, type CardView, type GameState, type PlayerId } from '@optcg/engine';
import { counterValueOf } from '../knowledge.ts';
import { ownTurn, stageOf, type Playbook, type WeightKey } from '../playbook.ts';

export const WEIGHTS = {
  /**
   * §3 Life as a resource: value of holding L Life cards, concave. "Treat your first two or three
   * Life cards as extra draws and your last two as the game" [S31]; "below two Life, block by
   * default; above three, taking damage is a resource" [S40]. A hit also gives a card (+1 hand), so
   * at 5 Life a hit is about even, and from 2 Life down it costs more than a cheap Blocker.
   */
  lifeMine: [0, 3.0, 6.2, 7.7, 8.8, 9.8, 10.7, 11.5],
  /** The opponent's Life, a little closer to linear: each hit is progress toward lethal (§8). */
  lifeTheirs: [0, 3.0, 5.0, 6.7, 8.1, 9.3, 10.3, 11.2],
  /** §11 Hand management: a card in hand is a play and a shield; returns diminish above 6 [S8]. */
  handCard: 1.0,
  handCardOver6: 0.5,
  /** §5 Counters: each 1000 of Counter in hand on top of the card itself ("every card is two"). */
  counterPer1000: 0.25,
  counterCap: 10000,
  /** §6 Board: a Character's value: a card, plus its cost and power. */
  charBase: 0.9,
  charPerCost: 0.12,
  charPer1000Power: 0.12,
  /** §5 and §7: keywords that change what a body does. */
  blocker: 0.5,
  doubleAttack: 0.6,
  banish: 0.3,
  /** §6: a rested Character the other side can attack next is worth less. */
  restedExposed: 0.15,
  stage: 0.6,
  /** §2d Ramp: each DON!! a player will have next turn. */
  don: 0.35,
  /**
   * §8 Lethal math: attackers minus (Life + 1) minus stoppers (active Blockers, and Counters at
   * about 2000 per stop). A non-negative margin is a lethal threat; each step costs this much.
   */
  threat: 2.2,
  /** The side that does not act next: its threat is a turn away. */
  threatLater: 0.4,
  /** CR 9-2-1-2: running out of deck loses. */
  deckOut: 1.5,
  win: 1000,
} as const;

export type Breakdown = Record<WeightKey | 'deck' | 'result', number>;

export interface EvalContext {
  me: PlayerId;
  /** Did the AI go first (its own turn count for the playbook's stages). */
  first: boolean;
  playbook: Playbook | null;
  cards: ReadonlyMap<string, Card>;
  /** Average defensive value of a card in the opponent's archetype (public prior). */
  oppAvgCounter: number;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

function lifeValue(table: readonly number[], l: number): number {
  if (l < table.length) return table[l]!;
  return table[table.length - 1]! + (l - table.length + 1);
}

function handValue(n: number): number {
  return Math.min(n, 6) * WEIGHTS.handCard + Math.max(0, n - 6) * WEIGHTS.handCardOver6;
}

function charValue(c: CardView, bonus: number): number {
  const k = c.keywords;
  let v =
    WEIGHTS.charBase +
    WEIGHTS.charPerCost * (c.cost ?? 0) +
    (WEIGHTS.charPer1000Power * (c.power ?? 0)) / 1000;
  if (k.includes('Blocker')) v += WEIGHTS.blocker;
  if (k.includes('Double Attack')) v += WEIGHTS.doubleAttack;
  if (k.includes('Banish')) v += WEIGHTS.banish;
  return v + bonus;
}

/** Attacks, hits needed and stoppers when `a` attacks `d` on `a`'s next turn. */
function threatMargin(s: GameState, a: PlayerId, d: PlayerId, dCounter: number): number {
  const attackers = 1 + queries.zone(s, a, 'characters').filter((c) => !c.cannotAttack).length;
  const hits = queries.zone(s, d, 'life').length + 1;
  const blockers = queries
    .zone(s, d, 'characters')
    .filter((c) => !c.rested && c.keywords.includes('Blocker')).length;
  const stops = blockers + Math.floor(dCounter / 2000);
  return attackers - hits - stops;
}

/** The AI's Counter total in hand ([Counter] Events counted at their +power). */
function myCounters(s: GameState, me: PlayerId, cards: ReadonlyMap<string, Card>): number {
  let total = 0;
  for (const c of queries.zone(s, me, 'hand')) {
    const card = cards.get(c.card);
    total += card?.category === 'Event' ? counterValueOf(card) : (c.counter ?? 0);
  }
  return Math.min(total, WEIGHTS.counterCap);
}

export function evaluate(s: GameState, ctx: EvalContext): Breakdown {
  const me = ctx.me;
  const opp = other(me);
  const out: Breakdown = {
    life: 0,
    hand: 0,
    counter: 0,
    board: 0,
    don: 0,
    threat: 0,
    deck: 0,
    result: 0,
  };
  const result = queries.result(s);
  if (result) {
    if ('winner' in result) out.result = result.winner === me ? WEIGHTS.win : -WEIGHTS.win;
    return out;
  }
  const pb = ctx.playbook;
  const w = (k: WeightKey) => pb?.weights[k] ?? 1;
  const turn = queries.turn(s);
  const stage = stageOf(ownTurn(turn.number, ctx.first));
  const face = pb ? pb.faceBias[stage] : 1;
  const guard = pb?.counterAggression ?? 1;

  // Life (§3).
  const myLife = queries.zone(s, me, 'life').length;
  const oppLife = queries.zone(s, opp, 'life').length;
  out.life =
    guard * lifeValue(WEIGHTS.lifeMine, myLife) - face * lifeValue(WEIGHTS.lifeTheirs, oppLife);
  out.life *= w('life');

  // Hand and counters (§4, §5, §11). The opponent's hand is a count; its Counters are the prior's
  // average per card.
  const myHand = queries.zone(s, me, 'hand').length;
  const oppHand = queries.zone(s, opp, 'hand').length;
  out.hand = w('hand') * (handValue(myHand) - handValue(oppHand));
  const mine = myCounters(s, me, ctx.cards);
  const theirs = Math.min(oppHand * ctx.oppAvgCounter, WEIGHTS.counterCap);
  out.counter = (w('counter') * WEIGHTS.counterPer1000 * (mine - theirs)) / 1000;

  // Board (§6, §7). A rested Character the side acting next can reach is exposed.
  const next = turn.activePlayer;
  const side = (p: PlayerId): number => {
    const foe = other(p);
    const foePower = Math.max(
      ...[...queries.zone(s, foe, 'leader'), ...queries.zone(s, foe, 'characters')].map(
        (c) => c.power ?? 0,
      ),
    );
    let v = 0;
    for (const c of queries.zone(s, p, 'characters')) {
      const bonus = p === me ? (pb?.cardValue[c.card] ?? 0) : 0;
      let cv = charValue(c, bonus);
      if (c.rested && next === foe && foePower >= (c.power ?? 0)) cv *= 1 - WEIGHTS.restedExposed;
      v += cv;
    }
    v += queries.zone(s, p, 'stage').length * WEIGHTS.stage;
    return v;
  };
  out.board = w('board') * (side(me) - side(opp));

  // DON!! next turn (§2d).
  const donNext = (p: PlayerId): number => {
    const d = queries.don(s, p);
    return d.active + d.rested + d.given + Math.min(2, d.deck);
  };
  out.don = w('don') * WEIGHTS.don * (donNext(me) - donNext(opp));

  // Lethal threat (§8), heavier for the side that acts next.
  const danger = (m: number) => Math.max(0, Math.min(3, m + 1));
  const theirThreat = danger(threatMargin(s, opp, me, mine));
  const myThreat = danger(threatMargin(s, me, opp, theirs));
  const near = (p: PlayerId) => (next === p ? 1 : WEIGHTS.threatLater);
  out.threat = w('threat') * WEIGHTS.threat * (myThreat * near(me) - theirThreat * near(opp));

  // Deck-out (CR 9-2-1-2).
  const deckLeft = queries.zone(s, me, 'deck').length;
  if (deckLeft < 5) out.deck = -WEIGHTS.deckOut * (5 - deckLeft);
  return out;
}

export const total = (b: Breakdown): number =>
  b.life + b.hand + b.counter + b.board + b.don + b.threat + b.deck + b.result;

/**
 * The position heuristic (ARCHITECTURE §4.2, strategy-concepts.md "Proposed evaluation features").
 * It scores a determinized state from the AI's side, in rough "card" units: one card in hand is
 * worth about 1.
 *
 * **Sources and numbers.** Each term's *direction* comes from a passage of strategy-concepts.md,
 * cited below. Every *number* is an inference: the concept file proposes features but no values,
 * and says all weights need tuning. Every weight here is an inference set by reasoning; the two
 * changed during M5a say why, and the Pirate-vs-Pirate A/B of those changes is in
 * docs/benchmarks.md ("Heuristic A/B": no measurable difference either way). Win rate against
 * Rookie (100%) cannot tell settings apart.
 *
 * The score has seven terms: life, hand, counter, board, don, threat and deck (plus a win or loss).
 */
import type { Card } from '@optcg/cards';
import { queries, type CardView, type GameState, type PlayerId } from '@optcg/engine';
import { counterValueOf } from '../knowledge.ts';
import { ownTurn, stageOf, type Playbook, type WeightKey } from '../playbook.ts';

export const WEIGHTS = {
  /**
   * §3 Life as a resource. Direction: concave, "large penalty at 0, high at 1–2, low at 3+" (the
   * feature table), "treat your first two or three Life cards as extra draws and your last two as
   * the game" [S31], "below two Life, block by default" [S40]. A hit also gives a card (+1 hand).
   * Steps: 1 → 0 costs 4.2, 2 → 1 3.1, then 1.6, 1.2, 1.0. Inference, set by two constraints: the
   * 1 → 0 step is the largest (the feature table's "large penalty at 0"; review M5a-09), and the
   * 2 → 1 step exceeds a cheap Blocker's value plus the card a hit gives (about 1.9 + 1), so at 2
   * Life it blocks (explanations.md E12, a planted test). A/B against M5a's table shows no
   * measurable strength difference (72/140; docs/benchmarks.md "Heuristic A/B").
   */
  lifeMine: [0, 4.2, 7.3, 8.9, 10.1, 11.1, 12.0, 12.8],
  /**
   * The opponent's Life. Direction: each hit is progress toward lethal (§8), and early Life
   * "means nothing yet" [S37] (§6). Inference: a flatter curve than the AI's own.
   */
  lifeTheirs: [0, 3.0, 5.0, 6.7, 8.1, 9.3, 10.3, 11.2],
  /** §11 Hand management: a card in hand is a play and a shield [S13][S21]. Inference: 1 card. */
  handCard: 1.0,
  /** §11's "diminishing returns above about 6" is itself marked inference there. Inference: 0.5. */
  handCardOver6: 0.5,
  /** §11 [S41] "every card is two cards": a Counter adds to the card itself. Inference: 0.25/1000. */
  counterPer1000: 0.25,
  /** Inference: Counters beyond 10000 add nothing (no attack needs more in these decks). */
  counterCap: 10000,
  /** §6 `boardPowerDelta`: a Character's power and keywords. Inference: a card, plus cost and power. */
  charBase: 0.9,
  charPerCost: 0.12,
  charPer1000Power: 0.12,
  /** §5 the value of Blockers [S8][S40]; §6 keyword weights. Inference: 0.5. */
  blocker: 0.5,
  /** §6 keyword weights; §3 "against Double Attack, block or counter". Inference: 0.6. */
  doubleAttack: 0.6,
  /** §3 "Banish attackers are worth more than their power suggests" [S35]. Inference: 0.3. */
  banish: 0.3,
  /** §6 keyword weights. Inference: 0.4 (it decides which hits land). */
  unblockable: 0.4,
  /**
   * §6 "attacks go at the Leader or a rested Character" [CR 7-1-1-2]: a rested Character the side
   * acting next can reach is worth less. Inference, changed 0.35 → 0.15 in M5a because 0.35 ended
   * a traced Rocks turn with attackers unused. A/B over 140 Pirate-vs-Pirate games shows no
   * measurable strength difference (75/140; docs/benchmarks.md "Heuristic A/B").
   */
  restedExposed: 0.15,
  /** A Stage's ongoing effect. Inference: 0.6 (no Stage is played in these two decks). */
  stage: 0.6,
  /** §2d `donAvailableNextTurn`: ramp. Inference: 0.35 per DON!! next turn. */
  don: 0.35,
  /**
   * §8 `lethalThreat`: attackers minus (Life + 1) minus stoppers (active Blockers, and Counters at
   * about 2000 per stop, §4 [S32]). A non-negative margin is a lethal threat. Inference: 2.2 per
   * step, clamped to 3 steps (`threatSteps`).
   */
  threat: 2.2,
  threatSteps: 3,
  /** Inference: the side that does not act next is a turn away from its threat; 0.4 of it. */
  threatLater: 0.4,
  /** CR 9-2-1-2: running out of deck loses. Inference: from 5 cards left, 1.5 per card short. */
  deckOut: 1.5,
  deckOutFrom: 5,
  win: 1000,
};

export type Weights = typeof WEIGHTS;

export type Breakdown = Record<WeightKey | 'deck' | 'result', number>;

export interface EvalContext {
  me: PlayerId;
  /** Did the AI go first (its own turn count for the playbook's stages). */
  first: boolean;
  playbook: Playbook | null;
  cards: ReadonlyMap<string, Card>;
  /** Average defensive value of a card in the opponent's archetype (public prior). */
  oppAvgCounter: number;
  /** Tests and A/B runs only: replace some weights. */
  weights?: Partial<Weights>;
}

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

function lifeValue(table: readonly number[], l: number): number {
  if (l < table.length) return table[l]!;
  return table[table.length - 1]! + (l - table.length + 1);
}

function handValue(n: number, W: Weights): number {
  return Math.min(n, 6) * W.handCard + Math.max(0, n - 6) * W.handCardOver6;
}

function charValue(c: CardView, bonus: number, W: Weights): number {
  const k = c.keywords;
  let v = W.charBase + W.charPerCost * (c.cost ?? 0) + (W.charPer1000Power * (c.power ?? 0)) / 1000;
  if (k.includes('Blocker')) v += W.blocker;
  if (k.includes('Double Attack')) v += W.doubleAttack;
  if (k.includes('Banish')) v += W.banish;
  if (k.includes('Unblockable')) v += W.unblockable;
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
function myCounters(
  s: GameState,
  me: PlayerId,
  cards: ReadonlyMap<string, Card>,
  W: Weights,
): number {
  let total = 0;
  for (const c of queries.zone(s, me, 'hand')) {
    const card = cards.get(c.card);
    total += card?.category === 'Event' ? counterValueOf(card) : (c.counter ?? 0);
  }
  return Math.min(total, W.counterCap);
}

export function evaluate(s: GameState, ctx: EvalContext): Breakdown {
  const W: Weights = ctx.weights ? { ...WEIGHTS, ...ctx.weights } : WEIGHTS;
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
    if ('winner' in result) out.result = result.winner === me ? W.win : -W.win;
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
  out.life = guard * lifeValue(W.lifeMine, myLife) - face * lifeValue(W.lifeTheirs, oppLife);
  out.life *= w('life');

  // Hand and counters (§4, §5, §11). The opponent's hand is a count; its Counters are the prior's
  // average per card.
  const myHand = queries.zone(s, me, 'hand').length;
  const oppHand = queries.zone(s, opp, 'hand').length;
  out.hand = w('hand') * (handValue(myHand, W) - handValue(oppHand, W));
  const mine = myCounters(s, me, ctx.cards, W);
  const theirs = Math.min(oppHand * ctx.oppAvgCounter, W.counterCap);
  out.counter = (w('counter') * W.counterPer1000 * (mine - theirs)) / 1000;

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
      let cv = charValue(c, bonus, W);
      if (c.rested && next === foe && foePower >= (c.power ?? 0)) cv *= 1 - W.restedExposed;
      v += cv;
    }
    v += queries.zone(s, p, 'stage').length * W.stage;
    return v;
  };
  out.board = w('board') * (side(me) - side(opp));

  // DON!! next turn (§2d).
  const donNext = (p: PlayerId): number => {
    const d = queries.don(s, p);
    return d.active + d.rested + d.given + Math.min(2, d.deck);
  };
  out.don = w('don') * W.don * (donNext(me) - donNext(opp));

  // Lethal threat (§8), heavier for the side that acts next.
  const danger = (m: number) => Math.max(0, Math.min(W.threatSteps, m + 1));
  const theirThreat = danger(threatMargin(s, opp, me, mine));
  const myThreat = danger(threatMargin(s, me, opp, theirs));
  const near = (p: PlayerId) => (next === p ? 1 : W.threatLater);
  out.threat = w('threat') * W.threat * (myThreat * near(me) - theirThreat * near(opp));

  // Deck-out (CR 9-2-1-2).
  const deckLeft = queries.zone(s, me, 'deck').length;
  if (deckLeft < W.deckOutFrom) out.deck = -W.deckOut * (W.deckOutFrom - deckLeft);
  return out;
}

export const total = (b: Breakdown): number =>
  b.life + b.hand + b.counter + b.board + b.don + b.threat + b.deck + b.result;

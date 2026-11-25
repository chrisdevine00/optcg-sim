/**
 * The `counter-wasted` detector (M8 WP2, explanations.md E04 and E19, curriculum L05 and L10).
 *
 * At each human counter decision that commits counter cards against an attack on the seat's own
 * Leader, two exact cases (a counter whose card does anything besides add power is never judged):
 *
 * - **(a) lost anyway (E19).** After the counters the hit still lands (`preview` of ending the
 *   counter step, never a game-ending hit). Moderate, `any-hand`: the arithmetic is on the table.
 * - **(b) not needed (E04).** The counters stopped the hit, but the seat had at least `LIFE_SAFE`
 *   Life, taking it (simulated with `reduce`, so Double Attack and Banish count) leaves Life that a
 *   public upper bound on their remaining Leader hits this turn cannot reach: the attackers still
 *   able to attack on their board, plus, per card in their hand (a number), one Rush attacker if
 *   their active DON!! pay for the cheapest Rush card in their archetype's sourced lists. The
 *   bound is `any-hand`. If it fails but their real hand could not have made the hits either, the
 *   flag is Hindsight (never severe): it needed their hidden cards.
 *
 * Nothing in `any-hand` mode reads which cards are in their hand, deck or face-down Life.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import {
  legalActions,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import type { Evidence, Explanation, Move } from '../../explanation.ts';
import { counterValueOf, priorCardIds } from '../../knowledge.ts';
import { counterCard, counterOnlyPower, isAuto, nameOf, otherSeat, turnNumber } from './exact.ts';
import {
  flagId,
  type Detector,
  type FlagKind,
  type ReviewFlag,
  type Severity,
  type TurnResult,
} from './types.ts';

/** Life from which taking one hit is a choice, not a risk (spec: "Life before the hit >= 3"). */
export const LIFE_SAFE = 3;

// --- What can attack again: public bound and actual count ------------------------------------

interface Source {
  rush: boolean;
  double: boolean;
  /** An effect that sets a rested Character or Leader active. */
  reactivate: boolean;
  cost: number;
}

const SOURCES = new Map<string, Source>();

/** What a card could add to their attackers this turn, from printed data and its public script. */
function sourceOf(id: string, cards: ReadonlyMap<string, Card>): Source {
  let s = SOURCES.get(id);
  if (s) return s;
  const card = cards.get(id);
  const script = SCRIPTS[id];
  const kw = new Set<string>([
    ...(card?.keywords ?? []),
    ...(((script as unknown as { keywords?: string[] } | undefined)?.keywords ?? []) as string[]),
  ]);
  const json = script ? JSON.stringify(script.abilities) : '';
  const reactivate = [...json.matchAll(/"setActive":\{"from":(\[[^\]]*\]|"[A-Za-z]+")/g)].some(
    (m) => !/^"donCostArea"$/.test(m[1]!),
  );
  s = {
    rush: kw.has('Rush') && card?.category === 'Character',
    double: kw.has('Double Attack'),
    reactivate,
    cost: card?.cost ?? 0,
  };
  SOURCES.set(id, s);
  return s;
}

export interface HitBound {
  /** Attackers on their board that can still attack the Leader. */
  boardAttackers: number;
  /** Life those board attackers can take (Double Attack counts twice). */
  boardDamage: number;
  /** Attackers their hand could add this turn (Rush, or re-activating one that has attacked). */
  handAttackers: number;
  /** An upper bound on Life they can take this turn: board plus hand. */
  damage: number;
}

/**
 * An upper bound on the Life a seat's opponent can still take this turn, from the state after the
 * battle (their Main Phase again). `'public'` reads only how many cards are in their hand and
 * their active DON!!; `'actual'` reads the cards in their hand (hindsight, never `any-hand`).
 */
export function hitBound(
  s: GameState,
  me: PlayerId,
  hand: 'public' | 'actual',
  cards: ReadonlyMap<string, Card>,
): HitBound | null {
  const opp = otherSeat(me);
  const dec = queries.decision(s);
  if (queries.result(s) || !dec || dec.kind !== 'main' || dec.player !== opp) return null;
  const myLeader = queries.zone(s, me, 'leader')[0]!.instance;
  const attackers = new Set<string>();
  for (const a of legalActions(s))
    if (a.type === 'attack' && a.target === myLeader) attackers.add(a.attacker);
  let boardDamage = 0;
  for (const inst of attackers)
    boardDamage += queries.card(s, inst).keywords.includes('Double Attack') ? 2 : 1;
  const rested = [...queries.zone(s, opp, 'leader'), ...queries.zone(s, opp, 'characters')].filter(
    (c) => c.rested,
  ).length;
  const active = queries.don(s, opp).active;
  const size = queries.zone(s, opp, 'hand').length;

  // The cards that could add an attacker, with what they cost. Public mode: the cheapest of each
  // kind in the archetype's sourced lists, once per card in hand. Actual mode: the real hand.
  const oppLeader = queries.zone(s, opp, 'leader')[0]!.card;
  const pool =
    hand === 'actual'
      ? queries.zone(s, opp, 'hand').map((c) => sourceOf(c.card, cards))
      : (() => {
          const all = priorCardIds(oppLeader).map((id) => sourceOf(id, cards));
          const adders = all.filter((x) => x.rush || x.reactivate);
          const cheapest = adders.reduce((m, x) => Math.min(m, x.cost), Infinity);
          const double = adders.some((x) => x.rush && x.double);
          return Array.from({ length: size }, () => ({
            rush: Number.isFinite(cheapest),
            double,
            reactivate: false,
            cost: Number.isFinite(cheapest) ? cheapest : 0,
          }));
        })();
  let budget = active;
  let reactivations = rested;
  let handAttackers = 0;
  let handDamage = 0;
  for (const x of [...pool].sort((p, q) => p.cost - q.cost)) {
    if (!x.rush && !(x.reactivate && reactivations > 0)) continue;
    if (x.cost > budget) continue;
    budget -= x.cost;
    if (!x.rush) reactivations--;
    handAttackers++;
    handDamage += x.double ? 2 : 1;
  }
  return {
    boardAttackers: attackers.size,
    boardDamage,
    handAttackers,
    damage: boardDamage + handDamage,
  };
}

// --- The window ------------------------------------------------------------------------------

/** Take the hit: end the counter step, decline every "you may" and Trigger, until their Main. */
function takeTheHit(s0: GameState, me: PlayerId): GameState {
  let s = reduce(s0, { type: 'endCounter', player: me }).state;
  for (let k = 0; k < 20; k++) {
    const dec = queries.decision(s);
    if (!dec || queries.result(s)) break;
    if (dec.kind === 'trigger')
      s = reduce(s, { type: 'trigger', activate: false, player: dec.player }).state;
    else if (dec.kind === 'optional')
      s = reduce(s, { type: 'optional', accept: false, player: dec.player }).state;
    else break;
  }
  return s;
}

const life = (s: GameState, p: PlayerId): number => queries.zone(s, p, 'life').length;
const handSize = (s: GameState, p: PlayerId): number => queries.zone(s, p, 'hand').length;

const list = (names: string[]): string =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** `withBuckin`: the figure key for "with <card> added". */
const withKey = (name: string): string => 'with' + (/[A-Za-z0-9]+/.exec(name)?.[0] ?? 'Card');

interface Played {
  index: number;
  action: Action;
  card: string;
  value: number;
}

export const detect: Detector = (item, ctx): TurnResult | null => {
  const actions = ctx.record.actions;
  const here = actions[item.index];
  if (!here) return null;
  const me = here.player;
  if (ctx.record.seats[me] !== 'human') return null;
  const dec = (i: number) => queries.decision(ctx.stateAt(i));
  // Tolerate an item pointing inside the decision: back up to its first action.
  let i0 = item.index;
  while (i0 > 0 && actions[i0 - 1]!.player === me && dec(i0 - 1)?.kind === 'counter') i0--;
  const d0 = dec(i0);
  if (!d0 || d0.kind !== 'counter' || d0.player !== me || isAuto(ctx, i0)) return null;
  const s0 = ctx.stateAt(i0);
  const battle = queries.battle(s0);
  if (!battle || battle.blocker !== null) return null;
  const myLeader = queries.card(s0, battle.target);
  if (myLeader.zone !== 'leader' || myLeader.owner !== me) return null;

  // The counters committed in this decision, up to the action that ends the step.
  const played: Played[] = [];
  let endIdx = -1;
  for (let k = i0; k < actions.length; k++) {
    const a = actions[k]!;
    if (a.player !== me) break;
    const inst = counterCard(a);
    if (inst) {
      const c = queries.card(ctx.stateAt(k), inst);
      played.push({
        index: k,
        action: a,
        card: c.card,
        value: counterValueOf(ctx.cards.get(c.card)) || (c.counter ?? 0),
      });
    }
    if (a.type === 'endCounter') {
      endIdx = k;
      break;
    }
  }
  if (played.length === 0 || endIdx < 0) return null;
  const cards = ctx.cards;
  if (!played.every((p) => counterOnlyPower(p.card, cards))) return null;

  const turn = turnNumber(s0);
  const sC = ctx.stateAt(endIdx);
  const lifeBefore = life(s0, me);
  const attackerPower = queries.card(sC, battle.attacker).power;
  const defenceBase = queries.card(s0, battle.target).power;
  const defenceAfter = queries.card(sC, battle.target).power;
  if (attackerPower === null || defenceBase === null || defenceAfter === null) return null;
  const attackerName =
    queries.card(sC, battle.attacker).zone === 'leader'
      ? 'Their Leader'
      : nameOf(cards, queries.card(sC, battle.attacker).card);
  const names = played.map((p) => nameOf(cards, p.card));
  const spentTotal = played.reduce((t, p) => t + p.value, 0);

  // What the counters achieved: end the step on the state after them (engine `reduce`, so Double
  // Attack and Banish count). The hit landed when the seat has fewer Life afterwards.
  const afterCounters = takeTheHit(sC, me);
  const lostAnyway = life(afterCounters, me) < lifeBefore;
  const gameOver = queries.result(afterCounters) !== null;

  const taken = takeTheHit(s0, me);
  if (queries.result(taken)) return null;
  const lifeAfterTake = life(taken, me);
  const lifeLost = lifeBefore - lifeAfterTake;
  const handIfTake = handSize(taken, me);
  const handIfCounter = handSize(sC, me);

  const make = (
    kind: FlagKind,
    severity: Severity,
    explanation: Explanation,
    did: Move[],
  ): TurnResult => {
    const flag: ReviewFlag = {
      id: flagId(kind, turn, played[0]!.index),
      kind,
      turn,
      player: me,
      restoreIndex: i0,
      decisionIndex: played[0]!.index,
      severity,
      certainty: explanation.certainty,
      explanation,
      did,
      practice: { judge: 'no-counter-on-attack', turn },
    };
    return { itemId: item.id, turn, flags: [flag], notes: [] };
  };

  // --- (a) the battle was lost anyway (E19) ---
  if (lostAnyway) {
    if (gameOver) return null;
    const stopNeeded = Math.max(0, attackerPower - defenceBase + 1000);
    const tie = defenceAfter === attackerPower;
    // What else in the hand could have made up the difference: biggest first, within the DON!! left.
    const playedInst = new Set(played.map((p) => counterCard(p.action)));
    let don = queries.don(s0, me).active;
    // Only an Event pays its cost to counter; a Character's Counter is free.
    const price = (inst: string): number => {
      const c = queries.card(s0, inst);
      return cards.get(c.card)?.category === 'Event' ? (c.cost ?? 0) : 0;
    };
    for (const p of played) don -= price(counterCard(p.action)!);
    const extras: { inst: string; card: string; value: number; cost: number }[] = [];
    for (const a of legalActions(s0)) {
      const inst = counterCard(a);
      if (!inst || playedInst.has(inst) || extras.some((e) => e.inst === inst)) continue;
      const c = queries.card(s0, inst);
      if (!counterOnlyPower(c.card, cards)) continue;
      const value =
        cards.get(c.card)?.category === 'Event'
          ? counterValueOf(cards.get(c.card))
          : (c.counter ?? 0);
      if (value > 0) extras.push({ inst, card: c.card, value, cost: price(inst) });
    }
    extras.sort((x, y) => y.value - x.value);
    const add: typeof extras = [];
    let sum = spentTotal;
    for (const e of extras) {
      if (sum >= stopNeeded) break;
      if (e.cost > don) continue;
      don -= e.cost;
      sum += e.value;
      add.push(e);
    }
    const reach = sum >= stopNeeded;
    const addNames = add.map((e) => nameOf(cards, e.card));
    const evidence: Evidence[] = [
      {
        text: `${attackerName} attacked at ${attackerPower}. ${list(names)} made yours ${defenceAfter}${tie ? '' : `, still short of ${attackerPower}`}, so the hit still landed.`,
        figures: { attackPower: attackerPower, defenceAfter },
      },
      reach
        ? {
            text: `Stopping it took ${attackerPower} − ${defenceBase} + 1000 = ${stopNeeded}. ${list(addNames)} (+${add.reduce((t, e) => t + e.value, 0)}) with ${list(names)} would have made ${defenceAfter + add.reduce((t, e) => t + e.value, 0)}.`,
            figures: {
              stopNeeded,
              [withKey(addNames[0]!)]: defenceAfter + add.reduce((t, e) => t + e.value, 0),
            },
          }
        : {
            text: `Stopping it took ${attackerPower} − ${defenceBase} + 1000 = ${stopNeeded}, and nothing else in your hand could make up the difference.`,
            figures: { stopNeeded },
          },
    ];
    const keep = `keep ${list(names)} for a later attack`;
    const line: Move[] = reach
      ? [
          { kind: 'take', text: `Best: take the hit and ${keep}.` },
          {
            kind: 'counter',
            text: `Also fine: add ${list(addNames)} (${defenceAfter + add.reduce((t, e) => t + e.value, 0)} vs ${attackerPower}), spending ${played.length + add.length} cards to save ${lifeLost} Life.`,
            card: add[0]!.card,
          },
        ]
      : [{ kind: 'take', text: `Take the hit and ${keep}.` }];
    const explanation: Explanation = {
      conceptId: 'counters-and-blockers',
      claim: tie
        ? `Your ${played.length === 1 ? 'counter' : 'counters'} tied, and ties go to the attacker.`
        : `Your ${played.length === 1 ? 'counter' : 'counters'} didn't stop the attack.`,
      evidence,
      line,
      outcome: `Keeps ${list(played.map((p, i) => `${names[i]} (+${p.value})`))} for a later attack, for the same ${lifeLost} Life.`,
      certainty: 'any-hand',
      nextTime: tie
        ? 'A counter has to put you above their power, not level with it. Check the "need" number before you play one.'
        : 'Check the "need" number before you play a counter. If your hand cannot reach it, keep your cards and take the hit.',
      lessonId: 'L05-block-and-counter',
      sources: ['CR 7-1-4-1', 'SH-CTR', 'HAKI'],
    };
    const did: Move[] = played.map((p, i) => ({
      kind: 'counter',
      text:
        `Played ${names[i]} (+${p.value}).` +
        (i === played.length - 1
          ? ` Your Leader ${defenceAfter} against ${attackerPower}: the hit landed (Life ${lifeBefore} → ${lifeBefore - lifeLost}).`
          : ''),
      card: p.card,
    }));
    return make('counter-wasted', 'moderate', explanation, did);
  }

  // --- (b) the counters stopped it, and taking it was safe (E04) ---
  if (lifeBefore < LIFE_SAFE) return null;
  const publicBound = hitBound(taken, me, 'public', cards);
  if (!publicBound) return null;
  let certainty: Explanation['certainty'] = 'any-hand';
  let severity: Severity = 'moderate';
  let bound = publicBound;
  if (publicBound.damage > lifeAfterTake) {
    // The public bound cannot show they were out of attacks; their real hand might.
    const actual = hitBound(taken, me, 'actual', cards);
    if (!actual || actual.damage > lifeAfterTake) return null;
    certainty = 'needed-hidden-info';
    severity = 'hindsight';
    bound = actual;
  }
  const evidence: Evidence[] = [
    {
      text: `You were at ${lifeBefore} Life. Taking the hit leaves ${lifeAfterTake}: you would still need to take ${lifeAfterTake + 1} more hits to lose.`,
      figures: { life: lifeBefore, lifeAfterHit: lifeAfterTake },
    },
    certainty === 'needed-hidden-info'
      ? {
          text: `Looking at their hand afterwards, nothing in it could have attacked your Leader again this turn${bound.boardAttackers > 0 ? ` beyond the ${bound.boardAttackers} on their board` : ''}.`,
          figures: { remainingAttackers: bound.boardAttackers + bound.handAttackers },
        }
      : bound.damage === 0
        ? {
            text: 'It was their last attack this turn: nothing else of theirs was active.',
            figures: { remainingAttackers: 0 },
          }
        : {
            text: `Their board could attack your Leader ${bound.boardAttackers === 1 ? 'once' : `${bound.boardAttackers} more times`} this turn${bound.handAttackers > 0 ? `, and a Rush Character from their hand could add ${bound.handAttackers}` : ''}: at most ${bound.damage} more Life, and you had ${lifeAfterTake} to take them with.`,
            figures: {
              remainingAttackers: bound.boardAttackers,
              ...(bound.handAttackers > 0 ? { handAttackers: bound.handAttackers } : {}),
            },
          },
    {
      text: `Countering cost you ${played.length === 1 ? 'a card' : `${played.length} cards`}. Taking the hit would have given you ${lifeLost === 1 ? 'one' : lifeLost}: ${handIfTake} cards instead of ${handIfCounter}.`,
      figures: { handIfCounter, handIfTake },
    },
  ];
  const explanation: Explanation = {
    conceptId: 'counter-or-take',
    claim:
      played.length === 1
        ? "This counter didn't need playing."
        : "These counters didn't need playing.",
    evidence,
    line: [{ kind: 'take', text: 'Take the hit.' }],
    outcome: `+${handIfTake - handIfCounter} cards in hand for ${lifeLost} Life.`,
    certainty,
    nextTime:
      'At high Life, let a lone hit through. Keep counters for hits that would cost you the game or a Character you need.',
    lessonId: 'L10-counter-or-take',
    sources: ['CR 7-1-4-1-1-2', 'SH-CTR', 'SH-MIS', 'BANDAI-EXP'],
  };
  const did: Move[] = played.map((p, i) => ({
    kind: 'counter',
    text:
      `Played ${names[i]} (+${p.value}).` +
      (i === played.length - 1 ? ` Your Leader ${defenceAfter}: attack stopped.` : ''),
    card: p.card,
  }));
  return make('counter-wasted', severity, explanation, did);
};

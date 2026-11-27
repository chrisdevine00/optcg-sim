/**
 * The `don-unused` detector (M8 WP2, explanations.md E06 and E07, curriculum L09).
 *
 * At each human `endTurn` it reads the DON!! ledger the coach's tempo meter reads (`donLedger`), on
 * the state where the turn passes (so [End of Your Turn] effects have resolved and nothing of
 * theirs has run: M7-R1). It flags when DON!! were left unused AND the turn gave them a use (an
 * attack declared or legal, or a card costing no more than the unused DON!! legal to play). Held
 * DON!! (a [Counter] Event's cost, an opponent-turn effect that rests them) are not unused; with
 * nothing unused the turn gets the E07 "holding was right" note, not a flag.
 *
 * Certainty `any-hand`: the ledger reads the seat's own hand and board, the history reads public
 * powers and the counters the opponent actually played, and the stop arithmetic reads their
 * Leader's power and the biggest counter in their archetype's sourced lists. Nothing in their
 * hand, deck or face-down Life is read.
 */
import type { Card } from '@optcg/cards';
import { legalActions, project, queries, type GameState, type PlayerId } from '@optcg/engine';
import { candidateLines } from '../drills/lines.ts';
import { donLedger, explainHeld, explainUnused, type DonLedger } from '../../coach/tempo.ts';
import type { Evidence, Explanation, Move } from '../../explanation.ts';
import { biggestCounter, counterValueOf, priorCardIds } from '../../knowledge.ts';
import {
  countWord,
  counterCostsDon,
  didMoves,
  isAuto,
  nameOf,
  otherSeat,
  turnNumber,
  turnStart,
} from './exact.ts';
import {
  flagId,
  type Detector,
  type DetectorContext,
  type ReviewFlag,
  type TurnResult,
} from './types.ts';

/** From this many unused DON!! the flag is moderate; fewer is minor (spec). */
export const MODERATE_AT = 3;

/** An attack on their Leader this turn, read from the replay: powers and how it ended. */
interface Attack {
  card: string;
  isLeader: boolean;
  /** The attacker's power when the battle ended. */
  power: number;
  /** Their Leader's power before any counter. */
  base: number;
  /** Their Leader's power after their counters. */
  final: number;
  blocked: boolean;
}

/** The turn's attacks on their Leader that went through a counter step, in order. */
function leaderAttacks(ctx: DetectorContext, from: number, to: number, player: PlayerId): Attack[] {
  const out: Attack[] = [];
  for (let i = from; i < to; i++) {
    const a = ctx.record.actions[i]!;
    if (a.type !== 'attack' || a.player !== player) continue;
    const before = ctx.stateAt(i);
    const target = queries.card(before, a.target);
    if (target.zone !== 'leader' || target.owner === player) continue;
    let first: GameState | null = null;
    let last: GameState | null = null;
    let blocked = false;
    for (let j = i + 1; j <= to; j++) {
      const s = ctx.stateAt(j);
      const b = queries.battle(s);
      if (!b || b.attacker !== a.attacker || b.target !== a.target) break;
      first ??= s;
      last = s;
      blocked ||= b.blocker !== null;
    }
    if (!first || !last) continue;
    const power = queries.card(last, a.attacker).power;
    const base = queries.card(first, a.target).power;
    const final = queries.card(last, a.target).power;
    if (power === null || base === null || final === null) continue;
    const atk = queries.card(last, a.attacker);
    out.push({ card: atk.card, isLeader: atk.zone === 'leader', power, base, final, blocked });
  }
  return out;
}

/** "two ordinary counters, or one of their +4000 Events, which also costs them a DON!!". */
function stopOptions(stop: number, oppLeader: string, cards: ReadonlyMap<string, Card>): string {
  const per = 2000;
  const k = Math.max(1, Math.ceil(stop / per));
  let text = k === 1 ? 'one ordinary counter' : `${countWord(k)} ordinary counters`;
  const big = biggestCounter(oppLeader, cards);
  if (big >= stop && big > per) {
    text += `, or one of their +${big} Events`;
    const events = priorCardIds(oppLeader).filter(
      (id) => cards.get(id)?.category === 'Event' && eventValue(id, cards) === big,
    );
    if (events.length > 0 && events.every((id) => counterCostsDon(id)))
      text += ', which also costs them a DON!!';
  }
  return text;
}

const eventValue = (id: string, cards: ReadonlyMap<string, Card>): number =>
  counterValueOf(cards.get(id));

/** The fewest DON!! left unused by any candidate line from this Main, or null when none can be built. */
function bestUnused(
  main: GameState,
  player: PlayerId,
  cards: ReadonlyMap<string, Card>,
): number | null {
  try {
    const lines = candidateLines(main, player, cards);
    return lines.length === 0 ? null : Math.min(...lines.map((l) => l.unused));
  } catch {
    return null;
  }
}

export const detect: Detector = (item, ctx): TurnResult | null => {
  const action = ctx.record.actions[item.index];
  if (!action || action.type !== 'endTurn') return null;
  const player = action.player;
  if (ctx.record.seats[player] !== 'human' || isAuto(ctx, item.index)) return null;
  const pre = ctx.stateAt(item.index);
  const turn = turnNumber(pre);
  // The first player's first turn: 1 DON!!, no attack allowed (CR 6-5-6-1); nothing to flag.
  if (turn === 1) return null;
  const cards = ctx.cards;

  // The state where the turn passes: end-of-turn effects resolved, nothing of theirs run (M7-R1).
  let at = item.index + 1;
  while (at < ctx.record.actions.length && turnNumber(ctx.stateAt(at)) === turn) at++;
  const end = ctx.stateAt(Math.min(at, ctx.record.actions.length));
  const viewEnd = project(end, player);
  const ledger: DonLedger = donLedger(viewEnd, cards);
  const { start, firstMain } = turnStart(ctx, item.index, player);

  if (ledger.unused === 0) {
    const held = explainHeld(viewEnd, ledger, cards);
    return held ? { itemId: item.id, turn, flags: [], notes: [held] } : null;
  }

  // Did the DON!! have a use this turn?
  const legal = legalActions(pre).filter((a) => a.player === player);
  const declared = ctx.record.actions
    .slice(start, item.index)
    .some((a) => a.type === 'attack' && a.player === player);
  const canAttack = legal.some((a) => a.type === 'attack');
  const playable = legal
    .filter((a) => a.type === 'playCard')
    .map((a) => queries.card(pre, (a as { card: string }).card))
    .filter((c) => (c.cost ?? 0) <= ledger.unused)
    .sort((x, y) => (y.cost ?? 0) - (x.cost ?? 0));
  if (!declared && !canAttack && playable.length === 0) return null;

  const base = explainUnused(viewEnd, ledger, cards, 'left', true, 1);
  if (!base) return null;
  const n = ledger.unused;
  const opp = otherSeat(player);
  const oppLeader = queries.zone(end, opp, 'leader')[0]!.card;

  const evidence: Evidence[] = [...base.evidence];
  let line: Move[] | null = null;
  let outcome = base.outcome;

  // The attack that failed by the smallest margin the unused DON!! could have covered.
  const failed = leaderAttacks(ctx, start, item.index, player)
    .filter((x) => !x.blocked && x.power < x.final && x.final - x.power <= n * 1000)
    .sort((x, y) => x.final - x.power - (y.final - y.power))[0];
  if (failed) {
    const who = failed.isLeader ? 'Leader' : nameOf(cards, failed.card);
    const stopNow = Math.max(0, failed.power - failed.base + 1000);
    const counters = failed.final - failed.base;
    const boosted = failed.power + n * 1000;
    const stopWith = Math.max(0, boosted - failed.base + 1000);
    evidence.push({
      text: `Your ${who} attacked at ${failed.power} into their ${failed.base} Leader. ${
        counters === stopNow
          ? `A ${counters} counter stopped it.`
          : `Their counters added ${counters}, and it was stopped.`
      }`,
      figures: { attackPower: failed.power, defencePower: failed.base, stopNeeded: stopNow },
    });
    evidence.push({
      text: `With ${n === 1 ? 'that 1' : `those ${n}`} DON!! your ${who} attacks at ${boosted}, and stopping it takes ${boosted} − ${failed.base} + 1000 = ${stopWith}: ${stopOptions(stopWith, oppLeader, cards)}.`,
      figures: { attackWithDon: boosted, stopNeededWithDon: stopWith },
    });
    line = [
      {
        kind: 'giveDon',
        text: `Give ${n} DON!! to your ${who} (${boosted}) before it attacks.`,
        card: failed.card,
        count: n,
      },
      {
        kind: 'attack',
        text: `Attack their Leader with your ${who}.`,
        card: failed.card,
        target: 'leader',
      },
    ];
    outcome = 'Costs them at least 1 more card, or 1 more Life.';
  } else {
    // No attack to point at: what the DON!! could have done from the board as it stood.
    const alt = explainUnused(project(pre, player), ledger, cards, 'ending', false, 1);
    if (alt && alt.line) {
      evidence.push(...alt.evidence.slice(1));
      line = alt.line;
      outcome = alt.outcome;
    } else if (playable[0]) {
      const c = playable[0];
      evidence.push({
        text: `${nameOf(cards, c.card)} costs ${c.cost ?? 0} and was in your hand: those DON!! could have played it.`,
        figures: { playableCost: c.cost ?? 0 },
      });
      line = [{ kind: 'play', text: `Play ${nameOf(cards, c.card)}.`, card: c.card }];
      outcome = 'Puts another Character on your board.';
    }
  }

  const explanation: Explanation = {
    ...base,
    evidence,
    line,
    outcome,
    certainty: 'any-hand',
  };
  const flag: ReviewFlag = {
    id: flagId('don-unused', turn, item.index),
    kind: 'don-unused',
    turn,
    player,
    restoreIndex: firstMain,
    decisionIndex: item.index,
    severity: n >= MODERATE_AT ? 'moderate' : 'minor',
    certainty: 'any-hand',
    explanation,
    did: didMoves(ctx, firstMain, item.index, player),
  };
  // M9 WP7: Practice restores at the turn's first Main and asks for a line that leaves no more DON!!
  // unused than the best of the drill's candidate lines (WP3). The flag says some of the `n` unused
  // DON!! had a use, so the bar is at most `n - 1`: a candidate list that cannot beat the game does
  // not make "End turn at once" a solution.
  const unusedMin = Math.min(bestUnused(ctx.stateAt(firstMain), player, cards) ?? n - 1, n - 1);
  flag.practice = { judge: 'don-ledger', turn, expect: { unusedMin } };
  return { itemId: item.id, turn, flags: [flag], notes: [] };
};

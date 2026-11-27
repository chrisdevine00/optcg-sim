/**
 * The `mulligan` detector (M8 WP2, explanations.md E10 and E11, curriculum L12).
 *
 * Compares the human's keep or redraw with the Leader's guide (`playbookFor`, the same rule the
 * Pirate AI follows: `mulliganVerdict`). Only a sourced guide judges: a Leader with the generic
 * default playbook, or a guide whose rule cites no handbook entry ("no sourced rule"), gives no
 * flag. Minor, `any-hand` (the rule reads the seat's own hand and its own list), shown with the
 * "From the <Leader> guide (sourced)" label.
 */
import type { Card } from '@optcg/cards';
import { queries } from '@optcg/engine';
import type { Evidence, Explanation, Move } from '../../explanation.ts';
import { counterValueOf } from '../../knowledge.ts';
import { playbookFor, type MulliganPiece, type Playbook } from '../../playbook.ts';
import { chanceAtLeastOne, firstPlayableTurn, mulliganVerdict } from '../mulligan.ts';
import { isAuto, nameOf } from './exact.ts';
import { flagId, type Detector, type ReviewFlag, type TurnResult } from './types.ts';

/** The guide's rule is sourced when it cites a handbook entry (`SH-XXX`). */
export const isSourced = (pb: Playbook): boolean =>
  !pb.isDefault && /\bSH-[A-Z0-9]+/.test(pb.mulligan.source);

/** "luffy-rg" in `OP13-001-luffy-rg` becomes "Luffy RG"; `OP17-039-rocks` becomes "Rocks". */
export function guideName(pb: Playbook): string {
  const rest = pb.archetypeId.startsWith(pb.leaderId + '-')
    ? pb.archetypeId.slice(pb.leaderId.length + 1)
    : pb.aiName;
  return rest
    .split('-')
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(' ');
}

const list = (names: string[]): string =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** A piece that is "act early": every card it lists is a Character costing 3 or less. */
function earlyRange(
  piece: MulliganPiece,
  cards: ReadonlyMap<string, Card>,
): { lo: number; hi: number } | null {
  if (!piece.cards || piece.cards.length === 0) return null;
  const costs: number[] = [];
  for (const id of piece.cards) {
    const c = cards.get(id);
    if (!c || c.category !== 'Character' || c.cost === null || c.cost > 3) return null;
    costs.push(c.cost);
  }
  return { lo: Math.min(...costs), hi: Math.max(...costs) };
}

const nth = (n: number): string => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);

export interface ExplainMulliganArgs {
  /** The five cards held. */
  hand: readonly Card[];
  /** The seat's own list: the multiset of its deck, hand and Life (never an order). */
  ownDeck: readonly string[];
  pb: Playbook;
  first: boolean;
  cards: ReadonlyMap<string, Card>;
}

/**
 * The E10 / E11 explanation of what the guide says about a hand (keep or redraw), independent of
 * what anyone chose. The mulligan detector and the M9 mulligan drill both call it. It reads the
 * seat's own hand and own list only, so it is `any-hand`.
 */
export function explainMulligan(args: ExplainMulliganArgs): Explanation {
  const { hand, ownDeck, pb, first, cards } = args;
  const verdict = mulliganVerdict(hand, pb.mulligan, first);

  const guide = guideName(pb);
  const counters = hand
    .map((c) => ({ c, v: counterValueOf(c) }))
    .filter((x) => x.v > 0)
    .sort((x, y) => y.v - x.v);
  const counterTotal = counters.reduce((t, x) => t + x.v, 0);
  const evidence: Evidence[] = [];
  const sources = ['CR 5-2-1-6'];
  const tags = [...new Set(pb.mulligan.source.match(/SH-[A-Z0-9]+/g) ?? [])];
  let outcome: string;
  let nextTime: string;
  let move: Move;

  if (!verdict.keep) {
    // The guide says redraw: show what the hand lacks.
    const unmet = pb.mulligan.pieces.filter((p) => !verdict.met[p.name]);
    let range: { lo: number; hi: number } | null = null;
    let firstPlay: number | null = null;
    let chance = 0;
    for (const piece of unmet) {
      const r = earlyRange(piece, cards);
      if (!r) {
        evidence.push({ text: `Your hand lacks ${piece.label}.`, figures: {} });
        continue;
      }
      range = r;
      const chars = hand.filter((c) => c.category === 'Character' && c.cost !== null);
      const cheapest = chars.length ? Math.min(...chars.map((c) => c.cost!)) : null;
      const schedule = first ? '1, 3, then 5' : '2, 4, then 6';
      if (cheapest === null) {
        evidence.push({ text: 'Your hand holds no Character to play early.', figures: {} });
      } else {
        firstPlay = firstPlayableTurn(cheapest, first);
        const own = first ? (firstPlay + 1) / 2 : firstPlay / 2;
        evidence.push({
          text:
            firstPlay <= (first ? 3 : 4)
              ? `Your cheapest Character costs ${cheapest}, but it is not one of the guide's early plays.`
              : `Your cheapest Character costs ${cheapest}. Going ${first ? 'first' : 'second'} you have ${schedule} DON!!: nothing to play until turn ${firstPlay} (your ${nth(own)}).`,
          figures: { cheapestCharacter: cheapest, firstPlayableGameTurn: firstPlay },
        });
      }
      const wanted = new Set(piece.cards);
      const copies = ownDeck.filter((id) => wanted.has(id)).length;
      chance = chanceAtLeastOne(ownDeck.length, copies, 5);
      evidence.push({
        text: `Your deck has ${copies} Characters that cost ${r.lo} to ${r.hi}. A fresh five has at least one of them ${Math.round(chance * 100)}% of the time.`,
        figures: {
          earlyPlays: copies,
          deckSize: ownDeck.length,
          chanceAtLeastOne: Math.round(chance * 100) / 100,
        },
      });
    }
    evidence.push({
      text:
        counters.length === 0
          ? 'It has no card that defends.'
          : `It defends with ${counters.length === 1 ? 'one card' : `${counters.length} cards`}: ${list(counters.map((x) => nameOf(cards, x.c.id)))}, +${counterTotal}.`,
      figures: { counterCards: counters.length, counterTotal },
    });
    outcome = range
      ? `A ${Math.round(chance * 100)}% chance of a play by turn ${first ? 3 : 4} (your 2nd)${firstPlay === null ? '' : `, instead of none until turn ${firstPlay}`}.`
      : 'A fresh five cards, with a chance at the pieces this hand lacks.';
    nextTime =
      range && first && pb.mulligan.requireGoingFirst.length > 0
        ? `Going first with ${guide}, redraw any hand with no Character costing ${range.lo} to ${range.hi}.`
        : `With ${guide}, redraw a hand that lacks ${list(unmet.map((p) => p.label))}.`;
    sources.push('CR 6-4-1', ...tags);
    move = { kind: 'redraw', text: 'Redraw all five.' };
  } else {
    // The guide says keep: show the pieces the hand holds.
    for (const piece of pb.mulligan.pieces) {
      const got = verdict.fills[piece.name] ?? [];
      if (got.length === 0) continue;
      evidence.push({
        text: `Your hand holds ${piece.label}: ${list(got.map((c) => c.name))}.`,
        figures: { piece: got.length },
      });
    }
    if (counterTotal > 0)
      evidence.push({
        text: `It can defend: ${list(counters.map((x) => `${nameOf(cards, x.c.id)} (+${x.v})`))} make ${counterTotal} of counter.`,
        figures: { counterTotal },
      });
    const held = pb.mulligan.pieces.filter((p) => (verdict.fills[p.name]?.length ?? 0) > 0);
    outcome = `A hand with ${list(held.map((p) => p.label))}${counterTotal > 0 ? ` and ${counterTotal} of counter` : ''}.`;
    nextTime =
      'Ask three questions: can I act on my first two turns, do I hold a piece of my plan, can I defend? Two yeses is a keep.';
    sources.push(...tags);
    move = { kind: 'keep', text: 'Keep.' };
  }
  if (!sources.includes('SH-MUL')) sources.push('SH-MUL');

  const explanation: Explanation = {
    conceptId: 'mulligan',
    claim: verdict.keep ? 'Keep this hand.' : 'Redraw this hand.',
    evidence,
    line: [move],
    outcome,
    certainty: 'any-hand',
    nextTime,
    lessonId: 'L12-mulligan',
    sources,
  };
  return explanation;
}

export const detect: Detector = (item, ctx): TurnResult | null => {
  const action = ctx.record.actions[item.index];
  if (!action || action.type !== 'mulligan') return null;
  const me = action.player;
  if (ctx.record.seats[me] !== 'human' || isAuto(ctx, item.index)) return null;
  const s = ctx.stateAt(item.index);
  const cards = ctx.cards;
  const handViews = queries.zone(s, me, 'hand');
  const hand = handViews.map((c) => cards.get(c.card)).filter((c): c is Card => !!c);
  const leader = queries.zone(s, me, 'leader')[0]!.card;
  // The seat's own list: the multiset of its deck, hand and Life (never an order).
  const ownDeck = [
    ...queries.zone(s, me, 'deck'),
    ...handViews,
    ...queries.zone(s, me, 'life'),
  ].map((c) => c.card);
  const pb = playbookFor(leader, ownDeck, cards);
  if (!isSourced(pb)) return null;
  const first = queries.turn(s).activePlayer === me;
  const verdict = mulliganVerdict(hand, pb.mulligan, first);
  if (verdict.keep === !action.redraw) return null;
  const explanation = explainMulligan({ hand, ownDeck, pb, first, cards });
  const turn = Math.max(1, queries.turn(s).number);
  const flag: ReviewFlag = {
    id: flagId('mulligan', turn, item.index),
    kind: 'mulligan',
    turn,
    player: me,
    restoreIndex: item.index,
    decisionIndex: item.index,
    severity: 'minor',
    certainty: 'any-hand',
    explanation,
    did: [
      action.redraw
        ? { kind: 'redraw', text: 'Redrew all five.' }
        : { kind: 'keep', text: 'Kept your hand.' },
    ],
  };
  return { itemId: item.id, turn, flags: [flag], notes: [] };
};

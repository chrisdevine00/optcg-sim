/**
 * The `given-away` detector (M8 WP3, explanations.md E21): "lethal given away", the lead's definition
 * in DECISIONS 2026-11-25 "M8 plan".
 *
 * On an opponent turn `T` that ended in their win, `threat()` runs at their first Main from the
 * player's `projectForSearch`: their board alone against your real defence gives `holds === false`
 * (the base). Candidates are the attacks your [Blocker] Characters made on your turn `T-1`. Each is a
 * branch: apply the record up to that attack, skip the battle (the attack and everything until you are
 * back at your Main), re-apply your later actions of `T-1` while they are legal, end the turn, settle
 * to their Main, and run `threat()` again. A refutation, or `holds === true`, flags the attack.
 *
 * - **`any-hand`** (severe): both checks are board-only (their hand is never counted by `threat()`).
 * - **Hindsight**: the board did not decide it (the base is not a board-only loss), but their real hand
 *   did, and the branch is refuted in `actual` mode. Never severe.
 * - No candidate helps: a turn note, "Their board won whatever you did."; no flag.
 * - A cap hit is a "Not fully checked" marker.
 *
 * The item is `T-1` (your turn) or `T`; either finds the same game. Lesson L15. Practice judge
 * `survive-turn` for turn `T`, started from the flagged attack.
 */
import type { Card } from '@optcg/cards';
import { projectForSearch, queries, reduce, type GameState, type PlayerId } from '@optcg/engine';
import type { Evidence, Explanation, Move } from '../../explanation.ts';
import { lethal } from '../lethal/lethal.ts';
import { threat } from '../lethal/threat.ts';
import { isLegal, nameOf, other } from './defence-line.ts';
import {
  flagId,
  type Detector,
  type DetectorContext,
  type ReviewFlag,
  type ReviewMarker,
  type Severity,
} from './types.ts';

const SOURCES = ['CR 7-1-2-1', 'CR 7-1-4-1', 'CR 7-1-4-1-1-1'];
const HAND_NOT_COUNTED = 'This does not count the cards in their hand.';

const incomplete = (turn: number): ReviewMarker => ({
  turn,
  kind: 'given-away',
  reason: 'search-incomplete',
  explanation: {
    conceptId: 'lethal-math',
    claim: 'Their winning turn was not fully checked.',
    evidence: [{ text: 'The search stopped before it found a way to stop them or ruled one out.' }],
    line: null,
    outcome: 'Unknown: no flag, and none ruled out.',
    certainty: 'search-incomplete',
    nextTime: 'Before you attack with a Blocker, count their attackers against your Life + 1.',
    lessonId: 'L15-lethal-math',
    sources: SOURCES,
  },
});

/**
 * The state at their first Main of `T` had your attack at `k` not been made: the rest of your turn is
 * re-applied while legal. Null when the branch cannot be followed (an opponent action that no longer
 * fits, or no way to end the turn).
 */
export function branchWithout(
  ctx: DetectorContext,
  k: number,
  endTurn: number,
  theirMain: number,
  me: PlayerId,
): GameState | null {
  const acts = ctx.record.actions;
  // The battle: from the attack until you are back at your own Main decision.
  let g = k + 1;
  while (g < endTurn) {
    const dec = queries.decision(ctx.stateAt(g));
    if (queries.result(ctx.stateAt(g)) || (dec?.kind === 'main' && dec.player === me)) break;
    g++;
  }
  let s = ctx.stateAt(k);
  for (let j = g; j < endTurn; j++) {
    const a = acts[j]!;
    if (isLegal(s, a)) s = reduce(s, a).state;
    else if (a.player !== me) return null;
  }
  const end = acts[endTurn]!;
  if (!isLegal(s, end)) return null;
  s = reduce(s, end).state;
  for (let j = endTurn + 1; j < theirMain; j++) {
    const a = acts[j]!;
    if (!isLegal(s, a)) return null;
    s = reduce(s, a).state;
  }
  const dec = queries.decision(s);
  return dec?.kind === 'main' && dec.player !== me ? s : null;
}

interface Candidate {
  /** Index of the attack in the record. */
  k: number;
  endTurn: number;
  card: string;
  target: string;
}

export const detect: Detector = (item, ctx) => {
  const rec = ctx.record;
  if (!rec?.actions || rec.actions.length === 0 || !ctx.stateAt) return null;
  const n = rec.actions.length;
  const end = ctx.stateAt(n);
  const result = queries.result(end);
  if (!result || !('winner' in result) || result.reason !== 'damage at 0 Life') return null;
  const attacker = result.winner;
  const me = other(attacker);
  if (rec.seats[me] !== 'human') return null;
  const T = queries.turn(end).number;
  if (queries.turn(end).activePlayer !== attacker || T < 2) return null;
  if (item.turn !== T && item.turn !== T - 1) return null;
  const cards = ctx.cards;

  // Your turn T-1: each Blocker attack, with its end of turn; and their first Main of T.
  const candidates: Candidate[] = [];
  let theirMain = -1;
  for (let i = 0; i < n; i++) {
    const s = ctx.stateAt(i);
    const turn = queries.turn(s).number;
    const dec = queries.decision(s);
    if (turn === T && theirMain < 0 && dec?.kind === 'main' && dec.player === attacker) {
      theirMain = i;
      break;
    }
    const a = rec.actions[i]!;
    if (turn === T - 1 && a.type === 'attack' && a.player === me) {
      const atk = queries.card(s, a.attacker);
      if (atk.zone === 'characters' && atk.keywords.includes('Blocker')) {
        let e = i + 1;
        while (e < n && !(rec.actions[e]!.type === 'endTurn' && rec.actions[e]!.player === me)) e++;
        if (e < n)
          candidates.push({
            k: i,
            endTurn: e,
            card: atk.card,
            target:
              queries.card(s, a.target).zone === 'leader'
                ? 'their Leader'
                : nameOf(cards, queries.card(s, a.target).card),
          });
      }
    }
  }
  if (theirMain < 0 || candidates.length === 0) return null;

  const base = ctx.stateAt(theirMain);
  const view0 = projectForSearch(base, me);
  const b0 = threat(view0, cards, ctx.cap);
  if (b0.status === 'unknown')
    return { itemId: item.id, turn: item.turn, flags: [], notes: [], marker: incomplete(T - 1) };
  const boardLoss = b0.status === 'proven' && b0.holds === false;
  if (!boardLoss) {
    // Their hand decided it: only `actual` mode sees that.
    const a0 = lethal({ mode: 'actual', state: base, attacker }, cards, ctx.cap);
    if (a0.status === 'unknown')
      return { itemId: item.id, turn: item.turn, flags: [], notes: [], marker: incomplete(T - 1) };
    if (a0.status !== 'proven') return null;
  }

  const flags: ReviewFlag[] = [];
  let marker: ReviewMarker | undefined;
  for (const c of candidates) {
    const s1 = branchWithout(ctx, c.k, c.endTurn, theirMain, me);
    if (!s1) continue;
    if (boardLoss) {
      const b1 = threat(projectForSearch(s1, me), cards, ctx.cap);
      if (b1.status === 'unknown') {
        marker = incomplete(T - 1);
        continue;
      }
      const helps = b1.status === 'refuted' || (b1.status === 'proven' && b1.holds === true);
      if (helps) flags.push(flagFor(c, T, me, 'any-hand', cards, b0, b1));
    } else {
      const a1 = lethal({ mode: 'actual', state: s1, attacker }, cards, ctx.cap);
      if (a1.status === 'unknown') marker = incomplete(T - 1);
      else if (a1.status === 'refuted')
        flags.push(flagFor(c, T, me, 'needed-hidden-info', cards, b0, null));
    }
  }
  const notes: Explanation[] = [];
  if (flags.length === 0 && !marker && boardLoss) notes.push(noHelp(b0.explanation));
  if (flags.length === 0 && notes.length === 0 && !marker) return null;
  return {
    itemId: item.id,
    turn: item.turn,
    flags,
    notes,
    ...(marker ? { marker } : {}),
  };
};

function noHelp(base: Explanation): Explanation {
  return {
    conceptId: 'lethal-math',
    claim: 'Their board won whatever you did.',
    evidence: base.evidence.slice(0, 3),
    line: null,
    outcome: 'Keeping your Blocker back would not have stopped their board.',
    certainty: 'any-hand',
    nextTime:
      'Their board was already enough: look at the turns before, where you could have kept more Life or Blockers.',
    lessonId: 'L15-lethal-math',
    sources: SOURCES,
  };
}

function flagFor(
  c: Candidate,
  T: number,
  me: PlayerId,
  certainty: 'any-hand' | 'needed-hidden-info',
  cards: ReadonlyMap<string, Card>,
  b0: ReturnType<typeof threat>,
  b1: ReturnType<typeof threat> | null,
): ReviewFlag {
  const name = nameOf(cards, c.card);
  const move: Move = { kind: 'attack', text: `Attacked ${c.target} with ${name}.`, card: c.card };
  const evidence: Evidence[] = [];
  const base = b0.explanation.evidence;
  evidence.push(...base.slice(0, 3));
  evidence.push({
    text: `${name} attacked on your turn, so it was resting on theirs and could not Block (CR 7-1-2-1).`,
    figures: { restingBlockers: 1 },
  });
  let line: Move[];
  let outcome: string;
  if (b1) {
    if (b1.status === 'proven')
      evidence.push({
        text: `Kept back, ${name} could have Blocked one of their ${b1.mustStop?.of ?? 'attacks'}${b1.mustStop ? ' attacks' : ''}.`,
        figures: { blockers: 1 },
      });
    else if (b1.explanation.evidence[0]) evidence.push(b1.explanation.evidence[0]);
    const ms = b1.status === 'proven' ? b1.mustStop : undefined;
    line = [
      {
        kind: 'block',
        text:
          b1.status === 'refuted'
            ? `Keep ${name} back; their board then cannot win this turn.`
            : ms
              ? `Keep ${name} back; it can Block one of their ${ms.of} attacks, and you only needed to stop ${ms.stop}.`
              : `Keep ${name} back; it can Block one of their attacks.`,
        card: c.card,
      },
    ];
    outcome =
      b1.status === 'refuted'
        ? 'With it back, their board alone cannot win this turn, unless their hand adds to it.'
        : 'With it back, your Blocker and hand stop enough of their attacks to survive their board alone.';
  } else {
    evidence.length = 0;
    evidence.push({
      text: `Their board alone could not win; with the cards they held it could, and ${name} resting could not Block (CR 7-1-2-1).`,
      figures: { restingBlockers: 1 },
    });
    evidence.push({
      text: 'This needed their real hand: it is hindsight, not something you could see.',
    });
    line = [
      {
        kind: 'block',
        text: `Keep ${name} back; it can Block one of their attacks.`,
        card: c.card,
      },
    ];
    outcome = 'With it back, nothing they held would have won that turn.';
  }
  if (b1) evidence.push({ text: HAND_NOT_COUNTED });
  const trigger = base.find((e) => /\[Trigger\]/.test(e.text));
  if (b1 && trigger) evidence.push(trigger);
  const explanation: Explanation = {
    conceptId: 'lethal-math',
    claim: b1
      ? `Attacking with ${name} let their board win.`
      : `Attacking with ${name} left you open to their hand.`,
    evidence,
    line,
    outcome,
    certainty,
    nextTime:
      'Before you attack with a Blocker, count their attackers against your Life + 1: a Blocker that attacked cannot Block on their turn.',
    lessonId: 'L15-lethal-math',
    sources: SOURCES,
  };
  const severity: Severity = certainty === 'any-hand' ? 'severe' : 'hindsight';
  return {
    id: flagId('given-away', T - 1, c.k),
    kind: 'given-away',
    turn: T - 1,
    player: me,
    restoreIndex: c.k,
    decisionIndex: c.k,
    severity,
    certainty,
    explanation,
    did: [move],
    practice: { judge: 'survive-turn', turn: T },
  };
}

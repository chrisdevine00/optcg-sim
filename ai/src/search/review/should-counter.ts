/**
 * The `should-counter` detector (M8 WP3, explanations.md E05): "a hit that should have been
 * countered", on the turn the player lost and only there.
 *
 * At every Main state `Mi` of the attacker's winning turn (before battle 1, after battle 1, ...) the
 * exact `lethal` search runs in `actual` mode for the attacker. The flagged decision is the defender's
 * choice in battle `i`, where `Mi` is refuted (some defence held) and `Mi+1` is proven (nothing could
 * stop it any more). The game's last state, a win by damage at 0 Life, counts as proven.
 *
 * - **Stronger line**: the defender's moves along the refutation's principal variation, from `Mi`:
 *   one `Move` per battle (E05's numbered counters and take).
 * - **`any-hand`** only when the attacker's hand at `Mi` is empty and the refutation holds with
 *   `deckKnown: false` (nothing it could still draw is counted). Anything else is Hindsight: it needed
 *   their real hand. Severe when it lost the game and `any-hand`; Hindsight is never severe.
 * - A cap hit before a flag is found is a "Not fully checked" marker, never a clean turn.
 *
 * Lesson L10. Practice judge `survive-turn`. The item is the lost turn; `item.index` is at or before
 * the attacker's first Main of it.
 */
import type { Card } from '@optcg/cards';
import { queries, reduce, type Action, type GameState, type PlayerId } from '@optcg/engine';
import type { Evidence, Explanation, Move } from '../../explanation.ts';
import { figureKey } from '../../explain.ts';
import { counterValueOf } from '../../knowledge.ts';
import { lethal } from '../lethal/lethal.ts';
import { search, type Cap } from '../lethal/search.ts';
import {
  attackersOn,
  handCounter,
  listWords,
  nameOf,
  other,
  plural,
  renderDefence,
} from './defence-line.ts';
import {
  flagId,
  type Detector,
  type DetectorContext,
  type ReviewFlag,
  type ReviewItem,
  type ReviewMarker,
  type Severity,
} from './types.ts';

const SOURCES = ['CR 1-2-1-1-1', 'CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'SH-CTR', 'SH-MIS'];
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
const word = (n: number): string => WORDS[n] ?? String(n);

/**
 * Where the defender's choice in a battle sits: the first Counter or Block it made, else the point it
 * let the hit through (`endCounter`), else a Block of nobody, else its first action. Actions the app
 * took for it (`record.auto`) are never the decision.
 */
function decisionOf(
  record: DetectorContext['record'],
  from: number,
  to: number,
  defender: PlayerId,
): number {
  const mine: number[] = [];
  for (let k = from; k < to; k++)
    if (record.actions[k]!.player === defender && !record.auto.includes(k)) mine.push(k);
  const at = (pred: (a: Action) => boolean): number | undefined =>
    mine.find((k) => pred(record.actions[k]!));
  const played = at(
    (a) =>
      a.type === 'counter' ||
      (a.type === 'activate' && a.ability === 'counter') ||
      (a.type === 'block' && a.blocker !== null),
  );
  return (
    played ?? at((a) => a.type === 'endCounter') ?? at((a) => a.type === 'block') ?? mine[0] ?? from
  );
}

interface MainState {
  index: number;
  state: GameState;
}

/** The attacker's Main decisions of the turn, in order, from `from`. */
function mainsOf(
  ctx: DetectorContext,
  from: number,
  turn: number,
  attacker: PlayerId,
): MainState[] {
  const n = ctx.record.actions.length;
  const out: MainState[] = [];
  for (let i = Math.max(0, from); i < n; i++) {
    const s = ctx.stateAt(i);
    if (queries.turn(s).number > turn) break;
    const dec = queries.decision(s);
    if (queries.turn(s).number === turn && dec?.kind === 'main' && dec.player === attacker) {
      out.push({ index: i, state: s });
    }
  }
  return out;
}

const incomplete = (turn: number): ReviewMarker => ({
  turn,
  kind: 'should-counter',
  reason: 'search-incomplete',
  explanation: {
    conceptId: 'counter-or-take',
    claim: 'Their winning turn was not fully checked.',
    evidence: [{ text: 'The search for a defence stopped before it found one or ruled it out.' }],
    line: null,
    outcome: 'Unknown: no flag, and none ruled out.',
    certainty: 'search-incomplete',
    nextTime: 'Count their attackers against your Life + 1 and plan which attacks you will stop.',
    lessonId: 'L10-counter-or-take',
    sources: SOURCES,
  },
});

export interface ShouldCounterCheck {
  /** `Mi` refuted and `Mi+1` proven: the flagged battle was `i`. */
  at: number;
  certainty: 'any-hand' | 'needed-hidden-info';
  pv: Action[];
}

/**
 * The certainty of a refutation at `m`: `any-hand` only when the attacker holds no card in hand and the
 * search still refutes with its deck unknown (`deckKnown: false`). The probe reads nothing else of
 * their hidden cards.
 */
export function refutationCertainty(
  m: GameState,
  attacker: PlayerId,
  cap: Cap,
): { certainty: 'any-hand' | 'needed-hidden-info'; pv: Action[] } {
  const handEmpty = queries.zone(m, attacker, 'hand').length === 0;
  const probe = search(m, attacker, { ...cap, deckKnown: false });
  const pv = probe.status === 'refuted' ? (probe.bestAttempt?.trace ?? []) : [];
  return {
    certainty: handEmpty && probe.status === 'refuted' ? 'any-hand' : 'needed-hidden-info',
    pv,
  };
}

export const detect: Detector = (item: ReviewItem, ctx: DetectorContext) => {
  const rec = ctx.record;
  if (!rec?.actions || !ctx.stateAt) return null;
  const n = rec.actions.length;
  const end = ctx.stateAt(n);
  const result = queries.result(end);
  if (!result || !('winner' in result) || result.reason !== 'damage at 0 Life') return null;
  const attacker = result.winner;
  const me = other(attacker);
  if (rec.seats[me] !== 'human') return null;
  const turn = queries.turn(end).number;
  if (item.turn !== turn || queries.turn(end).activePlayer !== attacker) return null;

  const mains = mainsOf(ctx, item.index, turn, attacker);
  if (mains.length === 0) return null;
  const sentinel: MainState = { index: n, state: end };
  const cards = ctx.cards;
  const flags: ReviewFlag[] = [];
  let marker: ReviewMarker | undefined;

  const status = (m: MainState): 'proven' | 'refuted' | 'unknown' =>
    lethal({ mode: 'actual', state: m.state, attacker }, cards, ctx.cap).status;

  // `cur` is the status of Mi; it is `refuted` whenever the loop runs (a proven Mi ends it).
  const first = status(mains[0]!);
  if (first === 'proven') return null;
  if (first === 'unknown') marker = incomplete(turn);
  else
    for (let i = 0; i < mains.length; i++) {
      const next = i + 1 < mains.length ? mains[i + 1]! : sentinel;
      const nextStatus = i + 1 < mains.length ? status(next) : 'proven';
      if (nextStatus === 'proven') {
        flags.push(flagAt(ctx, mains[i]!, next, attacker, me, turn));
        break;
      }
      if (nextStatus === 'unknown') {
        marker = incomplete(turn);
        break;
      }
    }
  if (flags.length === 0 && !marker) return null;
  return { itemId: item.id, turn, flags, notes: [], ...(marker ? { marker } : {}) };
};

function flagAt(
  ctx: DetectorContext,
  m: MainState,
  next: MainState,
  attacker: PlayerId,
  me: PlayerId,
  turn: number,
): ReviewFlag {
  const cards = ctx.cards;
  const rec = ctx.record;
  const decisionIndex = decisionOf(rec, m.index, next.index, me);
  const { certainty, pv } = refutationCertainty(m.state, attacker, ctx.cap);

  // What you did: your choices from this battle to the end of the game.
  const did = renderDefence(m.state, rec.actions.slice(m.index), me, cards).line;
  const taken = rec.actions
    .slice(m.index, next.index)
    .some((a) => a.player === me && a.type === 'endCounter');
  const counterUsed = rec.actions
    .slice(m.index, next.index)
    .some((a) => a.player === me && (a.type === 'counter' || a.type === 'activate'));

  // The stronger line: your moves along the refutation, then how the turn ends.
  let line: Move[] | null = null;
  let survivedAt: number | null = null;
  if (pv.length > 0) {
    const r = renderDefence(m.state, pv, me, cards);
    line = r.line.length > 0 ? r.line : null;
    let s = r.end;
    const dec = queries.decision(s);
    if (!queries.result(s) && dec?.kind === 'main' && dec.player === attacker)
      s = reduce(s, { type: 'endTurn', player: attacker }).state;
    if (!queries.result(s)) survivedAt = queries.zone(s, me, 'life').length;
  }

  const explanation = explain(
    m.state,
    attacker,
    me,
    cards,
    certainty,
    line,
    survivedAt,
    taken && !counterUsed ? 'take' : counterUsed ? 'counter' : 'other',
    rec.actions.slice(m.index, next.index),
  );
  const severity: Severity = certainty === 'any-hand' ? 'severe' : 'hindsight';
  return {
    id: flagId('should-counter', turn, decisionIndex),
    kind: 'should-counter',
    turn,
    player: me,
    restoreIndex: decisionIndex,
    decisionIndex,
    severity,
    certainty,
    explanation,
    did,
    practice: { judge: 'survive-turn', turn },
  };
}

function explain(
  m: GameState,
  attacker: PlayerId,
  me: PlayerId,
  cards: ReadonlyMap<string, Card>,
  certainty: 'any-hand' | 'needed-hidden-info',
  line: Move[] | null,
  survivedAt: number | null,
  what: 'take' | 'counter' | 'other',
  group: readonly Action[],
): Explanation {
  const life = queries.zone(m, me, 'life').length;
  const myLeader = queries.zone(m, me, 'leader')[0]!;
  const defence = myLeader.power ?? 0;
  const atk = attackersOn(m, attacker)
    .map((a) => ({
      ...a,
      name: a.leader ? 'their Leader' : nameOf(cards, a.card),
      stop: a.power - defence + 1000,
    }))
    .sort((a, b) => a.power - b.power);
  const hc = handCounter(m, me, cards);
  const evidence: Evidence[] = [];

  evidence.push({
    text: `At ${life} Life you could take ${life === 1 ? 'one more hit' : `${life} more hits`} this turn, not ${word(life + 1)}: a hit at 0 Life loses.`,
    figures: { life, hitsYouCanTake: life },
  });
  const stopFig: Record<string, number> = {};
  const used = new Set<string>();
  for (const a of atk) {
    let k = figureKey(a.leader ? 'leader' : a.name);
    k = `stop${k.charAt(0).toUpperCase()}${k.slice(1)}`;
    let key = k;
    for (let j = 2; used.has(key); j++) key = k + j;
    used.add(key);
    stopFig[key] = a.stop;
  }
  evidence.push({
    text: `Their ${word(atk.length)} attacks needed ${listWords(atk.map((a) => String(a.stop)))} of counter to stop.`,
    figures: stopFig,
  });
  // How much of that your hand could cover, smallest first.
  let covered = 0;
  let sum = 0;
  for (const a of atk) {
    if (sum + a.stop > hc) break;
    sum += a.stop;
    covered++;
  }
  const biggest = atk.at(-1);
  const cover =
    covered === 0
      ? 'not enough for any of them'
      : covered === atk.length
        ? 'enough for all of them'
        : covered === atk.length - 1 && biggest
          ? `enough for the ${covered === 1 ? 'smaller attack' : `${word(covered)} smaller attacks`}, never for ${biggest.name === 'their Leader' ? 'their Leader' : biggest.name}`
          : `enough for ${covered} of them`;
  evidence.push({
    text: `Your hand held ${hc}: ${cover}.`,
    figures: { handCounter: hc },
  });

  // Taking the flagged hit: what the rest then needed, and the best a Life card could add.
  const battleAttack = group.find((a) => a.type === 'attack' && a.player === attacker);
  const first =
    what === 'take' && battleAttack?.type === 'attack'
      ? atk.find((a) => a.instance === battleAttack.attacker)
      : undefined;
  if (first && !atk.some((a) => a.doubleAttack)) {
    const rest = atk
      .filter((a) => a !== first)
      .map((a) => a.stop)
      .sort((x, y) => x - y);
    const mustStop = Math.max(0, atk.length - life);
    const needed = rest.slice(0, mustStop);
    const total = needed.reduce((t, x) => t + x, 0);
    let best = 0;
    for (const z of ['deck', 'life'] as const)
      for (const c of queries.zone(m, me, z))
        best = Math.max(best, counterValueOf(cards.get(c.card)));
    const bestPossible = hc + best;
    if (mustStop > 0)
      evidence.push({
        text:
          `Taking ${first.name === 'their Leader' ? "their Leader's" : `${first.name}'s`} hit meant ${listWords(
            atk.filter((a) => a !== first).map((a) => a.name),
          )} had to be stopped too: ${needed.join(' + ')} = ${total}. ` +
          (total > bestPossible
            ? `Your deck's biggest counter is +${best}, so no Life card could have covered it.`
            : `A Life card worth ${total - hc} would have been needed.`),
        figures: { neededAfterTaking: total, bestPossible },
      });
  }
  const theirHand = queries.zone(m, attacker, 'hand').length;
  const theirDon = queries.don(m, attacker).active;
  evidence.push(
    theirHand === 0 && theirDon === 0
      ? {
          text: 'They had no cards in hand and no active DON!!, so their hand adds nothing to these numbers.',
          figures: { opponentHand: 0, opponentActiveDon: 0 },
        }
      : theirHand === 0
        ? {
            text: `They had no cards in hand but ${theirDon} active DON!!; the line holds however they spend it.`,
            figures: { opponentHand: 0, opponentActiveDon: theirDon },
          }
        : {
            text: `They held ${plural(theirHand, 'card')} in hand, so this needed their real hand: it is hindsight, not something you could see.`,
            figures: { opponentHand: theirHand, opponentActiveDon: theirDon },
          },
  );

  return {
    conceptId: 'counter-or-take',
    claim:
      what === 'take'
        ? 'Taking that hit lost the game.'
        : what === 'counter'
          ? 'Spending those counters there lost the game.'
          : 'That defence lost the game.',
    evidence,
    line,
    outcome:
      survivedAt !== null ? `Survives the turn at ${survivedAt} Life.` : 'Survives the turn.',
    certainty,
    nextTime:
      life === 1
        ? "At 1 Life, find the attack you can't stop and save your last Life for it. Counter everything else."
        : `With ${life} Life you can take ${life} hits this turn: find the attacks you can't stop and counter the rest.`,
    lessonId: 'L10-counter-or-take',
    sources: SOURCES,
  };
}

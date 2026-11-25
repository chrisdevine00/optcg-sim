/**
 * The hint's UI state (M7 WP4, learning-ui §2.4, flows F9). Pure helpers: no engine rules here. The
 * coach worker (WP1) answers with a line and the view actions that play its first step; this
 * module only reads that answer against what the player does next:
 *
 * - which steps are done (a step ticks when the player's own action is that step);
 * - whether the player has left the line ("Board changed: ask again");
 * - which action "Do step 1" stages next, from the view's own legal list.
 *
 * Everything is in the screen player's own handles and public card ids, so nothing here can name a
 * hidden card.
 */
import type { Action, PlayerId, ProjectedView } from '@optcg/engine';
import { actionKey, type HintResult, type Move } from '@optcg/ai';

export type HintStatus = 'idle' | 'waiting' | 'thinking' | 'ready' | 'failed';

/** A card a view handle stands for, as the screen player sees it. */
export interface Seen {
  card: string | null;
  isLeader: boolean;
}

export interface HintProgress {
  /** Steps of the line completed, in order. */
  done: number;
  /** The player has done something that is not the next step: the hint no longer applies. */
  stale: boolean;
}

export interface HintState {
  status: HintStatus;
  result: HintResult | null;
  /** The turn the hint was asked in (a new turn clears it). */
  turn: number | null;
  /** The player's own view actions applied since the hint was asked. */
  taken: Action[];
  /** Names of every handle the player has acted on since (their cards are gone from the zone later). */
  seen: Record<string, Seen>;
}

export const NO_HINT: HintState = {
  status: 'idle',
  result: null,
  turn: null,
  taken: [],
  seen: {},
};

/** Every handle in a view, with its card id and whether it is a Leader (the screen player's view). */
export function seenIn(view: ProjectedView): Record<string, Seen> {
  const out: Record<string, Seen> = {};
  for (const p of ['p1', 'p2'] as PlayerId[])
    for (const [zone, list] of Object.entries(view.zones[p]))
      for (const c of list) out[c.handle] = { card: c.card, isLeader: zone === 'leader' };
  for (const c of view.looking ?? []) out[c.handle] = { card: c.card, isLeader: false };
  return out;
}

/** The Move a run of player actions amounts to: the same grouping the worker's line uses. */
export interface Taken {
  kind: Move['kind'];
  card?: string;
  target?: string;
  count?: number;
}

/**
 * The player's actions as the line's own kinds of step: a play or activation takes the picks that
 * answer it, consecutive DON!! given to one card are one step, an attack is its own. Mirrors the
 * grouping `describeActions` (ai/src/coach/explain-hint.ts) uses to build the line; a test keeps the
 * two in step.
 */
export function takenMoves(actions: readonly Action[], seen: Record<string, Seen>): Taken[] {
  const who = (h: string): Seen => seen[h] ?? { card: null, isLeader: false };
  const out: Taken[] = [];
  let counters = 0;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i]!;
    const skipPicks = () => {
      while (actions[i + 1]?.type === 'pick') i++;
    };
    switch (a.type) {
      case 'playCard': {
        const n = who(a.card);
        skipPicks();
        out.push({ kind: 'play', ...(n.card ? { card: n.card } : {}) });
        break;
      }
      case 'giveDon': {
        const n = who(a.target);
        let count = 1;
        while (
          actions[i + 1]?.type === 'giveDon' &&
          (actions[i + 1] as typeof a).target === a.target
        ) {
          count++;
          i++;
        }
        out.push({ kind: 'giveDon', count, ...(n.card ? { card: n.card } : {}) });
        break;
      }
      case 'attack': {
        const at = who(a.attacker);
        const tg = who(a.target);
        out.push({
          kind: 'attack',
          ...(at.card ? { card: at.card } : {}),
          ...(tg.card ? { target: tg.isLeader ? 'leader' : tg.card } : {}),
        });
        break;
      }
      case 'activate': {
        const n = who(a.card);
        skipPicks();
        out.push({ kind: 'activate', ...(n.card ? { card: n.card } : {}) });
        break;
      }
      case 'block': {
        const n = a.blocker ? who(a.blocker) : null;
        out.push(n ? { kind: 'block', ...(n.card ? { card: n.card } : {}) } : { kind: 'take' });
        break;
      }
      case 'counter': {
        counters++;
        const n = who(a.card);
        out.push({ kind: 'counter', ...(n.card ? { card: n.card } : {}) });
        break;
      }
      case 'endCounter':
        if (counters === 0) out.push({ kind: 'take' });
        break;
      case 'endTurn':
        out.push({ kind: 'endTurn' });
        break;
      case 'trigger':
        out.push({ kind: 'trigger' });
        break;
      // The answer to a question the step asked (a pick, an optional effect, a mulligan): part of
      // the step in progress, never a step of its own.
      default:
        break;
    }
  }
  return out;
}

const sameCard = (want: string | undefined, got: string | undefined): boolean =>
  want === undefined || got === undefined || want === got;

/** Does what the player did match the line's step? Cards compare by printed id when both are known. */
function matches(want: Move, got: Taken): boolean {
  if (want.kind !== got.kind) return false;
  if (!sameCard(want.card, got.card)) return false;
  if (want.kind === 'attack' && want.target !== undefined && got.target !== undefined)
    return want.target === got.target;
  return true;
}

/**
 * Where the player is in the line. A step is done when the player's action is that step; DON!!
 * given in several clicks finish the step when the count is reached. Anything else is a deviation:
 * the hint greys out and asks to be asked again (flows F9.3).
 */
export function progressOf(line: readonly Move[], taken: readonly Taken[]): HintProgress {
  let done = 0;
  for (let i = 0; i < taken.length; i++) {
    const got = taken[i]!;
    const want = line[done];
    if (!want || !matches(want, got)) return { done, stale: true };
    if (want.kind === 'giveDon' && want.count !== undefined) {
      const n = got.count ?? 1;
      if (n > want.count) return { done, stale: true };
      // Still giving: this is the last thing taken and the count is short.
      if (n < want.count) {
        if (i === taken.length - 1) return { done, stale: false };
        return { done, stale: true };
      }
    }
    done++;
  }
  return { done, stale: false };
}

export function progressFor(h: HintState): HintProgress {
  if (!h.result) return { done: 0, stale: false };
  return progressOf(h.result.line, takenMoves(h.taken, h.seen));
}

/**
 * The action "Do step 1" (or "Stage this") lines up next, from the hint's own actions and the legal
 * list now. The picks of one step are an unordered set (OPEN-QUESTIONS R14): the legal list offers
 * the later ones only after the first, so take whichever pick the list offers next, then the rest.
 * Null: nothing of the hint's first step is both left to do and legal now.
 */
export function nextStage(
  hint: readonly Action[],
  taken: readonly Action[],
  legal: readonly Action[],
): Action | null {
  const left = hint.slice();
  for (const t of taken) {
    const k = actionKey(t);
    const at = left.findIndex((a) => actionKey(a) === k);
    if (at >= 0) left.splice(at, 1);
  }
  const ok = new Set(legal.map(actionKey));
  for (let i = 0; i < left.length; i++) {
    const a = left[i]!;
    if (a.type !== 'pick') return ok.has(actionKey(a)) ? a : null;
    // A run of picks: any one the legal list offers.
    let j = i;
    while (left[j]?.type === 'pick') j++;
    const run = left.slice(i, j);
    return run.find((p) => ok.has(actionKey(p))) ?? null;
  }
  return null;
}

/** Is the hint's first step finished (nothing of it left to stage)? */
export function firstStepDone(hint: readonly Action[], taken: readonly Action[]): boolean {
  const left = hint.slice();
  for (const t of taken) {
    const k = actionKey(t);
    const at = left.findIndex((a) => actionKey(a) === k);
    if (at >= 0) left.splice(at, 1);
  }
  return left.length === 0;
}

/**
 * The cards (handles in `view`) one step of the line touches, found by printed id: the player's own
 * Leader and Characters (and hand, for a play) and, for an attack, their target. Public ids only.
 */
export function stepRefs(m: Move, view: ProjectedView): string[] {
  const me = view.player;
  const opp: PlayerId = me === 'p1' ? 'p2' : 'p1';
  const z = view.zones[me];
  const field = [...z.leader, ...z.characters, ...z.stage];
  const byCard = (list: ProjectedView['zones'][PlayerId]['hand'], id: string | undefined) =>
    id ? list.find((c) => c.card === id)?.handle : undefined;
  const out: (string | undefined)[] = [];
  switch (m.kind) {
    case 'play':
      out.push(byCard(z.hand, m.card));
      break;
    case 'attack': {
      out.push(byCard(field, m.card));
      const o = view.zones[opp];
      out.push(
        m.target === 'leader'
          ? o.leader[0]?.handle
          : byCard([...o.characters, ...o.leader], m.target),
      );
      break;
    }
    case 'giveDon':
    case 'activate':
      out.push(byCard(field, m.card));
      break;
    case 'block':
    case 'counter':
      out.push(byCard([...z.characters, ...z.hand], m.card));
      break;
    default:
      break;
  }
  return out.filter((h): h is string => !!h);
}

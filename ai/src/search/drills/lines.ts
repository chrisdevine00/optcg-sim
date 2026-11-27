/**
 * Candidate Main-phase lines for the DON!! drill (M9 WP3): from a state where `seat` owes a Main
 * decision, a few distinct ways to spend (or keep) the turn's DON!!, each a list of engine actions
 * ending at `endTurn`, and the DON!! ledger it leaves. The ledger is the coach's (`donLedger`), read
 * from the seat's own view of the state where the turn passes: nothing of the opponent's hidden hand,
 * deck or face-down Life is read, so every line's score is `any-hand`.
 *
 * The opponent's answers to an attack are the plain ones (no Block, no Counter, decline everything),
 * written into `actions` so a line replays with `reduce` alone.
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  project,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';
import { donLedger } from '../../coach/tempo.ts';
import { plainReply } from './play.ts';
import type { DonLine } from './types.ts';

type Cards = ReadonlyMap<string, Card>;

/** A line with the ledger it leaves (`DonLine` plus what is held on their turn). */
export interface Line extends DonLine {
  /** Active DON!! something of the seat's spends on their turn (a [Counter] Event, an effect). */
  held: number;
  kind: LineKind;
}

export type LineKind =
  'spend' | 'spend-give' | 'two-cheaper' | 'give-attack' | 'hold' | 'play-give-one';

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

/** A state and the actions that led to it. */
class Run {
  s: GameState;
  actions: Action[] = [];
  constructor(
    start: GameState,
    readonly seat: PlayerId,
    readonly cards: Cards,
  ) {
    this.s = start;
  }
  do(a: Action): void {
    this.actions.push(a);
    this.s = reduce(this.s, a).state;
  }
  /** Answer whatever is open for either seat until `seat` is on its Main again (or the game ends). */
  settle(): void {
    for (let i = 0; i < 24; i++) {
      const dec = queries.decision(this.s);
      if (!dec || queries.result(this.s)) return;
      if (dec.kind === 'main' && dec.player === this.seat) return;
      const a = plainReply(this.s, dec.player);
      if (!a) return;
      this.do(a);
    }
  }
  legal(pred: (a: Action) => boolean): Action[] {
    return legalActions(this.s).filter((a) => a.player === this.seat && pred(a));
  }
}

const costOf = (s: GameState, inst: string): number => queries.card(s, inst).cost ?? 0;

/** The Characters `seat` can play now, dearest first (ties keep the engine's order). */
function playable(r: Run): Extract<Action, { type: 'playCard' }>[] {
  const plays = r
    .legal((a) => a.type === 'playCard')
    .filter(
      (a): a is Extract<Action, { type: 'playCard' }> =>
        a.type === 'playCard' &&
        r.cards.get(queries.card(r.s, a.card).card)?.category === 'Character',
    );
  return plays
    .map((a, i) => ({ a, i, c: costOf(r.s, a.card) }))
    .sort((x, y) => y.c - x.c || x.i - y.i)
    .map((x) => x.a);
}

/** Give every active DON!! (or `n`) to `target`, one at a time. */
function give(r: Run, target: string, n = Infinity): void {
  for (let i = 0; i < n; i++) {
    const a = r.legal((x) => x.type === 'giveDon' && x.target === target)[0];
    if (!a) return;
    r.do(a);
  }
}

/** The seat's strongest attacker that can hit the opponent's Leader now. */
function topAttacker(r: Run): string | null {
  const foe = queries.zone(r.s, other(r.seat), 'leader')[0]!.instance;
  let best: { inst: string; power: number } | null = null;
  for (const a of r.legal((x) => x.type === 'attack' && x.target === foe)) {
    if (a.type !== 'attack') continue;
    const power = queries.card(r.s, a.attacker).power ?? 0;
    if (!best || power > best.power) best = { inst: a.attacker, power };
  }
  return best?.inst ?? null;
}

function attackLeader(r: Run, attacker: string): boolean {
  const foe = queries.zone(r.s, other(r.seat), 'leader')[0]!.instance;
  const a = r.legal((x) => x.type === 'attack' && x.attacker === attacker && x.target === foe)[0];
  if (!a) return false;
  r.do(a);
  r.settle();
  return true;
}

/**
 * End the turn, then let the seat's own [End of Your Turn] effects resolve: a "you may" is taken (the
 * effects the ledger cares about, such as setting DON!! active, are the player's gain), a choice takes
 * its first option. Stops when the decision passes to the opponent.
 */
function endTurn(r: Run): void {
  const a = r.legal((x) => x.type === 'endTurn')[0];
  if (!a) return;
  r.do(a);
  for (let i = 0; i < 12; i++) {
    const dec = queries.decision(r.s);
    if (!dec || dec.player !== r.seat || queries.result(r.s)) return;
    const next = r.legal((x) => x.type === 'optional' && x.accept)[0] ?? plainReply(r.s, r.seat);
    if (!next) return;
    r.do(next);
  }
}

/** The pair of plays with the dearest total that still fits `budget`. */
function pairOf(r: Run, budget: number): [string, string] | null {
  const plays = playable(r);
  let best: { x: string; y: string; total: number } | null = null;
  for (let i = 0; i < plays.length; i++)
    for (let j = i + 1; j < plays.length; j++) {
      const x = plays[i]!.card;
      const y = plays[j]!.card;
      const total = costOf(r.s, x) + costOf(r.s, y);
      if (total > budget) continue;
      if (!best || total > best.total) best = { x, y, total };
    }
  return best ? [best.x, best.y] : null;
}

function build(kind: LineKind, start: GameState, seat: PlayerId, cards: Cards): Run | null {
  const r = new Run(start, seat, cards);
  const leader = queries.zone(start, seat, 'leader')[0]!.instance;
  switch (kind) {
    case 'spend': {
      let any = false;
      for (let i = 0; i < 10; i++) {
        const p = playable(r)[0];
        if (!p) break;
        r.do(p);
        r.settle();
        any = true;
      }
      if (!any) return null;
      break;
    }
    case 'spend-give': {
      // The mixed line (M9-R7): play what can be played, then give every DON!! left to the attacker.
      let any = false;
      for (let i = 0; i < 10; i++) {
        const p = playable(r)[0];
        if (!p) break;
        r.do(p);
        r.settle();
        any = true;
      }
      const atk = topAttacker(r);
      if (!any || !atk) return null;
      const before = r.actions.length;
      give(r, atk);
      if (r.actions.length === before) return null;
      if (!attackLeader(r, atk)) return null;
      break;
    }
    case 'two-cheaper': {
      const pair = pairOf(r, queries.don(start, seat).active);
      if (!pair) return null;
      for (const inst of pair) {
        const a = r.legal((x) => x.type === 'playCard' && x.card === inst)[0];
        if (!a) return null;
        r.do(a);
        r.settle();
      }
      break;
    }
    case 'give-attack': {
      const atk = topAttacker(r);
      if (!atk) return null;
      give(r, atk);
      if (!attackLeader(r, atk)) return null;
      break;
    }
    case 'play-give-one': {
      const p = playable(r)[0];
      if (!p) return null;
      r.do(p);
      r.settle();
      give(r, leader, 1);
      if (!attackLeader(r, leader)) return null;
      break;
    }
    case 'hold':
      break;
  }
  endTurn(r);
  return r;
}

/** The order lines are offered when more than four are distinct. */
const KINDS: LineKind[] = [
  'spend',
  'spend-give',
  'give-attack',
  'hold',
  'play-give-one',
  'two-cheaper',
];

/** The most lines one item offers. */
export const MAX_LINES = 5;

/**
 * Three to five distinct Main lines from `start` (a Main decision of `seat`): spend the DON!! on the
 * dearest plays, play what can be played and give the rest to an attacker (the mixed line), spend it on
 * two cheaper plays, give it all to an attacker and attack, play one card and give 1 DON!!
 * to the Leader before its attack, or hold everything. Two lines with the same actions are one.
 */
export function candidateLines(
  start: GameState,
  seat: PlayerId,
  cards: Cards,
  exclude: readonly LineKind[] = [],
): Line[] {
  const out: Line[] = [];
  const seen = new Set<string>();
  for (const kind of KINDS) {
    if (exclude.includes(kind)) continue;
    const r = build(kind, start, seat, cards);
    if (!r) continue;
    const key = JSON.stringify(r.actions.map((a) => ({ ...a, intentId: undefined })));
    if (seen.has(key)) continue;
    seen.add(key);
    const ledger = donLedger(project(r.s, seat), cards);
    out.push({
      id: `${kind}`,
      kind,
      label: describeLine(start, r.actions, seat, cards),
      actions: r.actions,
      unused: ledger.unused,
      held: ledger.held.n,
    });
    if (out.length === MAX_LINES) break;
  }
  return out;
}

/** The ledger a line of actions leaves, read from `seat`'s own view of the state after it. */
export function ledgerAfter(
  start: GameState,
  actions: readonly Action[],
  seat: PlayerId,
  cards: Cards,
): ReturnType<typeof donLedger> {
  let s = start;
  for (const a of actions) s = reduce(s, a).state;
  return donLedger(project(s, seat), cards);
}

/**
 * A line in words, from the seat's own actions: "Play Yamato (5), give 1 DON!! to your Leader, attack".
 * No app import: these are the log's phrases written once more over card names and costs.
 */
export function describeLine(
  start: GameState,
  actions: readonly Action[],
  seat: PlayerId,
  cards: Cards,
): string {
  const parts: string[] = [];
  let s = start;
  let pendingGive: { target: string; n: number } | null = null;
  const nameOf = (inst: string): string => {
    const c = queries.card(s, inst);
    return c.zone === 'leader' ? 'your Leader' : (cards.get(c.card)?.name ?? c.card);
  };
  const flush = (): void => {
    if (!pendingGive) return;
    parts.push(`give ${pendingGive.n} DON!! to ${nameOf(pendingGive.target)}`);
    pendingGive = null;
  };
  for (const a of actions) {
    if (a.player === seat) {
      if (a.type === 'giveDon') {
        if (pendingGive && pendingGive.target === a.target) pendingGive.n++;
        else {
          flush();
          pendingGive = { target: a.target, n: 1 };
        }
      } else {
        flush();
        if (a.type === 'playCard') {
          const c = queries.card(s, a.card);
          parts.push(`play ${cards.get(c.card)?.name ?? c.card} (${c.cost ?? 0})`);
        } else if (a.type === 'attack') {
          const t = queries.card(s, a.target);
          parts.push(
            t.zone === 'leader' ? 'attack' : `attack ${cards.get(t.card)?.name ?? t.card}`,
          );
        } else if (a.type === 'activate') parts.push(`use ${nameOf(a.card)}'s effect`);
      }
    }
    s = reduce(s, a).state;
  }
  flush();
  if (parts.length === 0) return 'Do nothing and end the turn';
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

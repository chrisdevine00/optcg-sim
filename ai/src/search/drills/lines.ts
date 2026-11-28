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
import { FOCUS_LEADERS } from './positions.ts';
import type { DonLine } from './types.ts';

type Cards = ReadonlyMap<string, Card>;

/** A line with the ledger it leaves (`DonLine` plus what is held on their turn). */
export interface Line extends DonLine {
  /** Active DON!! something of the seat's spends on their turn (a [Counter] Event, an effect). */
  held: number;
  kind: LineKind;
}

export type LineKind =
  | 'spend'
  | 'spend-give'
  | 'two-cheaper'
  | 'give-attack'
  | 'hold'
  | 'play-give-one'
  | 'leader-last'
  | 'leader-first';

/** The two kinds that use the focus Leader's own [Activate: Main] (M11 Track C). */
export const LEADER_KINDS: readonly LineKind[] = ['leader-last', 'leader-first'];

const FRANKY = 'OP18-021';
const LUFFY = 'EB02-010';

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
function playable(
  r: Run,
  only: (c: Card) => boolean = () => true,
): Extract<Action, { type: 'playCard' }>[] {
  const plays = r
    .legal((a) => a.type === 'playCard')
    .filter((a): a is Extract<Action, { type: 'playCard' }> => {
      if (a.type !== 'playCard') return false;
      const c = r.cards.get(queries.card(r.s, a.card).card);
      return c?.category === 'Character' && only(c);
    });
  return plays
    .map((a, i) => ({ a, i, c: costOf(r.s, a.card) }))
    .sort((x, y) => y.c - x.c || x.i - y.i)
    .map((x) => x.a);
}

const isStrawHat = (c: Card): boolean => c.types.includes('Straw Hat Crew');

/** Play the dearest Character that fits until none does (`only` narrows which). */
function playAll(r: Run, only?: (c: Card) => boolean): boolean {
  let any = false;
  for (let i = 0; i < 10; i++) {
    const p = playable(r, only)[0];
    if (!p) break;
    r.do(p);
    r.settle();
    any = true;
  }
  return any;
}

/**
 * Use the focus Leader's [Activate: Main] and answer what it opens, as a player who knows the card
 * would: Franky returns an idle (active) DON!! and plays a Stage from hand; Luffy returns rested
 * DON!!, sets two active, and takes a "you may" that follows (Sanji & Pudding's). Null when the
 * ability is not offered or does not resolve to the end (the line is then not built).
 */
function useLeaderAbility(r: Run, leader: string): boolean {
  const id = queries.card(r.s, leader).card;
  const act = r.legal((x) => x.type === 'activate' && x.card === leader)[0];
  if (!act) return false;
  r.do(act);
  for (let i = 0; i < 12; i++) {
    const dec = queries.decision(r.s);
    if (!dec || queries.result(r.s) || dec.player !== r.seat || dec.kind === 'main') return true;
    const picks = r.legal((x) => x.type === 'pick');
    const want = (id === FRANKY ? 'costActive' : 'costRested') as string;
    const next =
      picks.find((x) => x.type === 'pick' && (x.choice as { from?: string }).from === want) ??
      picks.find((x) => x.type === 'pick' && (x.choice as { option?: string }).option === '2') ??
      picks.find((x) => x.type === 'pick' && (x.choice as { option?: string }).option === '1') ??
      r.legal((x) => x.type === 'pick')[0] ??
      r.legal((x) => x.type === 'done')[0] ??
      plainReply(r.s, r.seat);
    if (!next) return false;
    r.do(next);
  }
  return false;
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

/** Is the focus Leader's ability worth using now: offered, and (Franky) a Stage of cost 5 or less in hand; (Luffy) only Straw Hat Crew Characters out and at least two rested DON!! to return. */
function leaderReady(r: Run, leader: string, lid: string): boolean {
  if (!r.legal((x) => x.type === 'activate' && x.card === leader)[0]) return false;
  if (lid === FRANKY)
    return queries
      .zone(r.s, r.seat, 'hand')
      .some((c) => r.cards.get(c.card)?.category === 'Stage' && (c.cost ?? 99) <= 5);
  if (lid === LUFFY) {
    const chars = queries.zone(r.s, r.seat, 'characters');
    return (
      chars.length > 0 &&
      chars.every((c) => r.cards.get(c.card)?.types.includes('Straw Hat Crew')) &&
      queries.don(r.s, r.seat).rested >= 2
    );
  }
  return false;
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
    case 'leader-last': {
      // Spend first, then the Leader: Franky's DON!! -1 takes an idle DON!!, Luffy's DON!! -2 takes
      // two rested ones and sets two active, which are spent again.
      if (!FOCUS_LEADERS.includes(queries.card(start, leader).card)) return null;
      const lid = queries.card(start, leader).card;
      const only = lid === LUFFY ? isStrawHat : undefined;
      playAll(r, only);
      if (!leaderReady(r, leader, lid)) return null;
      if (!useLeaderAbility(r, leader)) return null;
      playAll(r, only);
      break;
    }
    case 'leader-first': {
      // The Leader before anything else (Franky only: Luffy's needs a Character already out).
      const lid = queries.card(start, leader).card;
      if (lid !== FRANKY || !leaderReady(r, leader, lid)) return null;
      if (!useLeaderAbility(r, leader)) return null;
      playAll(r);
      break;
    }
    case 'hold':
      break;
  }
  endTurn(r);
  return r;
}

/** A focus Leader's menu: its own ability first (the point of the item), then the usual plans. */
const FOCUS_KINDS: LineKind[] = [
  'spend',
  'leader-last',
  'leader-first',
  'give-attack',
  'spend-give',
  'hold',
  'play-give-one',
  'two-cheaper',
];

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
  /**
   * The focus pass (M11 Track C): offer a focus Leader's own ability as a line (`leader-last`,
   * `leader-first`). Off in the base walk, so no base item's menu changes.
   */
  leaderLines = false,
): Line[] {
  const out: Line[] = [];
  const seen = new Set<string>();
  const focus =
    leaderLines &&
    FOCUS_LEADERS.includes(
      queries.card(start, queries.zone(start, seat, 'leader')[0]!.instance).card,
    );
  for (const kind of focus ? FOCUS_KINDS : KINDS) {
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
        } else if (a.type === 'activate') {
          const c = queries.card(s, a.card);
          const note =
            c.card === FRANKY
              ? ' (DON!! −1: play a Stage)'
              : c.card === LUFFY
                ? ' (DON!! −2: set 2 DON!! active)'
                : '';
          parts.push(`use ${nameOf(a.card)}'s effect${note}`);
        }
      }
    }
    s = reduce(s, a).state;
  }
  flush();
  if (parts.length === 0) return 'Do nothing and end the turn';
  const text = parts.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

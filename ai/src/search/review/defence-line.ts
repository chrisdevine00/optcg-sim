/**
 * M8 WP3: shared helpers of the two search flags. `renderDefence` replays actions with `reduce` and
 * writes the defender's choices, one `Move` per battle (E05's numbered counters and take); it serves
 * "What you did" (the record's actions) and the stronger line (the refutation's principal variation).
 * Full-state engine calls are fine here: this is `ai/src/search/**`, the review's side of the line.
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  queries,
  reduce,
  type Action,
  type GameState,
  type InstanceId,
  type PlayerId,
} from '@optcg/engine';
import type { Move } from '../../explanation.ts';
import { counterValueOf } from '../../knowledge.ts';

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export const plural = (n: number, one: string, many = one + 's'): string =>
  `${n} ${n === 1 ? one : many}`;

/** The printed name of a card id (never shortened: "Ulti & Page One"). */
export const nameOf = (cards: ReadonlyMap<string, Card>, id: string): string =>
  cards.get(id)?.name ?? id;

/** "A", "A and B", "A, B and C". */
export function listWords(xs: string[]): string {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`;
}

/** Two actions are the same move (the optional `intentId` is bookkeeping). */
export function sameAction(a: Action, b: Action): boolean {
  return (
    JSON.stringify({ ...a, intentId: undefined }) === JSON.stringify({ ...b, intentId: undefined })
  );
}

/** Is `a` legal in `s` right now? */
export function isLegal(s: GameState, a: Action): boolean {
  return legalActions(s).some((x) => sameAction(x, a));
}

/** Their attackers that can hit `defender`'s Leader from this Main state, once each. */
export function attackersOn(
  s: GameState,
  attacker: PlayerId,
): { instance: InstanceId; card: string; power: number; doubleAttack: boolean; leader: boolean }[] {
  const leader = queries.zone(s, other(attacker), 'leader')[0]!.instance;
  const seen = new Set<string>();
  const out: ReturnType<typeof attackersOn> = [];
  for (const a of legalActions(s))
    if (a.type === 'attack' && a.target === leader && !seen.has(a.attacker)) {
      seen.add(a.attacker);
      const c = queries.card(s, a.attacker);
      out.push({
        instance: a.attacker,
        card: c.card,
        power: c.power ?? 0,
        doubleAttack: c.keywords.includes('Double Attack'),
        leader: c.zone === 'leader',
      });
    }
  return out;
}

/** The Counter value of every card in `p`'s hand. */
export function handCounter(s: GameState, p: PlayerId, cards: ReadonlyMap<string, Card>): number {
  const leader = queries.zone(s, p, 'leader')[0]?.card;
  return queries
    .zone(s, p, 'hand')
    .reduce((t, c) => t + counterValueOf(cards.get(c.card), leader), 0);
}

interface Battle {
  attackerCard: string;
  attackerLeader: boolean;
  attackerPower: number;
  defenderPower: number;
  lifeBefore: number;
  blocker: string | null;
  counters: string[];
}

/**
 * Replay `actions` from `root` and describe `defender`'s choice in each battle: a Block, the Counters
 * played (as the cards and the power they made), or taking the hit with the Life it cost. Only battles
 * the defender had a say in are written; a battle with nothing to decide is a take.
 */
export function renderDefence(
  root: GameState,
  actions: readonly Action[],
  defender: PlayerId,
  cards: ReadonlyMap<string, Card>,
): { line: Move[]; end: GameState } {
  const line: Move[] = [];
  let s = root;
  let cur: Battle | null = null;
  const attackerName = (b: Battle): string =>
    b.attackerLeader ? 'their Leader' : nameOf(cards, b.attackerCard);
  const flush = (after: GameState): void => {
    if (!cur) return;
    const b = cur;
    cur = null;
    const life = queries.zone(after, defender, 'life').length;
    const lost = life < b.lifeBefore || queries.result(after) !== null;
    if (b.blocker && !lost) {
      line.push({
        kind: 'block',
        text: `Block ${attackerName(b)} with ${nameOf(cards, b.blocker)}.`,
        card: b.blocker,
      });
    } else if (b.counters.length > 0 && !lost) {
      line.push({
        kind: 'counter',
        text: `Stop ${attackerName(b)} with ${listWords(b.counters.map((c) => nameOf(cards, c)))} (${b.defenderPower} against ${b.attackerPower}).`,
        card: b.counters[0],
      });
    } else if (b.lifeBefore === 0) {
      line.push({
        kind: 'take',
        text: b.counters.length
          ? `Play ${listWords(b.counters.map((c) => nameOf(cards, c)))} on ${attackerName(b)}'s attack (${b.defenderPower} against ${b.attackerPower}) and lose.`
          : `Take ${attackerName(b)}'s hit at 0 Life and lose.`,
      });
    } else {
      const spent = b.counters.length
        ? ` after ${listWords(b.counters.map((c) => nameOf(cards, c)))} (${b.defenderPower} against ${b.attackerPower})`
        : '';
      const owner = b.attackerLeader ? 'their Leader' : nameOf(cards, b.attackerCard);
      line.push({
        kind: 'take',
        text: `Take ${owner}'s hit${spent}: ${b.lifeBefore} Life → ${Math.max(0, b.lifeBefore - 1)}.`,
      });
    }
  };
  for (const a of actions) {
    if (queries.result(s)) break;
    const battle = queries.battle(s);
    if (a.type === 'attack' && a.player !== defender) {
      flush(s);
      const atk = queries.card(s, a.attacker);
      const tgt = queries.card(s, a.target);
      if (tgt.zone === 'leader' && tgt.owner === defender)
        cur = {
          attackerCard: atk.card,
          attackerLeader: atk.zone === 'leader',
          attackerPower: atk.power ?? 0,
          defenderPower: tgt.power ?? 0,
          lifeBefore: queries.zone(s, defender, 'life').length,
          blocker: null,
          counters: [],
        };
    } else if (cur && a.player === defender && battle) {
      if (a.type === 'block' && a.blocker) cur.blocker = queries.card(s, a.blocker).card;
      else if (a.type === 'counter') cur.counters.push(queries.card(s, a.card).card);
      else if (a.type === 'activate' && a.ability === 'counter')
        cur.counters.push(queries.card(s, a.card).card);
    }
    // A Counter Event's +power lands as the next decision is reached, so the power is read just
    // before each of the defender's actions: the last read is the power the battle was decided at.
    if (cur && battle && a.player === defender) {
      cur.defenderPower = queries.card(s, battle.target).power ?? cur.defenderPower;
      cur.attackerPower = queries.card(s, battle.attacker).power ?? cur.attackerPower;
    }
    s = reduce(s, a).state;
    // The battle is over once the attacker is back to a Main decision (or the game ended).
    if (cur) {
      const dec = queries.decision(s);
      if (queries.result(s) || (dec && dec.kind === 'main' && dec.player !== defender)) flush(s);
    }
  }
  flush(s);
  return { line, end: s };
}

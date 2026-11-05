/**
 * Reading a proven line back through the engine. The search returns engine actions; this turns the
 * attacker's part into steps a person can follow, and works out the numbers each step is checked
 * against (the guided count's questions, learning-ui §3.2; the figures of E20):
 *
 * - `need`: what it takes to stop the attack, attack power − target power + 1000 (CR 7-1-4-1: the
 *   attacker wins ties, so the defender needs one more step of 1000);
 * - `maxDefence`: the most power the defender can add to the battle with every answer open to it,
 *   counting a shrink of the attacker as defence, **if it kept every card so far**. The line is
 *   replayed with the defender taking each hit (no Counter, no Block), so its hand holds the
 *   cards the earlier hits gave it, which is how the example explanations count ("1 card for your
 *   first attack, 2 for the second").
 */
import type { Card } from '@optcg/cards';
import {
  legalActions,
  queries,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from '@optcg/engine';

export type LineStep =
  | { kind: 'giveDon'; ref: string; card: string; count: number; powerAfter: number }
  | {
      kind: 'attack';
      /** The attacker is the Leader. */
      leader: boolean;
      ref: string;
      card: string;
      /** The card id of a non-Leader target, or 'leader'. */
      target: string;
      /** DON!! given to the attacker for this attack. */
      don: number;
      /** The attacker's power as the attack is declared. */
      power: number;
      targetPower: number;
      need: number;
      /** The most defence the defender can add, holding every card it has by this attack. */
      maxDefence: number;
      /** Cards in the defender's hand as this attack is declared. */
      handSize: number;
      /** The defender can stop the attack with a Blocker (CR 7-1-2-1). */
      blockable: boolean;
    }
  | { kind: 'play'; ref: string; card: string }
  | { kind: 'activate'; ref: string; card: string; ability: string }
  | { kind: 'choose'; card: string | null }
  | { kind: 'use'; card: string | null };

const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

function sameAction(a: Action, b: Action): boolean {
  return (
    JSON.stringify({ ...a, intentId: undefined }) === JSON.stringify({ ...b, intentId: undefined })
  );
}

/** The defender takes the hit: no Block, no Counter, no Trigger, declines "may" effects. */
function takeIt(s: GameState): Action | null {
  const dec = queries.decision(s);
  if (!dec) return null;
  const acts = legalActions(s);
  return (
    acts.find((a) => a.type === 'block' && a.blocker === null) ??
    acts.find((a) => a.type === 'endCounter') ??
    acts.find((a) => a.type === 'trigger' && !a.activate) ??
    acts.find((a) => a.type === 'optional' && !a.accept) ??
    acts.find((a) => a.type === 'done') ??
    acts.find((a) => a.type === 'pick') ??
    null
  );
}

/**
 * The most the defender can add against the battle in progress: over every answer sequence open to
 * it until the decision leaves it or the battle ends. `attackerNow` is the attacker's power now.
 */
function maxDefence(s0: GameState, attacker: PlayerId): { value: number; blockable: boolean } {
  const b0 = queries.battle(s0)!;
  const atk0 = queries.card(s0, b0.attacker).power ?? 0;
  const tgt0 = queries.card(s0, b0.target).power ?? 0;
  let best = 0;
  let blockable = false;
  let n = 0;
  const walk = (s: GameState): void => {
    if (++n > 4000) return;
    const b = queries.battle(s);
    const dec = queries.decision(s);
    if (queries.result(s) || !b || !dec || b.attacker !== b0.attacker) return;
    if (b.blocker) {
      blockable = true;
      return;
    }
    const atk = queries.card(s, b.attacker).power ?? 0;
    const tgt = queries.card(s, b.target).power ?? 0;
    best = Math.max(best, tgt - tgt0 + (atk0 - atk));
    if (dec.player === attacker) return;
    const seen = new Set<string>();
    for (const a of legalActions(s)) {
      if (a.type === 'concede') continue;
      // Interchangeable cards are one choice.
      const key =
        a.type === 'counter' || a.type === 'activate'
          ? `${a.type}|${queries.card(s, a.card).card}|${'ability' in a ? a.ability : ''}`
          : a.type === 'pick' && typeof a.choice === 'string'
            ? `pick|${queries.card(s, a.choice).card}`
            : JSON.stringify(a);
      if (seen.has(key)) continue;
      seen.add(key);
      walk(reduce(s, a).state);
    }
  };
  walk(s0);
  return { value: best, blockable };
}

export interface Analysis {
  steps: LineStep[];
  /** The defender's Life, hand and the hits needed at the root. */
  ok: boolean;
}

/**
 * Replay `attackerActions` from `root`, the defender taking each hit, and describe each step.
 * `refOf` maps an engine id to the id the caller shows (a view handle, or the same id).
 */
export function analyseLine(
  root: GameState,
  attacker: PlayerId,
  attackerActions: Action[],
  refOf: (id: string) => string,
  cards: ReadonlyMap<string, Card>,
): Analysis {
  const defender = other(attacker);
  const steps: LineStep[] = [];
  const queue = [...attackerActions];
  let s = root;
  let pendingGive = null as { id: string; count: number } | null;
  const flushGive = (): void => {
    if (!pendingGive) return;
    const c = queries.card(s, pendingGive.id);
    steps.push({
      kind: 'giveDon',
      ref: refOf(pendingGive.id),
      card: c.card,
      count: pendingGive.count,
      powerAfter: c.power ?? 0,
    });
    pendingGive = null;
  };
  for (let guard = 0; guard < 400; guard++) {
    if (queries.result(s)) break;
    const dec = queries.decision(s);
    if (!dec) break;
    if (dec.player !== attacker) {
      const a = takeIt(s);
      if (!a) return { steps, ok: false };
      s = reduce(s, a).state;
      continue;
    }
    const next = queue.shift();
    if (!next) break;
    if (!legalActions(s).some((a) => sameAction(a, next))) return { steps, ok: false };
    if (next.type === 'giveDon') {
      if (pendingGive && pendingGive.id !== next.target) flushGive();
      pendingGive = { id: next.target, count: (pendingGive?.count ?? 0) + 1 };
      s = reduce(s, next).state;
      continue;
    }
    if (next.type === 'attack') {
      const don = pendingGive && pendingGive.id === next.attacker ? pendingGive.count : 0;
      if (pendingGive && pendingGive.id !== next.attacker) flushGive();
      const a = queries.card(s, next.attacker);
      const t = queries.card(s, next.target);
      const isLeader = t.zone === 'leader';
      const power = a.power ?? 0;
      const targetPower = t.power ?? 0;
      const afterAttack = reduce(s, next).state;
      // Settle the attacker's own on-attack choices without spending: take them as the line does.
      let probe = afterAttack;
      const rest = [...queue];
      while (
        queries.decision(probe)?.player === attacker &&
        queries.battle(probe) &&
        rest.length > 0 &&
        legalActions(probe).some((x) => sameAction(x, rest[0]!)) &&
        rest[0]!.type !== 'attack' &&
        rest[0]!.type !== 'giveDon'
      )
        probe = reduce(probe, rest.shift()!).state;
      const md = queries.battle(probe)
        ? maxDefence(probe, attacker)
        : { value: 0, blockable: false };
      pendingGive = null;
      steps.push({
        kind: 'attack',
        leader: a.zone === 'leader',
        ref: refOf(next.attacker),
        card: a.card,
        target: isLeader ? 'leader' : t.card,
        don,
        power,
        targetPower,
        need: power - targetPower + 1000,
        maxDefence: md.value,
        handSize: queries.zone(s, defender, 'hand').length,
        blockable: md.blockable,
      });
      s = afterAttack;
      continue;
    }
    flushGive();
    if (next.type === 'playCard')
      steps.push({ kind: 'play', ref: refOf(next.card), card: queries.card(s, next.card).card });
    else if (next.type === 'activate')
      steps.push({
        kind: 'activate',
        ref: refOf(next.card),
        card: queries.card(s, next.card).card,
        ability: next.ability,
      });
    else if (next.type === 'optional' && next.accept)
      steps.push({ kind: 'use', card: queries.decision(s)?.source?.card ?? null });
    else if (next.type === 'pick' && typeof next.choice === 'string')
      steps.push({ kind: 'choose', card: queries.card(s, next.choice).card });
    s = reduce(s, next).state;
  }
  flushGive();
  void cards;
  return { steps, ok: true };
}

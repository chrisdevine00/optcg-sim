/**
 * "What you did" (M8 WP1): the `did: Move[]` of a flag, built from the record. Shared by every
 * detector, so the wording is the same on every kind. Names come from the public card data; the
 * actions are the seat's own, so nothing hidden is read.
 */
import type { Card } from '@optcg/cards';
import { queries, reduce, type Action, type GameState } from '@optcg/engine';
import type { Move } from '../../explanation.ts';
import { shortName } from '../lethal/explain.ts';
import type { ReviewRecord } from './types.ts';

const nameIn = (s: GameState, cards: ReadonlyMap<string, Card>, instance: string): string => {
  const id = queries.card(s, instance).card;
  return shortName(cards.get(id)?.name ?? id);
};

/** One action as a Move, read in the state before it; null for the actions that are not a "doing". */
export function moveOf(s: GameState, a: Action, cards: ReadonlyMap<string, Card>): Move | null {
  switch (a.type) {
    case 'playCard': {
      const n = nameIn(s, cards, a.card);
      return { kind: 'play', text: `Played ${n}.`, card: queries.card(s, a.card).card };
    }
    case 'giveDon': {
      const n = nameIn(s, cards, a.target);
      return { kind: 'giveDon', text: `Gave 1 DON!! to ${n}.`, count: 1 };
    }
    case 'activate':
      return {
        kind: 'activate',
        text: `Activated ${nameIn(s, cards, a.card)}.`,
        card: queries.card(s, a.card).card,
      };
    case 'attack': {
      const t = queries.card(s, a.target);
      const target = t.zone === 'leader' ? 'their Leader' : nameIn(s, cards, a.target);
      return {
        kind: 'attack',
        text: `Attacked ${target} with ${nameIn(s, cards, a.attacker)}.`,
        card: queries.card(s, a.attacker).card,
        target: t.card,
      };
    }
    case 'counter':
      return {
        kind: 'counter',
        text: `Played ${nameIn(s, cards, a.card)} as a Counter.`,
        card: queries.card(s, a.card).card,
      };
    case 'block':
      return a.blocker
        ? { kind: 'block', text: `Blocked with ${nameIn(s, cards, a.blocker)}.` }
        : { kind: 'take', text: 'Did not block.' };
    case 'endTurn':
      return { kind: 'endTurn', text: 'Ended the turn.' };
    case 'mulligan':
      return a.redraw
        ? { kind: 'redraw', text: 'Redrew the opening hand.' }
        : { kind: 'keep', text: 'Kept the opening hand.' };
    default:
      return null;
  }
}

/** Collapse consecutive DON!! gives into "Gave N DON!!" so a long turn reads in a line. */
function merge(moves: Move[]): Move[] {
  const out: Move[] = [];
  for (const m of moves) {
    const last = out.at(-1);
    if (m.kind === 'giveDon' && last?.kind === 'giveDon') {
      const count = (last.count ?? 1) + 1;
      out[out.length - 1] = { kind: 'giveDon', text: `Gave ${count} DON!! in all.`, count };
    } else out.push(m);
  }
  return out;
}

/**
 * What `player` did from action `index` to the end of that turn (or the record): plays, DON!! gives,
 * activations, attacks and the end of the turn. Auto-skipped actions are left out.
 */
export function didInTurn(
  record: ReviewRecord,
  stateAt: (index: number) => GameState,
  index: number,
  player: Action['player'],
  cards: ReadonlyMap<string, Card>,
): Move[] {
  let s = stateAt(index);
  const turn = queries.turn(s).number;
  const out: Move[] = [];
  for (let i = index; i < record.actions.length && queries.turn(s).number === turn; i++) {
    const a = record.actions[i]!;
    if (a.player === player && !record.auto.includes(i)) {
      const m = moveOf(s, a, cards);
      if (m) out.push(m);
    }
    s = reduce(s, a).state;
  }
  return merge(out);
}

/** The Moves of the given action indexes (a flagged decision and its neighbours). */
export function didAt(
  record: ReviewRecord,
  stateAt: (index: number) => GameState,
  indexes: readonly number[],
  cards: ReadonlyMap<string, Card>,
): Move[] {
  const out: Move[] = [];
  for (const i of indexes) {
    const a = record.actions[i];
    if (!a) continue;
    const m = moveOf(stateAt(i), a, cards);
    if (m) out.push(m);
  }
  return merge(out);
}

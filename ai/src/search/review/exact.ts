/**
 * Helpers the exact detectors share (M8 WP2: `don.ts`, `counter-wasted.ts`, `mulligan.ts`): reading a
 * turn out of the record, naming a card, telling a counter from any other action, and "What you
 * did" as `Move`s. Nothing here reads the opponent's hand, deck or face-down Life.
 */
import { SCRIPTS, type Card } from '@optcg/cards';
import { queries, type Action, type GameState, type PlayerId } from '@optcg/engine';
import type { Move } from '../../explanation.ts';
import { hasCounterTiming } from '../../knowledge.ts';
import type { DetectorContext } from './types.ts';

export const otherSeat = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export const nameOf = (cards: ReadonlyMap<string, Card>, id: string): string =>
  cards.get(id)?.name ?? id;

export const turnNumber = (s: GameState): number => queries.turn(s).number;

/** The numbers 0 to 10 as words, for copy ("two ordinary counters"); larger numbers stay digits. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export const countWord = (n: number): string => WORDS[n] ?? String(n);

/** A counter played from hand: a Character's Counter, or a [Counter] Event. */
export const isCounterAction = (a: Action): boolean =>
  a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter');

/** The instance a counter action plays. */
export const counterCard = (a: Action): string | null =>
  a.type === 'counter' || (a.type === 'activate' && a.ability === 'counter') ? a.card : null;

/** True when the record applied this action by auto-skip: never a decision. */
export const isAuto = (ctx: DetectorContext, index: number): boolean =>
  ctx.record.auto.includes(index);

type Json = unknown;
const asObj = (v: Json): Record<string, Json> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Json>) : null;

/**
 * Does a counter card do nothing but add power? A Character's [Counter] is its printed number. For an
 * Event, its `counter` ability must be a flat list of plain power gains (no condition, no second
 * effect), read from the public script. An Event with no script entry is not trusted.
 */
export function counterOnlyPower(cardId: string, cards: ReadonlyMap<string, Card>): boolean {
  const card = cards.get(cardId);
  if (!card) return false;
  if (card.category !== 'Event') return true;
  const script = SCRIPTS[cardId];
  if (!script) return false;
  const abilities = (script.abilities as unknown as Record<string, Json>[]).filter((a) =>
    hasCounterTiming(a.when),
  );
  if (abilities.length === 0) return false;
  for (const ab of abilities) {
    if (!Array.isArray(ab.effect) || ab.effect.length === 0) return false;
    for (const step of ab.effect as Json[]) {
      const o = asObj(step);
      const doo = o && Object.keys(o).length === 1 ? asObj(o.do) : null;
      if (!doo || Object.keys(doo).length !== 1 || !asObj(doo.power)) return false;
      const amount = (doo.power as Record<string, Json>).amount;
      if (typeof amount !== 'number' || amount <= 0) return false;
    }
  }
  return true;
}

/** Does this Event's [Counter] cost "DON!! −1" (a DON!! returned to the DON!! deck)? */
export function counterCostsDon(cardId: string): boolean {
  const script = SCRIPTS[cardId];
  if (!script) return false;
  return (script.abilities as unknown as Record<string, Json>[]).some(
    (a) => hasCounterTiming(a.when) && JSON.stringify(a.cost ?? null).includes('donMinus'),
  );
}

/**
 * The first index of the turn that `index` is in, and the seat's first Main of it ("Study" and
 * "Play from here" open there). Walks the replay cache back, never forward past `index`.
 */
export function turnStart(
  ctx: DetectorContext,
  index: number,
  player: PlayerId,
): { start: number; firstMain: number } {
  const turn = turnNumber(ctx.stateAt(index));
  let start = index;
  while (start > 0 && turnNumber(ctx.stateAt(start - 1)) === turn) start--;
  let firstMain = start;
  for (let i = start; i <= index; i++) {
    const dec = queries.decision(ctx.stateAt(i));
    if (dec && dec.kind === 'main' && dec.player === player) {
      firstMain = i;
      break;
    }
  }
  return { start, firstMain };
}

const who = (
  cards: ReadonlyMap<string, Card>,
  s: GameState,
  inst: string,
  mine: boolean,
): string => {
  const c = queries.card(s, inst);
  return c.zone === 'leader' ? (mine ? 'Leader' : 'their Leader') : nameOf(cards, c.card);
};

/**
 * "What you did" for the actions `from..to` (inclusive) of `player`, as `Move`s: plays, DON!! given
 * (consecutive gifts to one card are one move), attacks, activations and the end of the turn.
 * Picks, answers to "you may" and other follow-ups are not moves of their own.
 */
export function didMoves(ctx: DetectorContext, from: number, to: number, player: PlayerId): Move[] {
  const out: Move[] = [];
  const cards = ctx.cards;
  for (let i = from; i <= to && i < ctx.record.actions.length; i++) {
    const a = ctx.record.actions[i]!;
    if (a.player !== player) continue;
    const s = ctx.stateAt(i);
    switch (a.type) {
      case 'playCard': {
        const c = queries.card(s, a.card);
        out.push({ kind: 'play', text: `Played ${nameOf(cards, c.card)}.`, card: c.card });
        break;
      }
      case 'giveDon': {
        const c = queries.card(s, a.target);
        const last = out.at(-1);
        if (last && last.kind === 'giveDon' && last.card === c.card && last.target === a.target) {
          last.count = (last.count ?? 1) + 1;
          last.text = `Gave ${last.count} DON!! to your ${who(cards, s, a.target, true)}.`;
        } else
          out.push({
            kind: 'giveDon',
            text: `Gave 1 DON!! to your ${who(cards, s, a.target, true)}.`,
            card: c.card,
            target: a.target,
            count: 1,
          });
        break;
      }
      case 'attack': {
        const atk = queries.card(s, a.attacker);
        const tgt = queries.card(s, a.target);
        out.push({
          kind: 'attack',
          text: `Attacked ${who(cards, s, a.target, false)} with your ${who(cards, s, a.attacker, true)}.`,
          card: atk.card,
          target: tgt.zone === 'leader' ? 'leader' : tgt.card,
        });
        break;
      }
      case 'activate': {
        if (a.ability === 'counter') break;
        const c = queries.card(s, a.card);
        out.push({ kind: 'activate', text: `Used ${nameOf(cards, c.card)}.`, card: c.card });
        break;
      }
      case 'endTurn':
        out.push({ kind: 'endTurn', text: 'Ended your turn.' });
        break;
      default:
        break;
    }
  }
  // The `giveDon` target was an instance for merging; a Move's `target` is a card id or 'leader'.
  for (const m of out) if (m.kind === 'giveDon') delete m.target;
  return out;
}

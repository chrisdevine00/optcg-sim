/**
 * The lethal drill's judge and shared helpers (M9 WP2). Board play is judged in the controller
 * (`win-this-turn`); this module judges "No lethal" and writes the answer.
 *
 * Everything here reads the player's own view and public facts: a position is put through `lethal`
 * in `public` mode (the opponent's hand, deck and face-down Life are never read, only counted), so a
 * header such as "3 cards, up to +4000 each" and the answer text are the same for every hand the
 * opponent might hold (hard rule 3; `ai/test/drills-lethal.test.ts` permutes them and compares).
 */
import type { Card } from '@optcg/cards';
import {
  createFromScenario,
  projectForSearch,
  queries,
  type Action,
  type GameState,
} from '@optcg/engine';
import type { Explanation, Move } from '../../explanation.ts';
import { explainLethal, shortName } from '../lethal/explain.ts';
import { lethal, type LethalResult } from '../lethal/lethal.ts';
import type { LethalItem, ScenarioJson } from './types.ts';

/** The node cap of every solver call a bank is built or re-checked with. */
export const LETHAL_NODES = 40_000;

export interface Classified {
  state: GameState;
  result: LethalResult;
}

/** The solver's public-mode answer to a scenario, from the player's (`p1`) view only. */
export function classify(
  scenario: ScenarioJson,
  cards: ReadonlyMap<string, Card>,
  nodes = LETHAL_NODES,
): Classified {
  const state = createFromScenario({ ...scenario, cards: (id) => cards.get(id) }).state;
  const result = lethal({ mode: 'public', view: projectForSearch(state, 'p1') }, cards, { nodes });
  return { state, result };
}

/** The same position against the full state: the real (harder) hand and Life, every answer searched. */
export function classifyActual(
  state: GameState,
  cards: ReadonlyMap<string, Card>,
  nodes = LETHAL_NODES * 5,
): LethalResult {
  return lethal({ mode: 'actual', state, attacker: 'p1' }, cards, { nodes });
}

const plural = (n: number, one: string): string => `${n} ${n === 1 ? one : one + 's'}`;

/**
 * The plan of a proven line as moves, read from the root state: every action the attacker takes, in
 * order (the plan keeps attacking when a Counter stops one, so it can be longer than a play-through
 * in which nothing is stopped), DON!! given in a row to one card as one move.
 */
export function movesOfActions(
  state: GameState,
  actions: Action[],
  cards: ReadonlyMap<string, Card>,
): Move[] {
  const name = (id: string): string => {
    const c = queries.card(state, id);
    return c.zone === 'leader' ? 'your Leader' : shortName(cards.get(c.card)?.name ?? c.card);
  };
  const out: Move[] = [];
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i]!;
    if (a.type === 'giveDon') {
      let n = 1;
      while (
        actions[i + 1]?.type === 'giveDon' &&
        (actions[i + 1] as typeof a).target === a.target
      ) {
        n++;
        i++;
      }
      out.push({
        kind: 'giveDon',
        text: `Give ${n} DON!! to ${name(a.target)}.`,
        card: queries.card(state, a.target).card,
        count: n,
      });
    } else if (a.type === 'attack') {
      const t = queries.card(state, a.target);
      out.push({
        kind: 'attack',
        text: `Attack ${t.zone === 'leader' ? 'their Leader' : name(a.target)} with ${name(a.attacker)}.`,
        card: queries.card(state, a.attacker).card,
        target: t.zone === 'leader' ? 'leader' : t.card,
      });
    } else if (a.type === 'playCard') {
      out.push({
        kind: 'play',
        text: `Play ${name(a.card)}.`,
        card: queries.card(state, a.card).card,
      });
    } else if (a.type === 'activate') {
      out.push({
        kind: 'activate',
        text: `Activate ${name(a.card)}.`,
        card: queries.card(state, a.card).card,
      });
    }
  }
  return out;
}

/** What the player sees above the board: only their own count of hits and the public facts. */
export function lethalHeader(r: LethalResult): string {
  const f = r.facts;
  const hand =
    f.handSize === 0
      ? 'no cards in their hand'
      : `${plural(f.handSize, 'card')} in their hand, up to +${f.maxPerCard} each`;
  return `${plural(f.opponentLife, 'Life card')} to take, so ${plural(f.hitsNeeded, 'hit')} to win · ${hand}`;
}

/** How the item was answered: "No lethal", or by playing the turn out (the controller's `win-this-turn`). */
export type LethalSubmission = { kind: 'no-lethal' } | { kind: 'played'; won: boolean };

export interface LethalVerdict {
  correct: boolean;
  /** The first line of the answer: "You have lethal." or "Nothing wins here." */
  headline: string;
  header: string;
  explanation: Explanation;
}

/** The first lines of the answer; `no-lethal` on an item with lethal shows the line (E01's wording). */
export function judgeLethal(
  item: LethalItem,
  submitted: LethalSubmission,
  cards: ReadonlyMap<string, Card>,
): LethalVerdict {
  const { state, result } = classify(item.scenario, cards);
  const base = explainLethal(result, cards, 'coach');
  const header = lethalHeader(result);
  if (item.answer.lethal) {
    const explanation: Explanation = {
      ...base,
      line: movesOfActions(state, item.answer.actions, cards),
    };
    return {
      correct: submitted.kind === 'played' && submitted.won,
      headline:
        submitted.kind === 'played' && submitted.won
          ? 'You found it.'
          : 'You have lethal: a line wins this turn against any hand they could hold.',
      header,
      explanation,
    };
  }
  return {
    correct: submitted.kind === 'no-lethal',
    headline: 'Nothing wins here.',
    header,
    explanation: base,
  };
}

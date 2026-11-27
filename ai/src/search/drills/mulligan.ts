/**
 * The mulligan trainer (M9 WP3, curriculum L12, explanations E10 and E11).
 *
 * Items are five-card hands drawn, by seed, from a guide's sourced lists; the answer is the guide's
 * own rule (`mulliganVerdict`, the function the Pirate AI and the review's mulligan flag share) and
 * the text is `explainMulligan`. Only a sourced guide has items (`isSourced`): the rule reads the
 * seat's own hand and its own list, so every item is `any-hand`, labelled "From the <guide> guide
 * (sourced)". Nothing here reads a game, an opponent or a hidden card.
 */
import type { Card } from '@optcg/cards';
import { seedRng, shuffle } from '@optcg/engine';
import meta from '../../../../docs/research/meta-lists.json';
import { certaintyLabel, type Explanation } from '../../explanation.ts';
import { playbookFor } from '../../playbook.ts';
import { mulliganVerdict, type MulliganVerdict } from '../mulligan.ts';
import { explainMulligan, guideName, isSourced } from '../review/mulligan.ts';
import type { ListSet } from './positions.ts';
import type { MulliganItem } from './types.ts';

export const MULLIGAN_LESSON = 'L12-mulligan';

/** Seeded hands tried per guide and seat before it keeps the one class it has. */
export const MULLIGAN_SEED_CAP = 400;

type Cards = ReadonlyMap<string, Card>;

/** The sourced lists of every archetype, from `docs/research/meta-lists.json` (public; ai/ reads it already). */
export function metaListSets(): ListSet[] {
  const file = meta as unknown as {
    archetypes: {
      id: string;
      leaderId: string;
      lists: { main: { id: string; count: number }[] }[];
    }[];
  };
  return file.archetypes.map((a) => ({
    archetypeId: a.id,
    leaderId: a.leaderId,
    lists: a.lists.map((l) => l.main.flatMap((c) => Array.from({ length: c.count }, () => c.id))),
  }));
}

/** The seed of the hand: unique per guide (by its place in `sets`), seat and draw number. */
const seedOf = (guide: number, first: boolean, k: number): number =>
  guide * 10_000 + (first ? 0 : 5_000) + k;

/** The five cards seed `seed` draws from list `list` of a guide (a seeded shuffle of its 50). */
export function handOf(lists: readonly (readonly string[])[], seed: number): string[] {
  const list = lists[seed % lists.length]!;
  return shuffle(list, seedRng(Math.imul(seed + 1, 0x9e3779b1) >>> 0))[0].slice(0, 5);
}

const handCards = (hand: readonly string[], cards: Cards): Card[] =>
  hand.map((id) => cards.get(id)).filter((c): c is Card => !!c);

/** The guide's verdict on an item's hand: the one function the AI and the review also call. */
export function verdictOf(
  item: MulliganItem,
  cards: Cards,
  lists: readonly ListSet[],
): MulliganVerdict {
  const deck = deckOf(item, lists);
  const pb = playbookFor(item.mine, deck, cards);
  return mulliganVerdict(handCards(item.hand, cards), pb.mulligan, item.first);
}

/** The list the item's hand was drawn from. */
export function deckOf(item: MulliganItem, lists: readonly ListSet[]): readonly string[] {
  const set = lists.find((l) => l.archetypeId === item.archetypeId);
  if (!set) throw new Error(`No lists for ${item.archetypeId}`);
  return set.lists[item.source.kind === 'bank' ? item.source.seed % set.lists.length : 0]!;
}

/**
 * The bank: for each sourced guide and each seat, seeded hands until one Keep and one Redraw verdict
 * exist (at most `MULLIGAN_SEED_CAP` hands; a guide missing a class keeps the one it has). Pure and
 * deterministic in `sets` and the card data; run at call time, nothing committed.
 */
export function mulliganBank(sets: readonly ListSet[], cards: Cards): MulliganItem[] {
  const items: MulliganItem[] = [];
  sets.forEach((set, g) => {
    const pb = playbookFor(set.leaderId, set.lists[0], cards);
    if (!isSourced(pb) || set.lists.length === 0) return;
    for (const first of [true, false]) {
      const found: Partial<Record<'keep' | 'redraw', MulliganItem>> = {};
      for (let k = 0; k < MULLIGAN_SEED_CAP && !(found.keep && found.redraw); k++) {
        const seed = seedOf(g, first, k);
        const hand = handOf(set.lists, seed);
        const keep = mulliganVerdict(handCards(hand, cards), pb.mulligan, first).keep;
        const cls = keep ? 'keep' : 'redraw';
        if (found[cls]) continue;
        found[cls] = {
          id: `mulligan-${set.archetypeId}-${first ? '1st' : '2nd'}-${cls}`,
          drill: 'mulligan',
          lesson: MULLIGAN_LESSON,
          source: { kind: 'bank', seed },
          mine: set.leaderId,
          theirs: null,
          first,
          certainty: 'any-hand',
          label: 'guide',
          hand,
          archetypeId: set.archetypeId,
        };
      }
      for (const cls of ['keep', 'redraw'] as const) if (found[cls]) items.push(found[cls]!);
    }
  });
  return items;
}

/** Does the player's choice agree with the guide? */
export const judgeMulligan = (
  item: MulliganItem,
  redraw: boolean,
  cards: Cards,
  lists: readonly ListSet[],
): boolean => redraw === !verdictOf(item, cards, lists).keep;

/** The answer text: E10 (keep) or E11 (redraw), the three questions and the odds of a fresh five. */
export function explainMulliganItem(
  item: MulliganItem,
  cards: Cards,
  lists: readonly ListSet[],
): Explanation {
  const ownDeck = deckOf(item, lists);
  const pb = playbookFor(item.mine, ownDeck, cards);
  return explainMulligan({
    hand: handCards(item.hand, cards),
    ownDeck,
    pb,
    first: item.first,
    cards,
  });
}

/** "From the Rocks guide (sourced)": the item's certainty label. */
export function mulliganLabel(item: MulliganItem, cards: Cards): string {
  return certaintyLabel('any-hand', 'guide', guideName(playbookFor(item.mine, undefined, cards)));
}

/** The sourced guides' leaders in `sets`, and those with no sourced mulligan rule (the start screen's note). */
export function mulliganCoverage(
  sets: readonly ListSet[],
  cards: Cards,
): { sourced: string[]; unsourced: string[] } {
  const sourced: string[] = [];
  const unsourced: string[] = [];
  for (const s of sets)
    (isSourced(playbookFor(s.leaderId, s.lists[0], cards)) ? sourced : unsourced).push(
      s.archetypeId,
    );
  return { sourced, unsourced };
}

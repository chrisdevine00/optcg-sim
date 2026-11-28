/**
 * The mulligan trainer (M9 WP3, curriculum L12, explanations E10 and E11).
 *
 * Items are five-card hands drawn, by seed, from a guide's sourced lists; the answer is the guide's
 * own rule (`mulliganVerdict`, the function the Pirate AI and the review's mulligan flag share) and
 * the text is `explainMulligan`. A guide has items when its rule is sourced (`isSourced`) or is our
 * reasoning with no written source (`isOurReasoning`: EB02-010, OP18-021). The rule reads the
 * seat's own hand and its own list, so every item is `any-hand`, labelled "From the <guide> guide
 * (sourced)" or "(our reasoning, no written source)". Nothing here reads a game, an opponent or a hidden card.
 */
import type { Card } from '@optcg/cards';
import { ENGINE_VERSION, seedRng, shuffle } from '@optcg/engine';
import meta from '../../../../docs/research/meta-lists.json';
import { certaintyLabel, type Explanation } from '../../explanation.ts';
import { playbookFor } from '../../playbook.ts';
import { mulliganVerdict, type MulliganVerdict } from '../mulligan.ts';
import {
  explainMulligan,
  guideName,
  isInference,
  isOurReasoning,
  isSourced,
} from '../review/mulligan.ts';
import { DRILL_SCRIPTS_VERSION, FOCUS_LEADERS, FOCUS_MIN, type ListSet } from './positions.ts';
import type { DrillBank, MulliganItem } from './types.ts';

export const MULLIGAN_LESSON = 'L12-mulligan';

/** Seeded hands tried per guide and seat before it keeps the one class it has. */
export const MULLIGAN_SEED_CAP = 400;

/**
 * Focus Leaders' extra pass (M11 Track C): per seat and class, up to this many hands in all (the
 * first is the base item above), found in the next `FOCUS_SEED_CAP` seeds of the same walk.
 */
export const FOCUS_PER_CLASS = 3;
export const FOCUS_SEED_CAP = 2_000;

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
  return mulliganVerdict(handCards(item.hand, cards), pb.mulligan, item.first, item.mine);
}

/** The list the item's hand was drawn from. */
export function deckOf(item: MulliganItem, lists: readonly ListSet[]): readonly string[] {
  if (item.deck) return item.deck;
  const set = lists.find((l) => l.archetypeId === item.archetypeId);
  if (!set) throw new Error(`No lists for ${item.archetypeId}`);
  return set.lists[item.source.kind === 'bank' ? item.source.seed % set.lists.length : 0]!;
}

/**
 * The bank: for each sourced guide and each seat, seeded hands until one Keep and one Redraw verdict
 * exist (at most `MULLIGAN_SEED_CAP` hands; a guide missing a class keeps the one it has). Pure and
 * deterministic in `sets` and the card data; run at call time, nothing committed.
 */
export function mulliganBank(
  sets: readonly ListSet[],
  cards: Cards,
  focus: readonly string[] = FOCUS_LEADERS,
): MulliganItem[] {
  const items: MulliganItem[] = [];
  const extra: MulliganItem[] = [];
  sets.forEach((set, g) => {
    const pb = playbookFor(set.leaderId, set.lists[0], cards);
    if (!(isSourced(pb) || isOurReasoning(pb)) || set.lists.length === 0) return;
    for (const first of [true, false]) {
      const found: Partial<Record<'keep' | 'redraw', MulliganItem>> = {};
      for (let k = 0; k < MULLIGAN_SEED_CAP && !(found.keep && found.redraw); k++) {
        const seed = seedOf(g, first, k);
        const hand = handOf(set.lists, seed);
        const keep = mulliganVerdict(handCards(hand, cards), pb.mulligan, first, set.leaderId).keep;
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
          deck: [...set.lists[seed % set.lists.length]!],
        };
      }
      for (const cls of ['keep', 'redraw'] as const) if (found[cls]) items.push(found[cls]!);
      if (!focus.includes(set.leaderId)) continue;
      // A focus Leader's own pass: more distinct hands of each class, after the base walk, so no
      // base item or its id moves (the extras come last and carry a number: `-1st-2-keep`).
      const seen = new Set<string>(
        (['keep', 'redraw'] as const).flatMap((c) =>
          found[c] ? [[...found[c]!.hand].sort().join()] : [],
        ),
      );
      const have = { keep: found.keep ? 1 : 0, redraw: found.redraw ? 1 : 0 };
      for (
        let k = MULLIGAN_SEED_CAP;
        k < MULLIGAN_SEED_CAP + FOCUS_SEED_CAP &&
        (have.keep < FOCUS_PER_CLASS || have.redraw < FOCUS_PER_CLASS);
        k++
      ) {
        const seed = seedOf(g, first, k);
        const hand = handOf(set.lists, seed);
        const cls = mulliganVerdict(handCards(hand, cards), pb.mulligan, first, set.leaderId).keep
          ? 'keep'
          : 'redraw';
        const key = [...hand].sort().join();
        if (have[cls] >= FOCUS_PER_CLASS || seen.has(key)) continue;
        seen.add(key);
        have[cls]++;
        extra.push({
          id: `mulligan-${set.archetypeId}-${first ? '1st' : '2nd'}-${have[cls]}-${cls}`,
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
          deck: [...set.lists[seed % set.lists.length]!],
        });
      }
    }
  });
  return [...items, ...extra];
}

/** The generator `scripts/drill-bank.ts` registers: the bank on the pinned lists, committed like the others. */
export function generateMulliganBank(
  cards: Cards,
  opts: { log?: (line: string) => void } = {},
): DrillBank & { counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  const items = mulliganBank(metaListSets(), cards);
  for (const l of FOCUS_LEADERS) {
    const n = items.filter((i) => i.mine === l).length;
    if (n < FOCUS_MIN) opts.log?.(`focus ${l}: only ${n} of ${FOCUS_MIN} mulligan items`);
  }
  for (const i of items) {
    const k = i.id.endsWith('-keep') ? 'keep' : 'redraw';
    counts[k] = (counts[k] ?? 0) + 1;
    opts.log?.(`${i.id}: ${k}`);
  }
  return {
    drill: 'mulligan',
    builtWith: { engine: ENGINE_VERSION, scripts: DRILL_SCRIPTS_VERSION },
    items,
    counts,
  };
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

/** "From the Rocks guide (sourced baseline, inference)" or "(sourced)": the item's certainty label. */
export function mulliganLabel(item: MulliganItem, cards: Cards): string {
  const pb = playbookFor(item.mine, undefined, cards);
  return certaintyLabel(
    'any-hand',
    'guide',
    guideName(pb),
    isOurReasoning(pb) ? 'reasoning' : isInference(pb) ? 'inference' : 'sourced',
  );
}

/**
 * The guides' archetypes in `sets` by what their mulligan rule rests on: a handbook entry (`sourced`),
 * our reasoning with no written source (`ourReasoning`: offered, labelled as ours), or no rule the
 * trainer teaches (`unsourced`; the start screen's note).
 */
export function mulliganCoverage(
  sets: readonly ListSet[],
  cards: Cards,
): { sourced: string[]; ourReasoning: string[]; unsourced: string[] } {
  const out = { sourced: [] as string[], ourReasoning: [] as string[], unsourced: [] as string[] };
  for (const s of sets) {
    const pb = playbookFor(s.leaderId, s.lists[0], cards);
    (isSourced(pb) ? out.sourced : isOurReasoning(pb) ? out.ourReasoning : out.unsourced).push(
      s.archetypeId,
    );
  }
  return out;
}

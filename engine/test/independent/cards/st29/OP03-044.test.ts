/**
 * OP03-044 Kaya (Character, Blue, cost 1, 0 power, Counter +2000, {East Blue}).
 *
 * Card text: "[On Play] Draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: [On Play] (CR 10-2-2) resolves in text order: draw 2 first, then trash exactly 2 cards from
 * the hand (no "up to"), so the drawn cards are candidates. With nothing else in hand the 2 drawn
 * cards are the 2 that must be trashed.
 */
import { describe, expect, it } from 'vitest';
import {
  C29,
  canFinish,
  choices,
  deck,
  fill,
  hand,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  pickRaw,
  playRaw,
  reachablePickSets,
  trash,
} from './kit-st29a.ts';

const ID = 'OP03-044';

/** All unordered pairs of `cards`, as the sorted 'a+b' keys `reachablePickSets` returns. */
function pairs(cards: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < cards.length; i++)
    for (let j = i + 1; j < cards.length; j++) out.push([cards[i], cards[j]].sort().join('+'));
  return out.sort();
}
const D1 = C29.c4; // top of the deck
const D2 = C29.c5; // second card

/** p1's Main Phase with Kaya and these other cards in hand; the deck starts D1, D2, then Mohji. */
function main(others: string[]) {
  return mine(L29.croc, { hand: [ID, ...others], deck: [D1, D2, ...fill(C29.c1, 13)] });
}

describe('OP03-044 Kaya [On Play]: draw 2 cards and trash 2 cards from your hand', () => {
  it('printed values: cost 1, 0 power, Counter +2000', () => {
    const g = main([]);
    const k = inst(g, 'p1', 'hand', ID);
    expect(g.card(k).cost).toBe(1);
    expect(g.power(k)).toBe(0);
    expect(g.card(k).counter).toBe(2000);
  });

  it('draws the top 2 cards first and then asks for 2 cards to trash from the enlarged hand', () => {
    const g = main([C29.c2, C29.c3]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(13);
    // Every pair of the 4 cards in hand (the 2 old and the 2 drawn) is a possible selection.
    expect([...reachablePickSets(g)].filter((k) => k.includes('+')).sort()).toEqual(
      pairs([C29.c2, C29.c3, D1, D2]),
    );
  });

  it('trashing two of my own cards leaves hand size unchanged overall (+2 drawn, -2 trashed)', () => {
    const g = main([C29.c2, C29.c3]);
    playRaw(g, ID);
    pickRaw(g, [inst(g, 'p1', 'hand', C29.c2), inst(g, 'p1', 'hand', C29.c3)]);
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toEqual([C29.c2, C29.c3].sort());
    expect(isMain(g, 'p1')).toBe(true);
    expect(ids29(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the drawn cards may be trashed: trash one drawn and one old card', () => {
    const g = main([C29.c2, C29.c3]);
    playRaw(g, ID);
    pickRaw(g, [inst(g, 'p1', 'hand', D1), inst(g, 'p1', 'hand', C29.c3)]);
    expect(hand(g)).toEqual([C29.c2, D2].sort());
    expect(trash(g)).toEqual([D1, C29.c3].sort());
  });

  it('exactly 2: after one pick the decision is still open and cannot be ended early', () => {
    const g = main([C29.c2, C29.c3]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    pickRaw(g, [inst(g, 'p1', 'hand', C29.c3)]);
    expect(kind(g)).toBe('choose');
    expect(canFinish(g)).toBe(false);
    expect(choices(g).length).toBeGreaterThan(0);
  });

  it('with no other card in hand the 2 drawn cards are the ones trashed (forced), leaving an empty hand', () => {
    const g = main([]);
    playRaw(g, ID);
    // The only 2 candidates are the drawn cards: the engine either asks or resolves it itself.
    if (kind(g) === 'choose') {
      pickRaw(g, [inst(g, 'p1', 'hand', D1), inst(g, 'p1', 'hand', D2)]);
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([D1, D2].sort());
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('with exactly one other card in hand there are 3 cards to choose 2 from', () => {
    const g = main([C29.c2]);
    playRaw(g, ID);
    need(g, 'choose', 'p1');
    expect([...reachablePickSets(g)].filter((k) => k.includes('+')).sort()).toEqual(
      pairs([C29.c2, D1, D2]),
    );
    pickRaw(g, [inst(g, 'p1', 'hand', C29.c2), inst(g, 'p1', 'hand', D1)]);
    expect(hand(g)).toEqual([D2]);
  });

  it('only my own hand is touched: the opponent hand and trash are unchanged', () => {
    const g = mine(
      L29.croc,
      { hand: [ID, C29.c2], deck: [D1, D2, ...fill(C29.c1, 13)] },
      { hand: [C29.c3] },
    );
    playRaw(g, ID);
    pickRaw(g, [inst(g, 'p1', 'hand', C29.c2), inst(g, 'p1', 'hand', D1)]);
    expect(hand(g, 'p2')).toEqual([C29.c3]);
    expect(trash(g, 'p2')).toEqual([]);
  });
});

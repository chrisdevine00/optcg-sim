/**
 * OP17-047 Shiki (Character, Blue, cost 9, 10000, no Counter, {FILM}/{Impel Down}/{Golden Lion Pirates}).
 *
 * Card text: "[End of Your Turn] If you have 2 or less cards in your hand, your opponent places 1 card
 * from their hand at the bottom of their deck."
 *
 * Rules: CR 6-6-1-1 ([End of Your Turn] runs once in the End Phase), CR 8-3-3 (text after a failed
 * "if" does not resolve), CR 8-4-4 (the opponent chooses their own card), CR 3-1-7/3-1-8 (cards
 * entering the deck bottom).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  act,
  BLUE,
  choices,
  deck,
  fill,
  hand,
  kind,
  LD,
  mine,
  need,
  offeredIds,
  pickCards,
  SCN,
  trash,
  decision,
} from './kit-op17b.ts';

const SHIKI = 'OP17-047';
const P2HAND = [SCN.c2, SCN.c3, SCN.c4];

/** p2's hand without the card p2 drew in the Draw Phase of the turn that follows (P-015 from the filler deck). */
function held(g: TestGame): string[] {
  const h = hand(g, 'p2');
  const i = h.indexOf('P-015');
  if (i >= 0) h.splice(i, 1);
  return h;
}

function endWith(myHand: number, p2Hand: string[] = P2HAND, shikis = 1) {
  const g = mine(
    LD.rocks,
    { characters: fill(SHIKI, shikis), hand: fill(BLUE, myHand) },
    { hand: p2Hand },
  );
  act(g, { type: 'endTurn' });
  return g;
}

describe('OP17-047 Shiki: [End of Your Turn] with 2 or less cards in hand, the opponent bottoms 1 card from their hand', () => {
  it('with 2 cards in hand (boundary), the OPPONENT chooses 1 of their own cards and it goes to the bottom of their deck', () => {
    const g = endWith(2);
    need(g, 'choose', 'p2');
    expect(offeredIds(g)).toEqual([...P2HAND].sort());
    pickCards(g, [SCN.c3]);
    expect(held(g)).toEqual([SCN.c2, SCN.c4].sort());
    expect(deck(g, 'p2').at(-1)).toBe(SCN.c3);
    expect(deck(g, 'p2')).toHaveLength(15); // 15 + the placed card - the Draw Phase card
  });

  it('with 3 cards in hand (boundary) nothing happens: no prompt, the opponent keeps their hand', () => {
    const g = endWith(3);
    expect(kind(g)).toBe('main');
    expect(decision(g)?.player).toBe('p2');
    expect(held(g)).toEqual([...P2HAND].sort());
  });

  it('with 0 cards in hand the condition holds as well', () => {
    const g = endWith(0);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c2]);
    expect(held(g)).toHaveLength(2);
  });

  it('exactly 1 card is placed, not more, and the chooser cannot pick zero', () => {
    const g = endWith(1);
    need(g, 'choose', 'p2');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pickCards(g, [SCN.c4]);
    expect(held(g)).toHaveLength(2);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the card is placed at the bottom of the deck, not trashed, and the top of the deck is unchanged', () => {
    const g = endWith(2);
    pickCards(g, [SCN.c2]);
    expect(trash(g, 'p2')).toEqual([]);
    expect(deck(g, 'p2').at(-1)).toBe(SCN.c2);
  });

  it('an opponent with exactly 1 card in hand must place it (forced); with an empty hand nothing happens', () => {
    const g = endWith(1, [SCN.c5]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(1);
      pickCards(g, [SCN.c5]);
    }
    expect(held(g)).toEqual([]);
    expect(deck(g, 'p2').at(-1)).toBe(SCN.c5);
    const e = endWith(1, []);
    if (kind(e) === 'choose') expect(choices(e)).toHaveLength(0);
  });

  it('two Shikis trigger separately: the opponent places 2 cards', () => {
    const g = endWith(2, P2HAND, 2);
    need(g, 'order', 'p1'); // two simultaneous [End of Your Turn]: the turn player orders them
    g.act(g.legal().find((a) => a.type === 'order')!);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c2]);
    need(g, 'choose', 'p2');
    pickCards(g, [SCN.c3]);
    expect(held(g)).toEqual([SCN.c4]);
  });

  it("only on my own End Phase: at the end of the opponent's turn nothing happens", () => {
    const g = endWith(3);
    expect(decision(g)?.player).toBe('p2');
    act(g, { type: 'endTurn' });
    expect(held(g).length).toBeGreaterThanOrEqual(3);
    expect(kind(g)).toBe('main');
  });

  it("is Shiki's own effect: with no Shiki on my field my End Phase asks nothing", () => {
    const g = mine(LD.rocks, { hand: [] }, { hand: P2HAND });
    act(g, { type: 'endTurn' });
    expect(kind(g)).toBe('main');
    expect(held(g)).toEqual([...P2HAND].sort());
  });
});

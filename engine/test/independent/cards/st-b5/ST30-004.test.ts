/**
 * ST30-004 Emporio.Ivankov (Character, Red, cost 1, 2000, Counter +1000, {Revolutionary Army}/{Impel Down}).
 *
 * Card text: "[On Play] You may reveal 2 Character cards with 6000 power from your hand: Draw 3 cards
 * and trash 2 cards from your hand."
 *
 * Rules: "6000 power" is exactly 6000 (RL-49), revealing leaves the cards in hand (CR 11-2-1), a cost
 * that cannot be paid in full cannot be paid (CR 8-3-1-3), "may" cost: skipping it means the effect
 * does not activate (CR 8-3-1-4) but the card is still played (RD 112), trash 2 is exact and chosen
 * by the owner from the whole hand.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  choices,
  deck,
  don,
  hand,
  need,
  no,
  offeredIds,
  mine,
  payHand,
  pickCards,
  playCardRaw,
  revealedByEffects,
  SL,
  trash,
  unusable,
  yes,
  act,
} from './kit-stb5a.ts';

const ID = 'ST30-004';
const HAJ = 'OP01-018'; // Red, 6000
const JIL = 'OP03-006'; // Red, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const D1 = 'OP02-060';
const DECK = ['OP01-010', 'OP01-012', 'OP01-043', ...Array(10).fill(D1)];

function start(inHand: string[], deckCards: string[] = DECK) {
  const g = mine(SL.luffy, { hand: [ID, ...inHand], deck: deckCards });
  playCardRaw(g, ID);
  return g;
}

describe('ST30-004 Emporio.Ivankov: [On Play] you may reveal 2 Characters with 6000 power: draw 3, trash 2', () => {
  it('offers exactly the Characters with exactly 6000 power as the reveal cost', () => {
    const g = start([HAJ, JIL, KING, MARCO]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    let seen = offeredIds(g);
    act(g, { type: 'pick', choice: choices(g)[0]! });
    seen = [...seen, ...offeredIds(g)];
    expect([...new Set(seen)].sort()).toEqual([HAJ, JIL].sort());
  });

  it('with only one 6000-power Character in hand the cost cannot be paid', () => {
    const g = start([HAJ, KING, MARCO]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([HAJ, KING, MARCO].sort());
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = start([]);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('declining the "you may" reveals, draws and trashes nothing, and Ivankov is still played', () => {
    const g = start([HAJ, JIL]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(hand(g)).toEqual([HAJ, JIL].sort());
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(revealedByEffects(g)).toEqual([]);
  });

  it('paying reveals the two cards (they stay in hand), draws 3 and then trashes 2 cards of the hand', () => {
    const g = start([HAJ, JIL, KING]);
    yes(g, 'p1');
    payHand(g, [HAJ, JIL]);
    expect(revealedByEffects(g).sort()).toEqual([HAJ, JIL].sort());
    // Hand now: HAJ, JIL, KING + 3 drawn = 6; trash exactly 2 chosen by the owner.
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(6);
    pickCards(g, [KING, 'OP01-010']);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(4);
    expect(trash(g)).toEqual([KING, 'OP01-010'].sort());
    expect(hand(g)).toEqual([HAJ, JIL, 'OP01-012', 'OP01-043'].sort());
    expect(deck(g)).toHaveLength(DECK.length - 3);
  });

  it('the cards drawn are from the top of the deck, in order, and are not revealed', () => {
    const g = start([HAJ, JIL]);
    yes(g, 'p1');
    payHand(g, [HAJ, JIL]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([HAJ, JIL, 'OP01-010', 'OP01-012', 'OP01-043'].sort());
    expect(revealedByEffects(g).sort()).toEqual([HAJ, JIL].sort());
  });

  it('the revealed 6000-power cards may themselves be trashed by the trash-2 step', () => {
    const g = start([HAJ, JIL]);
    yes(g, 'p1');
    payHand(g, [HAJ, JIL]);
    pickCards(g, [HAJ, JIL]);
    expect(trash(g)).toEqual([HAJ, JIL].sort());
    expect(hand(g)).toEqual(['OP01-010', 'OP01-012', 'OP01-043'].sort());
  });

  it('two copies of the same 6000-power Character pay the cost', () => {
    const g = start([HAJ, HAJ]);
    yes(g, 'p1');
    payHand(g, [HAJ, HAJ]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(5);
  });

  it('another Ivankov (2000 power) in hand is not a candidate', () => {
    const g = start([HAJ, JIL, ID]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(ID);
  });

  it('the trash is exactly 2 cards: the effect needs two hand cards to trash and takes exactly two', () => {
    const g = start([HAJ, JIL]);
    yes(g, 'p1');
    payHand(g, [HAJ, JIL]);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
  });

  it('costs 1 DON!! to play regardless of the effect', () => {
    const g = start([HAJ, JIL]);
    no(g, 'p1');
    expect(don(g).rested).toBe(1);
    expect(deck(g)).toHaveLength(DECK.length);
    expect(BLUE).toBe(D1);
  });
});

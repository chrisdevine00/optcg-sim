/**
 * OP09-092 Marshall.D.Teach (Character, Black, cost 3, 4000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[Activate: Main] You may rest this Character: If the number of cards in your hand is at
 * least 3 less than the number in your opponent's hand, draw 2 cards and trash 1 card from your
 * hand."
 *
 * Rules: hand sizes are public (CR 3-1-4). The "If" is after the cost colon, so the rest cost is
 * paid first and the check follows; the condition is read when the effect resolves (before the
 * draw). "Draw 2 and trash 1" are one instruction chain: the trash is of any card in hand, the new
 * cards included.
 */
import { describe, expect, it } from 'vitest';
import {
  abil,
  actRaw,
  atMain,
  chr,
  choices,
  deck,
  hand,
  kind,
  LD9,
  mine,
  need,
  offeredIds,
  pickCards,
  SC9,
  trash,
} from './kit-op09c.ts';

const TEACH = 'OP09-092';
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5];
const P2 = [SC9.c1, SC9.c2, SC9.c3, SC9.c4, SC9.c5, SC9.c6, SC9.c7];

function board(mineHand: string[], p2hand: string[], leader: string = LD9.luffy) {
  return mine(leader, { characters: [TEACH], hand: mineHand, deck: DECK }, { hand: p2hand });
}

/** Activate; if a trash pick is then pending, trash `drop`. */
function use(g: ReturnType<typeof board>, drop?: string) {
  actRaw(g, chr(g, 'p1', TEACH));
  if (kind(g) === 'choose' && drop) pickCards(g, [drop]);
}

describe("OP09-092 Marshall.D.Teach: [Activate: Main] rest: if my hand is 3+ smaller than the opponent's, draw 2, trash 1", () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = board([], []);
    const c = g.card(chr(g, 'p1', TEACH));
    expect(c.cost).toBe(3);
    expect(c.power).toBe(4000);
    expect(c.counter).toBe(1000);
  });

  it('boundary: hand 2 versus opponent 5 (exactly 3 less): draw 2, trash 1 of my hand', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    use(g, SC9.c1);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC9.c2, SC9.c8, SC9.c7].sort());
    expect(trash(g)).toEqual([SC9.c1]);
    expect(deck(g)).toHaveLength(DECK.length - 2);
  });

  it('the cards drawn are the top 2 of my deck', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    use(g, SC9.c2);
    expect(hand(g)).toContain(SC9.c8);
    expect(hand(g)).toContain(SC9.c7);
    expect(deck(g)[0]).toBe(SC9.c6);
  });

  it('boundary: hand 2 versus opponent 4 (only 2 less): nothing is drawn or trashed, but the rest cost is paid', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 4));
    expect(abil(g, chr(g, 'p1', TEACH))).toHaveLength(1);
    use(g, SC9.c1);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC9.c1, SC9.c2].sort());
    expect(trash(g)).toEqual([]);
    expect(g.card(chr(g, 'p1', TEACH)).rested).toBe(true);
  });

  it('with an empty hand against 3 cards (0 is 3 less) it works', () => {
    const g = board([], P2.slice(0, 3));
    use(g);
    // The hand now holds exactly the 2 drawn cards; one must be trashed.
    if (kind(g) === 'choose') pickCards(g, [SC9.c8]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(1);
    expect(trash(g)).toHaveLength(1);
  });

  it('a larger gap also works: hand 1 versus opponent 7', () => {
    const g = board([SC9.c1], P2);
    use(g, SC9.c1);
    expect(hand(g)).toHaveLength(2);
    expect(trash(g)).toEqual([SC9.c1]);
  });

  it("a hand that is larger than the opponent's does not qualify", () => {
    const g = board([SC9.c1, SC9.c2, SC9.c3, SC9.c4], P2.slice(0, 2));
    use(g, SC9.c1);
    expect(hand(g)).toHaveLength(4);
    expect(trash(g)).toEqual([]);
  });

  it('the trash is of 1 card from my hand and is mandatory: the offered cards are my hand including the two new cards', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    actRaw(g, chr(g, 'p1', TEACH));
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    expect(offeredIds(g)).toEqual([SC9.c1, SC9.c2, SC9.c8, SC9.c7].sort());
  });

  it('one of the freshly drawn cards may be the one trashed', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    use(g, SC9.c8);
    expect(trash(g)).toEqual([SC9.c8]);
    expect(hand(g)).toEqual([SC9.c1, SC9.c2, SC9.c7].sort());
  });

  it('exactly 1 card is trashed and exactly 2 are drawn (net hand +1)', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    use(g, SC9.c1);
    expect(hand(g)).toHaveLength(3);
    expect(trash(g)).toHaveLength(1);
  });

  it("the opponent's hand is not changed", () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    use(g, SC9.c1);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('works with any Leader (no Leader condition): a {Blackbeard Pirates} Leader behaves the same', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5), LD9.bbp);
    use(g, SC9.c1);
    expect(hand(g)).toHaveLength(3);
  });

  it('rests Teach: not offered again, and not offered while already rested', () => {
    const g = board([SC9.c1, SC9.c2], P2.slice(0, 5));
    use(g, SC9.c1);
    expect(g.card(chr(g, 'p1', TEACH)).rested).toBe(true);
    expect(abil(g, chr(g, 'p1', TEACH))).toEqual([]);
    const h = mine(LD9.luffy, { characters: [{ card: TEACH, rested: true }] }, {});
    expect(abil(h, chr(h, 'p1', TEACH))).toEqual([]);
    expect(choices(g)).toEqual([]);
  });
});

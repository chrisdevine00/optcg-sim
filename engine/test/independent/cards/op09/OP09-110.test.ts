/**
 * OP09-110 Pierre (Character, Yellow, cost 2, 2000, Counter +1000, {Animal}/{Sky Island}, Strike).
 *
 * Card text: "[On Play] Draw 2 cards and trash 2 cards from your hand.
 * [Trigger] Play this card."
 *
 * Rules: "Draw 2 and trash 2" is one chain: the trash is of any 2 cards in hand, the drawn cards
 * included. A [Trigger] play costs nothing and the played card's [On Play] then fires.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  atMain,
  chr,
  deck,
  hand,
  kind,
  mine,
  LD9,
  need,
  offeredIds,
  onField,
  pickCards,
  playRaw,
  SC9,
  trash,
  triggerGame,
} from './kit-op09c.ts';

const PIERRE = 'OP09-110';
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5];

function viaPlay(handCards: string[] = [SC9.c1]) {
  const g = mine(LD9.luffy, { hand: [PIERRE, ...handCards], deck: DECK }, {});
  playRaw(g, PIERRE);
  return g;
}

describe('OP09-110 Pierre: [On Play] draw 2, trash 2; [Trigger] play this card', () => {
  it('printed values: cost 2, 2000, Counter +1000', () => {
    const g = viaPlay();
    const c = g.card(chr(g, 'p1', PIERRE));
    expect(c.cost).toBe(2);
    expect(c.power).toBe(2000);
    expect(c.counter).toBe(1000);
  });

  it('[On Play] draws 2 cards (the top 2 of my deck), then I trash 2 cards from my hand', () => {
    const g = viaPlay([SC9.c1, SC9.c2]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC9.c8, SC9.c7].sort());
    expect(trash(g)).toEqual([SC9.c1, SC9.c2].sort());
    expect(deck(g)).toHaveLength(DECK.length - 2);
  });

  it('the hand to trash from includes the 2 drawn cards (they may be trashed straight away)', () => {
    const g = viaPlay([SC9.c1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual(expect.arrayContaining([SC9.c8]));
    pickCards(g, [SC9.c8, SC9.c7]);
    expect(hand(g)).toEqual([SC9.c1]);
    expect(trash(g)).toEqual([SC9.c7, SC9.c8].sort());
  });

  it('exactly 2 are trashed: the hand grows by 0 overall (draw 2, trash 2)', () => {
    const g = viaPlay([SC9.c1, SC9.c2, SC9.c3]);
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(hand(g)).toHaveLength(3 + 2 - 2);
    expect(trash(g)).toHaveLength(2);
  });

  it('with an empty hand otherwise, the 2 drawn cards are exactly the 2 trashed', () => {
    const g = viaPlay([]);
    if (kind(g) === 'choose') pickCards(g, [SC9.c8, SC9.c7]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC9.c7, SC9.c8].sort());
  });

  it('the trash is mandatory: it cannot be skipped', () => {
    const g = viaPlay([SC9.c1, SC9.c2]);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it("the opponent's hand and deck are untouched", () => {
    const g = mine(LD9.luffy, { hand: [PIERRE, SC9.c1], deck: DECK }, { hand: [SC9.c3] });
    playRaw(g, PIERRE);
    pickCards(g, [SC9.c1, SC9.c8]);
    expect(hand(g, 'p2')).toEqual([SC9.c3]);
    expect(deck(g, 'p2')).toHaveLength(15);
  });

  it('[Trigger]: Pierre is played for free, and his [On Play] then draws 2 and trashes 2', () => {
    const g = triggerGame(PIERRE, { hand: [SC9.c1, SC9.c2], deck: DECK });
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(onField(g, PIERRE)).toBe(true);
    expect(hand(g)).toEqual([SC9.c8, SC9.c7].sort());
    expect(trash(g)).toEqual([SC9.c1, SC9.c2].sort());
  });

  it('[Trigger] has no condition: it works with any Leader', () => {
    const g = triggerGame(PIERRE, { leader: LD9.egghead, hand: [SC9.c1], deck: DECK });
    activateTrigger(g);
    expect(onField(g, PIERRE)).toBe(true);
  });

  it('declining the [Trigger]: Pierre goes to my hand and nothing is drawn', () => {
    const g = triggerGame(PIERRE, { hand: [SC9.c1], deck: DECK });
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toEqual([SC9.c1, PIERRE].sort());
    expect(deck(g)).toHaveLength(DECK.length);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});

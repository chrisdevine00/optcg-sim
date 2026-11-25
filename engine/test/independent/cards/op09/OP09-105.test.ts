/**
 * OP09-105 Sanji (Character, Yellow, cost 5, 6000, Counter +1000, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[Trigger] If your Leader has the "Egghead" type, add up to 1 card from the top of your
 * deck to the top of your Life cards. Then, trash 2 cards from your hand."
 *
 * Rules: the Life card being resolved is in no area (CR 10-1-5-3); the card is trashed after its
 * [Trigger] resolves. "Up to 1" may be 0. A "Then" after a failed "If" does not resolve (M4b-5), so a
 * Leader without the type neither adds a Life card nor trashes any card. The hand is public in size.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  atMain,
  deck,
  hand,
  kind,
  LD9,
  lifeCards,
  mine,
  need,
  no,
  offeredIds,
  pickCards,
  SC9,
  trash,
  triggerGame,
  yes,
} from './kit-op09c.ts';

const SANJI = 'OP09-105';
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5];

function game(o: { leader?: string; hand?: string[]; before?: number } = {}) {
  return triggerGame(SANJI, {
    leader: o.leader ?? LD9.egghead,
    before: o.before ?? 4,
    hand: o.hand ?? [SC9.c1, SC9.c2, SC9.c3],
    deck: DECK,
  });
}

/** Accept the trigger, then say yes to "add the top card of your deck to the top of your Life". */
function addLife(g: ReturnType<typeof game>) {
  activateTrigger(g);
  yes(g, 'p1');
}

describe('OP09-105 Sanji: [Trigger] Egghead Leader: add up to 1 deck card to Life, then trash 2 from hand', () => {
  it('printed values: Yellow Character, cost 5, 6000, Counter +1000, no keyword', () => {
    const g = mine(LD9.egghead, { characters: [SANJI] }, {});
    const c = g.zone('p1', 'characters')[0]!;
    expect(c.cost).toBe(5);
    expect(c.power).toBe(6000);
    expect(c.counter).toBe(1000);
    expect(c.keywords).toEqual([]);
  });

  it('adds the top card of my deck to the top of my Life, then I trash 2 cards from my hand', () => {
    const g = game();
    addLife(g);
    need(g, 'choose', 'p1');
    expect(lifeCards(g)[0]).toBe(SC9.c8);
    expect(g.life('p1')).toBe(4); // 3 left after the hit + 1 added
    expect(deck(g)).toHaveLength(DECK.length - 1);
    pickCards(g, [SC9.c1, SC9.c3]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC9.c2]);
    expect(trash(g)).toEqual([SANJI, SC9.c1, SC9.c3].sort());
  });

  it('the Life card added is the TOP card of the deck and goes on top of Life', () => {
    const g = game();
    addLife(g);
    expect(g.zone('p1', 'life')[0]!.card).toBe(SC9.c8);
    expect(deck(g)[0]).toBe(SC9.c7);
  });

  it('exactly 2 cards are trashed from hand (not 1, not 3)', () => {
    const g = game({ hand: [SC9.c1, SC9.c2, SC9.c3, SC9.c4] });
    addLife(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(hand(g)).toHaveLength(2);
  });

  it('the trash picks come from my hand only, never from Life or the field', () => {
    const g = game();
    addLife(g);
    // (An exact-2 pick lists only the cards that can start a selection, so check membership.)
    const offered = offeredIds(g);
    expect(offered.length).toBeGreaterThan(0);
    for (const c of offered) expect([SC9.c1, SC9.c2, SC9.c3]).toContain(c);
  });

  it('boundary: with exactly 2 cards in hand both are trashed', () => {
    const g = game({ hand: [SC9.c1, SC9.c2] });
    addLife(g);
    if (kind(g) === 'choose') pickCards(g, [SC9.c1, SC9.c2]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SANJI, SC9.c1, SC9.c2].sort());
  });

  it('with only 1 card in hand that card is trashed (as many as possible)', () => {
    const g = game({ hand: [SC9.c1] });
    addLife(g);
    if (kind(g) === 'choose') pickCards(g, [SC9.c1]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toContain(SC9.c1);
  });

  it('"up to 1": the Life add may be skipped (the Life count stays at 3)', () => {
    const g = game();
    activateTrigger(g);
    no(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(deck(g)[0]).toBe(SC9.c8);
  });

  it('a Leader without {Egghead}: no Life card is added, nothing is trashed from hand, the card is trashed', () => {
    const g = game({ leader: LD9.luffy });
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([SC9.c1, SC9.c2, SC9.c3].sort());
    expect(trash(g)).toEqual([SANJI]);
    expect(deck(g)[0]).toBe(SC9.c8);
  });

  it('declining the [Trigger]: Sanji goes to my hand and nothing else happens', () => {
    const g = game();
    act(g, { type: 'trigger', activate: false });
    expect(hand(g)).toContain(SANJI);
    expect(hand(g)).toHaveLength(4);
    expect(g.life('p1')).toBe(3);
    expect(trash(g)).toEqual([]);
  });

  it('Sanji is not played by his own [Trigger]: no Character appears', () => {
    const g = game();
    addLife(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SC9.c1, SC9.c2]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});

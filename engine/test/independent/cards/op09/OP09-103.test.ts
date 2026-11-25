/**
 * OP09-103 Koala (Character, Yellow, cost 6, 6000, no Counter, {Revolutionary Army}, Strike).
 *
 * Card text: "[Blocker]
 * [On Play] You may add 1 card from the top or bottom of your Life cards to your hand: Play up to 1
 * "Revolutionary Army" type Character card with a cost of 4 or less from your hand. If you do, draw
 * 1 card."
 *
 * Rules: the Life card is chosen (top or bottom) as the cost and goes to the hand; a card added that
 * way is public knowledge to its owner and may be played in the same effect. Life is public, so an
 * unpayable cost (0 Life) is not offered (or offered with accept illegal). "Up to 1" may be 0; the
 * hand is hidden, so the "play up to 1" pick is asked even when no card qualifies (max 0). "If you
 * do" draws only when a card was actually played.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  askedEmpty,
  atMain,
  chr,
  deck,
  hand,
  kind,
  LD9,
  lifeCards,
  mayChooseNone,
  mine,
  mustBeUnpayable,
  need,
  no,
  none,
  offeredIds,
  onField,
  pickCards,
  pickLife,
  playRaw,
  SC9,
  yes,
} from './kit-op09c.ts';

const KOALA = 'OP09-103';
const KUMA = 'OP09-108'; // Yellow, cost 4, {Revolutionary Army}/{The Seven Warlords of the Sea}, [Trigger] only
const KARASU = 'OP09-100'; // Yellow, cost 3, {Revolutionary Army}, [Blocker]
const DECK = [SC9.c8, SC9.c7, SC9.c6, SC9.c5];
const LIFE = [SC9.c1, SC9.c2, SC9.c3, SC9.c4];

function board(handCards: string[], life: string[] = LIFE, leader: string = LD9.rev) {
  return mine(leader, { hand: [KOALA, ...handCards], life, deck: DECK }, {});
}

/** Play Koala, accept the cost and take the top or bottom Life card; leaves the play pick pending. */
function pay(g: ReturnType<typeof board>, which: 'top' | 'bottom' = 'top') {
  playRaw(g, KOALA);
  yes(g);
  pickLife(g, which);
}

describe('OP09-103 Koala: [Blocker]; [On Play] Life to hand: play up to 1 {Revolutionary Army} cost 4 or less, then draw 1', () => {
  it('printed values: cost 6, 6000, no Counter, keyword [Blocker]', () => {
    const g = board([]);
    playRaw(g, KOALA);
    no(g);
    const c = g.zone('p1', 'characters')[0]!;
    expect(c.cost).toBe(6);
    expect(c.power).toBe(6000);
    expect(c.counter ?? null).toBeNull();
    expect(c.keywords).toContain('Blocker');
  });

  it('is a "you may": playing Koala asks whether to take a Life card', () => {
    const g = board([KUMA]);
    playRaw(g, KOALA);
    need(g, 'optional', 'p1');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it('taking the TOP Life card puts it in my hand and offers the {Revolutionary Army} Characters of cost 4 or less in my hand', () => {
    const g = board([KUMA, KARASU, SC9.ra5, SC9.c2]);
    pay(g, 'top');
    need(g, 'choose', 'p1');
    expect(lifeCards(g)).toEqual([SC9.c2, SC9.c3, SC9.c4]);
    expect(offeredIds(g)).toEqual([KARASU, KUMA].sort());
  });

  it('taking the BOTTOM Life card instead leaves the top where it was', () => {
    const g = board([KUMA]);
    pay(g, 'bottom');
    expect(lifeCards(g)).toEqual([SC9.c1, SC9.c2, SC9.c3]);
    expect(hand(g)).toContain(SC9.c4);
  });

  it('cost boundary: cost 4 is playable, cost 5 is not', () => {
    const g = board([KUMA, SC9.ra5]);
    pay(g, 'top');
    expect(offeredIds(g)).toEqual([KUMA]);
  });

  it('the type must be {Revolutionary Army}: a plain cost-2 Character in hand is not offered', () => {
    const g = board([SC9.c2, SC9.ra2]);
    pay(g, 'top');
    expect(offeredIds(g)).toEqual([SC9.ra2]);
  });

  it('only Characters: a hand with only non-matching cards still asks the (empty) pick, and no card is drawn', () => {
    const g = board([SC9.c2, SC9.ra5]);
    pay(g, 'top');
    askedEmpty(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(3); // c2, ra5 and the Life card c1
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('the played Character enters play and then I draw 1 card ("If you do")', () => {
    const g = board([KUMA]);
    pay(g, 'top');
    pickCards(g, [KUMA]);
    expect(atMain(g)).toBe(true);
    expect(onField(g, KUMA)).toBe(true);
    expect(hand(g)).toEqual([SC9.c1, SC9.c8].sort());
    expect(deck(g)).toHaveLength(DECK.length - 1);
  });

  it('the play costs nothing: no DON!! is spent on the played Character', () => {
    const g = board([KUMA]);
    playRaw(g, KOALA); // pays 6 of the 10 active DON!!
    yes(g);
    pickLife(g, 'top');
    const before = g.zone('p1', 'characters').length;
    pickCards(g, [KUMA]);
    expect(g.zone('p1', 'characters')).toHaveLength(before + 1);
    expect(onField(g, KUMA)).toBe(true);
  });

  it('"up to 1": playing nothing is allowed; the Life card stays in my hand and no card is drawn', () => {
    const g = board([KUMA]);
    pay(g, 'top');
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KUMA, SC9.c1].sort());
    expect(deck(g)).toHaveLength(DECK.length);
    expect(onField(g, KUMA)).toBe(false);
  });

  it('the card just taken from Life may itself be the one played', () => {
    const g = board([], [KUMA, SC9.c2, SC9.c3, SC9.c4]);
    pay(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUMA]);
    pickCards(g, [KUMA]);
    expect(onField(g, KUMA)).toBe(true);
    expect(hand(g)).toEqual([SC9.c8]);
  });

  it('declining the cost: Life, hand and board are unchanged', () => {
    const g = board([KUMA]);
    playRaw(g, KOALA);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toEqual(LIFE);
    expect(hand(g)).toEqual([KUMA]);
    expect(deck(g)).toHaveLength(DECK.length);
  });

  it('with 0 Life cards the cost cannot be paid: nothing happens', () => {
    const g = board([KUMA], []);
    playRaw(g, KOALA);
    mustBeUnpayable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([KUMA]);
  });

  it('with exactly 1 Life card the cost is payable (top and bottom are the same card)', () => {
    const g = board([KUMA], [SC9.c4]);
    pay(g, 'top');
    expect(lifeCards(g)).toEqual([]);
    expect(hand(g)).toContain(SC9.c4);
    need(g, 'choose', 'p1');
  });

  it('plays at most one Character even when two qualify', () => {
    const g = board([KUMA, KARASU]);
    pay(g, 'top');
    pickCards(g, [KARASU]);
    expect(onField(g, KARASU)).toBe(true);
    expect(onField(g, KUMA)).toBe(false);
    expect(hand(g)).toContain(KUMA);
  });

  it('it does not matter which Leader I have: a non-{Revolutionary Army} Leader works the same', () => {
    const g = board([KUMA], LIFE, LD9.luffy);
    pay(g, 'top');
    expect(offeredIds(g)).toEqual([KUMA]);
    act(g, { type: 'done' });
    expect(kind(g)).toBe('main');
  });

  it('Koala herself stays on the field and keeps [Blocker]', () => {
    const g = board([KUMA]);
    pay(g, 'top');
    pickCards(g, [KUMA]);
    expect(g.card(chr(g, 'p1', KOALA)).keywords).toContain('Blocker');
  });
});

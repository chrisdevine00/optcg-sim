/**
 * OP18-094 Hee Hee Hee!! I Smell Adventure!! (Black Event, cost 1, {Elbaph}/{The Four Emperors}/{Straw Hat Crew}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 {Elbaph} type card
 *             and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 *             [Trigger] Draw 1 card."
 *
 * Scenery: Elbaph cards OP17-088 Hajrudin (Giant/Elbaph) and OP18-092 Roronoa Zoro (Elbaph);
 * non-Elbaph OP02-060 Mohji, OP03-082 Kumadori (CP9). The Event is played for 1 DON!!.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  atMain,
  cardIds,
  hasEvent,
  need,
  none,
  noDefence,
  offeredIds,
  passBlock,
  pickCards,
  play,
  settleOrders,
  LDR,
} from './kit-e.ts';
import { mineE, theirsE, X } from './kit-e.ts';

const EV = 'OP18-094';
const ELB1 = X.hajrudinGiant;
const ELB2 = X.zoro;
const MISS = 'OP02-060';
const CP = X.cp4;

/** Deck top first: positions 1..5 are looked at; the rest is `MISS` filler (and `beyond` at 6). */
function look(top: string[], beyond = ELB1) {
  const deck = [...top, beyond, ...Array.from({ length: 9 }, () => MISS)];
  const g = mineE(LDR.luffy, { hand: [EV], deck });
  play(g, at(g, 'p1', 'hand', EV));
  return g;
}
const finish = (g: ReturnType<typeof look>) => {
  settleOrders(g);
  expect(atMain(g, 'p1')).toBe(true);
};

describe('OP18-094 Hee Hee Hee!! I Smell Adventure!!: [Main] look at 5, add up to 1 {Elbaph}', () => {
  it('offers only {Elbaph} cards of the top 5; the pick goes to hand, the other four go to the bottom', () => {
    const g = look([MISS, ELB2, CP, ELB1, MISS]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ELB1, ELB2].sort());
    pickCards(g, [ELB2]);
    finish(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([ELB2]);
    const d = cardIds(g, 'p1', 'deck');
    expect(d).toHaveLength(15 - 1 + 0);
    expect(d[0]).toBe(ELB1); // the card that was 6th is now on top
    expect(d.slice(-4).sort()).toEqual([MISS, CP, ELB1, MISS].sort());
    expect(cardIds(g, 'p1', 'trash')).toEqual([EV]);
  });

  it('"up to 1": may add nothing; all five go to the bottom', () => {
    const g = look([MISS, ELB2, CP, ELB1, MISS]);
    need(g, 'choose', 'p1');
    none(g);
    finish(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    const d = cardIds(g, 'p1', 'deck');
    expect(d).toHaveLength(15);
    expect(d.slice(-5).sort()).toEqual([MISS, ELB2, CP, ELB1, MISS].sort());
  });

  it('adds at most 1 card even when two {Elbaph} cards are among the five', () => {
    const g = look([ELB1, ELB2, MISS, MISS, MISS]);
    need(g, 'choose', 'p1');
    pickCards(g, [ELB1]);
    finish(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([ELB1]);
  });

  it('only the top 5 are looked at: an {Elbaph} card 6th from the top is not offered', () => {
    const g = look([MISS, MISS, MISS, MISS, MISS], ELB1);
    if (need(g, 'choose', 'p1')) expect(offeredIds(g)).toEqual([]);
    none(g);
    finish(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(ELB1);
  });

  it('a card of another type (CP9, Mohji) is never offered, even with no {Elbaph} among the five', () => {
    const g = look([CP, MISS, CP, MISS, CP]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    finish(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('the chosen card is revealed to the opponent; the others are not', () => {
    const g = look([MISS, ELB2, CP, MISS, MISS]);
    pickCards(g, [ELB2]);
    finish(g);
    expect(hasEvent(g, 'CardRevealed', { card: ELB2 })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: CP })).toBe(false);
  });
});

describe('OP18-094 Hee Hee Hee!! I Smell Adventure!!: [Trigger] draw 1 card', () => {
  function hit() {
    const g = theirsE(LDR.luffy, {
      life: [EV, MISS, MISS, MISS],
      deck: [ELB1, MISS, MISS, MISS, MISS],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    act(g, { type: 'endCounter' });
    return g;
  }

  it('activating the Trigger draws the top card of the deck', () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    expect(cardIds(g, 'p1', 'hand')).toEqual([ELB1]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([EV]);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the Trigger adds the Event to hand and draws nothing', () => {
    const g = hit();
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: false });
    expect(cardIds(g, 'p1', 'hand')).toEqual([EV]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(ELB1);
  });

  void noDefence;
});

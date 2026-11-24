/** EB04-022 Issho. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import {
  at,
  attack,
  BLUE,
  cardsOf,
  canPick,
  finishBattle,
  finishOrder,
  mk,
  PURPLE,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-022';
const fill = (n: number, c: string): string[] => Array.from({ length: n }, () => c);

describe('EB04-022 Issho', () => {
  const played = (oppHand: number, myHand = [ID, V.c1, V.c2, V.c3]) =>
    mk(
      { leader: RED_LEADER, hand: myHand },
      { hand: [BLUE, BLUE, ...fill(Math.max(0, oppHand - 2), PURPLE)], deck: fill(5, PURPLE) },
    );

  it('[On Play] you may trash 2 cards from your hand: with 6 opposing hand cards, the opponent places 2 of their choice at the bottom of their deck', () => {
    const g = played(6);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(trash(g, 'p1')).toHaveLength(2);
    // The opponent chooses their own cards, then the order.
    expect(dec(g)?.player).toBe('p2');
    pick(g, [g.find('p2', 'hand', BLUE, 0), g.find('p2', 'hand', BLUE, 1)]);
    expect(dec(g)?.kind).toBe('order');
    finishOrder(g);
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(cardsOf(g, 'p2', 'deck').slice(-2)).toEqual([BLUE, BLUE]);
    expect(cardsOf(g, 'p2', 'deck')).toHaveLength(7);
    expect(dec(g)?.player).toBe('p1');
  });

  it('with 5 opposing hand cards (one below the threshold) nothing is placed, but the cost was paid', () => {
    const g = played(5);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    expect(dec(g)?.player).toBe('p1');
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('with 8 opposing hand cards exactly 2 are placed', () => {
    const g = played(8);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c2)]);
    pick(g, [g.find('p2', 'hand', BLUE, 0), g.find('p2', 'hand', PURPLE, 0)]);
    finishOrder(g);
    expect(hand(g, 'p2')).toHaveLength(6);
  });

  it('"You may": declining trashes nothing and places nothing', () => {
    const g = played(7);
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toHaveLength(0);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(dec(g)?.kind).toBe('main');
  });

  it('with fewer than 2 other cards in hand the cost cannot be paid: the question is asked, accepting is not legal', () => {
    const g = played(7, [ID, V.c1]);
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(hand(g, 'p2')).toHaveLength(7);
  });

  describe('[DON!! x1] [When Attacking]', () => {
    const start = (don: number) =>
      mk(
        {
          leader: RED_LEADER,
          hand: [V.c1, V.c2],
          characters: [{ card: ID, don }],
          costArea: { active: 8, rested: 0 },
        },
        { characters: [V.c5, V.c3] },
      );

    it('with 1 DON!! given: you may trash 1 card from your hand: an opposing Character gets -2000 this turn', () => {
      const g = start(1);
      attack(g, at(g, 'p1', 'characters', ID));
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, at(g, 'p2', 'characters', V.c5))).toBe(true);
      pick(g, [at(g, 'p2', 'characters', V.c5)]);
      expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(5000);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      finishBattle(g);
    });

    it('with no DON!! given the ability does not fire (no prompt)', () => {
      const g = start(0);
      attack(g, at(g, 'p1', 'characters', ID));
      expect(dec(g)?.kind).toBe('block');
      expect(hand(g, 'p1')).toHaveLength(2);
      finishBattle(g);
    });

    it('"You may": declining trashes nothing', () => {
      const g = start(1);
      attack(g, at(g, 'p1', 'characters', ID));
      decline(g);
      expect(hand(g, 'p1')).toHaveLength(2);
      expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
      finishBattle(g);
    });

    it('"up to 1": the power target may be skipped after paying', () => {
      const g = start(1);
      attack(g, at(g, 'p1', 'characters', ID));
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      none(g);
      expect(g.power(at(g, 'p2', 'characters', V.c5))).toBe(7000);
      finishBattle(g);
    });
  });
});

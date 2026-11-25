/** EB02-013 Carrot. */
import { describe, expect, it } from 'vitest';
import { project } from '@optcg/engine';
import {
  C1,
  C2,
  C3,
  cardsOf,
  expectDecision,
  finishOrder,
  hand,
  mk,
  pick,
  SHC,
  ZOU,
} from './helpers-aeb2g1.ts';
import { dec, none, play } from './helpers.ts';

const ID = 'EB02-013';
// Seven cards are looked at (positions 0..6); the eighth stays on top of the deck afterwards.
const DECK = [C1, ZOU, C2, SHC.sanji1, ZOU, C1, C2, C3];
const start = (handCards: string[] = [ID], don = { active: 3, rested: 0 }) =>
  mk({ hand: handCards, deck: DECK, costArea: don });

describe('EB02-013 Carrot', () => {
  it('with 3 DON!! (boundary): look at 7, add a [Zou], put the rest at the bottom, play a [Zou] from the hand', () => {
    const g = start([ID, ZOU]);
    play(g, ID);
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(7);
    // Only the two [Zou] are offered besides nothing (the others are not [Zou]).
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', ZOU, 0)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(ZOU);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([ZOU, ZOU]);
    expectDecision(g, 'choose', 'p1'); // the play: the hand holds 2 [Zou]
    pick(g, [g.find('p1', 'hand', ZOU, 0)]);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([ZOU]);
    expect(hand(g, 'p1')).toEqual([ZOU]);
    // 7 looked at, 1 taken: 6 at the bottom, the 8th card is now on top.
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(DECK.length - 1);
    expect(deck[0]).toBe(C3);
    expectDecision(g, 'main', 'p1');
  });

  it('with only 2 DON!! on the field nothing happens (no look, no play)', () => {
    const g = start([ID, ZOU], { active: 2, rested: 0 });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([ZOU]);
    expect(cardsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([]);
  });

  it('DON!! given to a Character count as on the field', () => {
    const g = mk({
      hand: [ID],
      deck: DECK,
      characters: [{ card: SHC.sanji1, don: 2 }],
      costArea: { active: 1, rested: 0 },
    });
    play(g, ID);
    expectDecision(g, 'choose', 'p1'); // 1 + 2 given = 3 DON!!: the look happens
  });

  it('"up to 1": may take nothing even with [Zou] among the cards, and may play nothing', () => {
    const g = start([ID, ZOU]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([ZOU]);
    none(g);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(DECK.length); // all 7 went to the bottom
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(C3);
  });

  it('with no [Zou] taken and none in the hand the play is asked at max 0 (nothing to reveal about the hand is needed)', () => {
    const g = start([ID]);
    play(g, ID);
    none(g);
    finishOrder(g);
    const d = dec(g);
    expect(d?.kind).toBe('choose');
    expect(d?.max ?? 0).toBe(0);
    g.act({ type: 'done' });
    expectDecision(g, 'main', 'p1');
  });

  it('a [Zou] taken from the deck can be played at once', () => {
    const g = start([ID]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', ZOU, 0)]);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', ZOU)]);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([ZOU]);
    expect(hand(g, 'p1')).toEqual([]);
  });
});

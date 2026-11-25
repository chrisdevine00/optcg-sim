/** EB02-032 Iceburg. */
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
  GALLEY,
} from './helpers-aeb2g1.ts';
import { dec, none, play } from './helpers.ts';

const ID = 'EB02-032';
// Seven cards are looked at (positions 0..6); the eighth stays on top of the deck afterwards.
const DECK = [C1, GALLEY, C2, SHC.sanji1, GALLEY, C1, C2, C3];
const start = (handCards: string[] = [ID], don = { active: 3, rested: 0 }) =>
  mk({ hand: handCards, deck: DECK, costArea: don });

describe('EB02-032 Iceburg', () => {
  it('with 3 DON!! (boundary): look at 7, add a [Galley-La Company], put the rest at the bottom, play a [Galley-La Company] from the hand', () => {
    const g = start([ID, GALLEY]);
    play(g, ID);
    const v = project(g.state, 'p1') as unknown as { looking: { card: string }[] };
    expect(v.looking).toHaveLength(7);
    // Only the two [Galley-La Company] are offered besides nothing (the others are not [Galley-La Company]).
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', GALLEY, 0)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(GALLEY);
    finishOrder(g);
    expect(hand(g, 'p1').sort()).toEqual([GALLEY, GALLEY]);
    expectDecision(g, 'choose', 'p1'); // the play: the hand holds 2 [Galley-La Company]
    pick(g, [g.find('p1', 'hand', GALLEY, 0)]);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([GALLEY]);
    expect(hand(g, 'p1')).toEqual([GALLEY]);
    // 7 looked at, 1 taken: 6 at the bottom, the 8th card is now on top.
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(DECK.length - 1);
    expect(deck[0]).toBe(C3);
    expectDecision(g, 'main', 'p1');
  });

  it('with only 2 DON!! on the field nothing happens (no look, no play)', () => {
    const g = start([ID, GALLEY], { active: 2, rested: 0 });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([GALLEY]);
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

  it('"up to 1": may take nothing even with [Galley-La Company] among the cards, and may play nothing', () => {
    const g = start([ID, GALLEY]);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([GALLEY]);
    none(g);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(DECK.length); // all 7 went to the bottom
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(C3);
  });

  it('with no [Galley-La Company] taken and none in the hand the play is asked at max 0 (nothing to reveal about the hand is needed)', () => {
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

  it('a [Galley-La Company] taken from the deck can be played at once', () => {
    const g = start([ID]);
    play(g, ID);
    pick(g, [g.find('p1', 'deck', GALLEY, 0)]);
    finishOrder(g);
    pick(g, [g.find('p1', 'hand', GALLEY)]);
    expect(cardsOf(g, 'p1', 'stage')).toEqual([GALLEY]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only a card NAMED [Galley-La Company] counts: a {Galley-La Company} Character is not offered', () => {
    const KAKU = 'OP03-059'; // {Galley-La Company} type, a different name
    const g = mk({
      hand: [ID],
      deck: [KAKU, GALLEY, C1, C2, C1, C2, C3, C3],
      costArea: { active: 3, rested: 0 },
    });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', GALLEY)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([GALLEY]);
  });
});

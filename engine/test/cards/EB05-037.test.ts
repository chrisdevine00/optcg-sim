/** EB05-037 Black Maria. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { cardsOf, donArea, finishOrder } from './helpers-luffyace.ts';
import { AKP_6000, SMILE_3000 } from './helpers-eb05g2.ts';

const MARIA = 'EB05-037';
const deck = [BLUE, AKP_6000, SMILE_3000, PURPLE, AKP_6000];
const start = (d = deck) =>
  game({ leader: PLAIN_BLUE, hand: [MARIA], deck: d, ...donArea(1) }, { leader: PLAIN_BLUE });

describe('EB05-037 Black Maria', () => {
  it('[On Play] looks at 3 and adds an {Animal Kingdom Pirates} card; the rest go to the bottom', () => {
    const g = start();
    play(g, MARIA);
    expectDecision(g, 'choose', 'p1');
    // Two of the three looked-at cards qualify; the 5th card is not looked at.
    pick(g, [g.find('p1', 'deck', SMILE_3000)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SMILE_3000]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(4);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(PURPLE);
  });

  it('only one card may be taken ("up to 1")', () => {
    const g = start();
    play(g, MARIA);
    pick(g, [g.find('p1', 'deck', AKP_6000)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([AKP_6000]);
  });

  it('may take nothing', () => {
    const g = start();
    play(g, MARIA);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(5);
  });

  it('a card of another type among the 3 is not offered', () => {
    const g = start([BLUE, PURPLE, BLUE, AKP_6000]);
    play(g, MARIA);
    none(g); // nothing qualifies: only "done" is useful
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(AKP_6000);
  });
});

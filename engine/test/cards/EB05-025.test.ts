/** EB05-025 Domino. */
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
  trash,
} from './helpers.ts';
import { cardsOf, donArea, finishOrder } from './helpers-luffyace.ts';
import { IMPEL_VANILLA } from './helpers-eb05g2.ts';
import { damageWith } from './triggers.ts';

const DOMINO = 'EB05-025';
const IMPEL_2 = 'OP02-088'; // Purple, cost 4, {Animal}{Impel Down}
const deck = [PURPLE, IMPEL_VANILLA, BLUE, IMPEL_2, PURPLE];
const start = () =>
  game({ leader: PLAIN_BLUE, hand: [DOMINO], deck, ...donArea(2) }, { leader: PLAIN_BLUE });

describe('EB05-025 Domino', () => {
  it('[On Play] looks at 3, adds an {Impel Down} card (the 4th card is not looked at), the rest go to the bottom', () => {
    const g = start();
    play(g, DOMINO);
    expectDecision(g, 'choose', 'p1');
    // Only the Impel Down card among the top 3 is offered (the 4th card, also Impel Down, is out of reach).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', IMPEL_VANILLA)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([IMPEL_VANILLA]);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d).toHaveLength(4);
    expect(d[0]).toBe(IMPEL_2); // the 4th card is now on top
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(IMPEL_VANILLA);
  });

  it('"up to 1": may take nothing; all 3 go to the bottom', () => {
    const g = start();
    play(g, DOMINO);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(IMPEL_2);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(5);
  });

  it('with no {Impel Down} card among the 3, nothing is taken', () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [DOMINO], deck: [PURPLE, BLUE, PURPLE, IMPEL_2], ...donArea(2) },
      { leader: PLAIN_BLUE },
    );
    play(g, DOMINO);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(IMPEL_2);
  });

  it('[Trigger] activates the [On Play] effect', () => {
    const g = damageWith(DOMINO, { leader: PLAIN_BLUE, deck });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', IMPEL_VANILLA)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([IMPEL_VANILLA]);
    expect(trash(g, 'p1')).toEqual([DOMINO]);
  });
});

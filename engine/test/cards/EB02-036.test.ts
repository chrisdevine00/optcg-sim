/** EB02-036 Nico Robin. */
import { describe, expect, it } from 'vitest';
import {
  C1,
  C2,
  canPick,
  cardsOf,
  dec,
  don,
  expectDecision,
  finishOrder,
  hand,
  koBy,
  mk,
  none,
  pick,
  SHC,
  V,
} from './helpers-aeb2g1.ts';
import { accept, decline } from './helpers.ts';

const ID = 'EB02-036';
const DECK = [C1, SHC.sanji1, C2, SHC.jinbe2, V.c5];
const start = (costArea = { active: 3, rested: 0 }) =>
  mk({ characters: [ID], deck: DECK, costArea });

describe('EB02-036 Nico Robin', () => {
  it('has the printed [Blocker]', () => {
    const g = start();
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On K.O.]: DON!! -1, look at 3, add up to 1 {Straw Hat Crew} card (revealed), the rest at the bottom', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(don(g, 'p1').deck).toBe(8); // 7 in the DON!! deck + the 1 returned
    // Offered: the {Straw Hat Crew} card among the 3 looked at; the 4th card is not looked at.
    expect(canPick(g, g.find('p1', 'deck', SHC.sanji1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', C1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', SHC.jinbe2))).toBe(false);
    pick(g, [g.find('p1', 'deck', SHC.sanji1)]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(SHC.sanji1);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SHC.sanji1]);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(DECK.length - 1);
    expect(deck.slice(0, 2)).toEqual([SHC.jinbe2, V.c5]);
    expect(deck.slice(2).sort()).toEqual([C1, C2].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('the DON!! -1 is optional: declining it does nothing', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    decline(g);
    expect(don(g, 'p1').active).toBe(3);
    expect(cardsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"up to 1": may take nothing; all 3 go to the bottom', () => {
    const g = start();
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(SHC.jinbe2);
  });

  it('with no DON!! on the field the cost cannot be paid: no prompt', () => {
    const g = start({ active: 0, rested: 0 });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(dec(g)?.kind).toBe('main');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(DECK);
  });
});

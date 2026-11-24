/** OP12-091 Poker. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, V } from './helpers.ts';
import {
  activate,
  canActivate,
  cardsIn,
  mk,
  NONSMILE4,
  offered,
  orderAll,
  SMILE2,
  SMILE3,
} from './helpers-op12g3.ts';

const ID = 'OP12-091';
const AB = 'smile-power';

const start = (trashCards: string[] = [V.c1, V.c5, V.c6, V.c7]) =>
  mk({ characters: [ID, SMILE3, SMILE2, NONSMILE4], trash: trashCards, deck: [V.c1, V.c2] });

describe('OP12-091 Poker', () => {
  it('[Activate: Main] places 3 chosen trash cards at the bottom of the deck, then 2 SMILE Characters get +2000', () => {
    const g = start();
    const poker = g.find('p1', 'characters', ID);
    activate(g, poker, AB);
    pick(g, [
      g.find('p1', 'trash', V.c5),
      g.find('p1', 'trash', V.c6),
      g.find('p1', 'trash', V.c7),
    ]);
    orderAll(g);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([V.c1]);
    const deck = cardsIn(g, 'p1', 'deck');
    expect(deck).toHaveLength(5);
    expect(deck.slice(0, 2)).toEqual([V.c1, V.c2]);
    expect(deck.slice(2).sort()).toEqual([V.c5, V.c6, V.c7].sort());
    pick(g, [g.find('p1', 'characters', SMILE3), g.find('p1', 'characters', SMILE2)]);
    expect(g.power(g.find('p1', 'characters', SMILE3))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', SMILE2))).toBe(6000);
    expect(g.power(poker)).toBe(4000);
    expect(g.power(g.find('p1', 'characters', NONSMILE4))).toBe(6000);
  });

  it('only SMILE Characters are offered (Poker itself is one; a non-SMILE Character is not)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), AB);
    pick(g, [
      g.find('p1', 'trash', V.c5),
      g.find('p1', 'trash', V.c6),
      g.find('p1', 'trash', V.c7),
    ]);
    orderAll(g);
    const o = offered(g);
    expect(o).toContain(g.find('p1', 'characters', ID));
    expect(o).toContain(g.find('p1', 'characters', SMILE3));
    expect(o).not.toContain(g.find('p1', 'characters', NONSMILE4));
  });

  it('"up to 2": may choose fewer; even none (the cost is still paid)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), AB);
    pick(g, [
      g.find('p1', 'trash', V.c5),
      g.find('p1', 'trash', V.c6),
      g.find('p1', 'trash', V.c7),
    ]);
    orderAll(g);
    none(g);
    expect(g.power(g.find('p1', 'characters', SMILE3))).toBe(5000);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it('[Once Per Turn]: not offered a second time in the same turn', () => {
    const g = start([V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7]);
    const poker = g.find('p1', 'characters', ID);
    expect(canActivate(g, poker, AB)).toBe(true);
    activate(g, poker, AB);
    pick(g, [
      g.find('p1', 'trash', V.c1),
      g.find('p1', 'trash', V.c2),
      g.find('p1', 'trash', V.c3),
    ]);
    orderAll(g);
    none(g);
    expectDecision(g, 'main', 'p1');
    expect(canActivate(g, poker, AB)).toBe(false);
  });

  it('boundary: with only 2 cards in the trash the ability cannot be activated', () => {
    const g = start([V.c1, V.c2]);
    expect(canActivate(g, g.find('p1', 'characters', ID), AB)).toBe(false);
    expect(dec(g)?.kind).toBe('main');
  });
});

/** EB03-013 Carrot. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { activate, canPick, cardsIn, mk, offeredAb, ZOU } from './helpers-eb03g1.ts';

const ID = 'EB03-013';
const rested = (card: string) => ({ card, rested: true });
const start = (playedThisTurn = true, hand: string[] = [ZOU]) =>
  mk(
    { characters: [{ card: ID, playedThisTurn }], hand },
    { characters: [rested(V.c5), rested(V.c6), V.c3] },
  );

describe('EB03-013 Carrot', () => {
  it('played this turn: K.O.s a rested cost 5 or less Character, then plays [Zou] from hand', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'ko-play');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true); // cost 5 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsIn(g, 'p2', 'characters').sort()).toEqual([V.c3, V.c6].sort());
    pick(g, [g.find('p1', 'hand', ZOU)]);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([ZOU]);
    expect(cardsIn(g, 'p1', 'hand')).toEqual([]);
  });

  it('not played this turn: the activation is allowed but nothing happens, and the Once Per Turn is spent', () => {
    const g = start(false);
    activate(g, g.find('p1', 'characters', ID), 'ko-play');
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([]);
    expect(cardsIn(g, 'p1', 'hand')).toEqual([ZOU]); // "Then" is inside the guard
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'ko-play')).toBe(false);
  });

  it('"Then" is not "If you do": with no K.O. target [Zou] is still played', () => {
    const g = mk({ characters: [{ card: ID, playedThisTurn: true }], hand: [ZOU] }, {});
    activate(g, g.find('p1', 'characters', ID), 'ko-play');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', ZOU)]);
    expect(cardsIn(g, 'p1', 'stage')).toEqual([ZOU]);
  });

  it('"up to 1": may K.O. nothing and may play nothing', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'ko-play');
    none(g);
    none(g);
    expect(cardsIn(g, 'p2', 'characters')).toHaveLength(3);
    expect(cardsIn(g, 'p1', 'hand')).toEqual([ZOU]);
  });

  it('only a card named [Zou] can be played; other cards in hand are not candidates', () => {
    const g = start(true, [ZOU, V.c1]);
    activate(g, g.find('p1', 'characters', ID), 'ko-play');
    none(g);
    expect(canPick(g, g.find('p1', 'hand', ZOU))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
  });
});

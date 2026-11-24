/** OP13-083 St. Jaygarcia Saturn. */
import { describe, expect, it } from 'vitest';
import { hand, none, pick, play, V } from './helpers.ts';
import {
  CELESTIAL,
  idsOf,
  JU_PETER,
  koedInBattle,
  mine,
  NUSJURO,
  pickableCards,
  pickCard,
  plantOpponentEffect,
  rep,
  settle,
} from './helpers-op13g3.ts';

const ID = 'OP13-083';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
/** An Event with the {Five Elders} type (any category counts). */
const FE_EVENT = 'OP13-096';

describe('OP13-083 St. Jaygarcia Saturn', () => {
  const play5 = (deck: string[]) => mine({ hand: [ID], deck }, {}, 4);

  it('[On Play] look at 5, reveal up to 1 "Five Elders" card to hand, the rest to the bottom in any order', () => {
    const g = play5([V.c1, NUSJURO, CELESTIAL, V.c2, V.c3, V.c4]);
    play(g, ID);
    // Only a Five Elders card qualifies (a Celestial Dragons card that is not Five Elders does not).
    expect(pickableCards(g)).toEqual([NUSJURO]);
    pickCard(g, NUSJURO);
    settle(g);
    expect(hand(g, 'p1')).toEqual([NUSJURO]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(V.c4);
    expect(deck).toHaveLength(5);
  });

  it('any category counts: a {Five Elders} Event can be taken', () => {
    const g = play5([FE_EVENT, V.c1, V.c2, V.c3, V.c4]);
    play(g, ID);
    expect(pickableCards(g)).toEqual([FE_EVENT]);
  });

  it('"up to 1": may take nothing', () => {
    const g = play5([JU_PETER, V.c1, V.c2, V.c3, V.c4, V.c5]);
    play(g, ID);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(V.c5);
  });

  it("with 7 or more cards in your trash it cannot be removed from the field by your opponent's effects", () => {
    const g = mine({ characters: [ID], trash: rep(7, V.c1) }, {}, 4);
    g.act({ type: 'endTurn' });
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("boundary: with 6 cards in your trash it is K.O.'d by an opposing effect", () => {
    const g = mine({ characters: [ID], trash: rep(6, V.c1) }, {}, 4);
    g.act({ type: 'endTurn' });
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('a K.O. in battle still removes it even with 7 cards in the trash', () => {
    const g = koedInBattle(ID, { leader: 'ST01-001', trash: rep(7, V.c1) });
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });
});

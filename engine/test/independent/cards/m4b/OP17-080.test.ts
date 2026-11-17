/**
 * OP17-080 Usopp (Character, Black, cost 2, 2000, Counter +1000, {Straw Hat Crew}/{Elbaph}).
 *
 * Card text:
 *   "If there is a Character with a cost of 12 or more, this Character gains +3000 power.
 *    [On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Elbaph} type card and
 *    add it to your hand. Then, trash the rest."
 *
 * Rules: the condition is "there is a Character" (either player's, any area of the field,
 * CR 8-1-3-3); current cost counts (OP17-089 Saul is 4 + 12 on the field, QA-OP17); CR 8-4-4-2
 * (may choose none from hidden cards); CR 4-10-2 ("then, trash the rest" still resolves).
 */
import { describe, expect, it } from 'vitest';
import { myTurn } from '../kit.ts';
import {
  C,
  deckCards,
  deckOf,
  drive,
  FILLER,
  ids,
  offeredCards,
  playCard,
  side,
  sorted,
  V,
} from './kit-c.ts';
import { kind } from '../kit.ts';

const ID = 'OP17-080';

describe('OP17-080 Usopp: +3000 power while a Character with cost 12+ exists', () => {
  it('own Saul (cost 16 on the field): Usopp is 5000', () => {
    const g = myTurn(side(C.luffy, FILLER, { characters: [ID, C.saul] }), side(C.shanks, FILLER));
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('the opponent\'s cost 12+ Character also counts ("there is a Character")', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { characters: [ID] }),
      side(C.shanks, FILLER, { characters: [C.saul] }),
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });

  it('without such a Character (cost 10 is not enough): 2000', () => {
    const g = myTurn(side(C.luffy, FILLER, { characters: [ID, C.cost10] }), side(C.shanks, FILLER));
    expect(g.power(g.find('p1', 'characters', ID))).toBe(2000);
  });
});

describe('OP17-080 Usopp: [On Play] look at 3, add up to 1 {Elbaph}, trash the rest', () => {
  const TOP3 = [V.sai, C.elbaphChar, V.marco];
  function game(top: string[] = TOP3) {
    return myTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        costArea: { active: 2, rested: 0 },
        deck: deckOf([...top, V.hajrudin]),
      }),
      side(C.shanks, FILLER),
    );
  }

  it('adds the {Elbaph} card and trashes the other 2', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [g.find('p1', 'deck', C.elbaphChar)] });
    expect(ids(g, 'p1', 'hand')).toEqual([C.elbaphChar]);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted([V.sai, V.marco]));
    expect(deckCards(g, 'p1')[0]).toBe(V.hajrudin);
  });

  it('only {Elbaph} cards are offered', () => {
    const g = game();
    playCard(g, 'p1', ID);
    expect(kind(g)).toBe('choose');
    expect(offeredCards(g)).toEqual([C.elbaphChar]);
  });

  it('an {Elbaph} Event is also an {Elbaph} type card', () => {
    const g = game([V.sai, C.elbaphEvent, V.marco]);
    playCard(g, 'p1', ID);
    expect(offeredCards(g)).toEqual([C.elbaphEvent]);
  });

  it('CR 8-4-4-2: may add nothing; then all 3 are trashed', () => {
    const g = game();
    playCard(g, 'p1', ID);
    drive(g, 'p1', { targets: [] });
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(sorted(ids(g, 'p1', 'trash'))).toEqual(sorted(TOP3));
  });

  it('no {Elbaph} among the 3: all 3 are trashed', () => {
    const g = game([V.sai, V.marco, V.thatch]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(3);
    expect(deckCards(g, 'p1')[0]).toBe(V.hajrudin);
  });

  it('only 3 cards are looked at: an {Elbaph} card in 4th place stays on the deck', () => {
    const g = myTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        costArea: { active: 2, rested: 0 },
        deck: deckOf([V.sai, V.marco, V.thatch, C.elbaphChar]),
      }),
      side(C.shanks, FILLER),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(deckCards(g, 'p1')[0]).toBe(C.elbaphChar);
  });

  it('"up to 1": with two {Elbaph} cards in the top 3 only one can be added; the other is trashed', () => {
    const g = game([C.elbaphChar, C.elbaphEvent, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'deck', C.elbaphChar), g.find('p1', 'deck', C.elbaphEvent)],
    });
    expect(ids(g, 'p1', 'hand')).toHaveLength(1);
    expect(ids(g, 'p1', 'trash')).toHaveLength(2);
  });
});

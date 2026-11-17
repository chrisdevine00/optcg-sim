/**
 * OP17-089 Jaguar.D.Saul (Character, Black, cost 4, 6000, no Counter, {Giant}/{Former Navy}/
 * {Elbaph}).
 *
 * Card text:
 *   "This Character gains +12 cost.
 *    [On Play] Look at 3 cards from the top of your deck; reveal up to 1 {Elbaph} type card and
 *    add it to your hand. Then, trash the rest."
 *
 * Rules: QA-OP17 OP17-089 / RL-43 ("+12 cost" applies on the field only, not in hand, trash or
 * deck); CR 2-7-2 (the cost paid is the printed 4); CR 8-4-4-2; CR 4-10-2.
 */
import { describe, expect, it } from 'vitest';
import { donOf, kind, myTurn } from '../kit.ts';
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

const ID = 'OP17-089';

describe('OP17-089 Jaguar.D.Saul: +12 cost on the field only', () => {
  it('in hand he costs 4 (playable with 4 DON!!, paying exactly 4), on the field he is cost 16', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { hand: [ID], costArea: { active: 4, rested: 0 } }),
      side(C.shanks, FILLER),
    );
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(4);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 4 });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(16);
  });

  it('as a placed Character he counts as "a Character with a cost of 12 or more" for Usopp (OP17-087 Robin check)', () => {
    const g = myTurn(
      side(C.luffy, FILLER, { characters: [ID, 'OP17-082'] }),
      side(C.shanks, FILLER),
    );
    expect(g.power(g.find('p1', 'characters', 'OP17-082'))).toBe(5000);
  });
});

describe('OP17-089 Jaguar.D.Saul: [On Play] look at 3, add up to 1 {Elbaph}, trash the rest', () => {
  const TOP3 = [V.sai, C.elbaphChar, V.marco];
  function game(top: string[] = TOP3) {
    return myTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        costArea: { active: 4, rested: 0 },
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

  it('may add nothing: all 3 are trashed', () => {
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
    expect(ids(g, 'p1', 'trash')).toHaveLength(3);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('"up to 1": two {Elbaph} cards in the top 3 → only one is added', () => {
    const g = game([C.elbaphChar, C.elbaphEvent, V.marco]);
    playCard(g, 'p1', ID);
    drive(g, 'p1', {
      targets: [g.find('p1', 'deck', C.elbaphChar), g.find('p1', 'deck', C.elbaphEvent)],
    });
    expect(ids(g, 'p1', 'hand')).toHaveLength(1);
    expect(ids(g, 'p1', 'trash')).toHaveLength(2);
  });

  it('only 3 cards are looked at: an {Elbaph} card in 4th place is neither offered nor trashed', () => {
    const g = myTurn(
      side(C.luffy, FILLER, {
        hand: [ID],
        costArea: { active: 4, rested: 0 },
        deck: deckOf([V.sai, V.marco, V.thatch, C.elbaphChar]),
      }),
      side(C.shanks, FILLER),
    );
    playCard(g, 'p1', ID);
    drive(g, 'p1', {});
    expect(deckCards(g, 'p1')[0]).toBe(C.elbaphChar);
    expect(ids(g, 'p1', 'trash')).toHaveLength(3);
  });
});

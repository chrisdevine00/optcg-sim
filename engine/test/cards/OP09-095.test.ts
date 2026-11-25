/** OP09-095 Laffitte. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB_CARD,
  canActivate,
  don,
  handIds,
  idsOf,
  mk,
  none,
  pickableCards,
  pickCard,
  settle,
  V,
} from './helpers-a09g3.ts';

const BB_EVENT_OR_OTHER = 'OP09-086'; // a second {Blackbeard Pirates} Character (Jesus Burgess)
const ID = 'OP09-095';
const DECK = [V.c1, BB_CARD, V.c2, BB_EVENT_OR_OTHER, V.c3, V.c4, V.c5];
const start = (p1: object = {}) => mk({ characters: [ID], deck: DECK, ...p1 }, {}, undefined, 3);

describe('OP09-095 Laffitte', () => {
  it('[Activate: Main] rest 1 DON!! and this Character: look at 5, add up to 1 {Blackbeard Pirates} card, the rest to the bottom', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(pickableCards(g).sort()).toEqual([BB_CARD, BB_EVENT_OR_OTHER].sort());
    pickCard(g, BB_CARD);
    settle(g);
    expect(handIds(g, 'p1')).toEqual([BB_CARD]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([V.c4, V.c5]); // beyond the fifth card: untouched
    expect(deck.slice(2).sort()).toEqual([V.c1, V.c2, BB_EVENT_OR_OTHER, V.c3].sort());
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    settle(g);
    expect(handIds(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')).toHaveLength(7);
    expect(idsOf(g, 'p1', 'deck').slice(0, 2)).toEqual([V.c4, V.c5]);
  });

  it('the sixth card is not looked at', () => {
    const g = start({ deck: [V.c1, V.c2, V.c3, V.c4, V.c5, BB_CARD] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(pickableCards(g)).toEqual([]);
  });

  it('must not be offered without an active DON!! card to rest, or when rested', () => {
    const noDon = mk({ characters: [ID], deck: DECK }, {}, undefined, 0);
    expect(canActivate(noDon, noDon.find('p1', 'characters', ID), 'activate')).toBe(false);
    const rested = start({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(rested, rested.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

/** OP12-028 Kouzuki Hiyori. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, hand, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  activate,
  atMain,
  finishOrder,
  GREEN_EVENT,
  mine,
  offered,
  offeredAb,
  RANGED4,
  RED_EVENT,
  SLASH1,
  SLASH3,
  ZORO_LEADER,
} from './helpers-lfa.ts';

const ID = 'OP12-028';
const AB = 'look';
/** Top 5: a <Slash> Character, a green Event, a red Event and two <Ranged> Characters; below them a <Slash> one. */
const DECK = [SLASH3, GREEN_EVENT, RED_EVENT, RANGED4, V.c5, SLASH1, V.c1];
const board = (leader = ZORO_LEADER, extra = {}) =>
  mine(leader, { characters: [ID], deck: DECK, ...extra }, {}, 2);
const hiyori = (g: ReturnType<typeof board>) => g.find('p1', 'characters', ID);
const deckOf = (g: ReturnType<typeof board>) => g.zone('p1', 'deck').map((c) => c.card);

describe('OP12-028 Kouzuki Hiyori', () => {
  it('with [Roronoa Zoro]: rest 1 DON!! and Hiyori, look at 5, add a <Slash> card or green Event, the rest go to the bottom', () => {
    const g = board();
    activate(g, hiyori(g), AB);
    expect(g.card(hiyori(g)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expectDecision(g, 'choose', 'p1');
    expect(g.eventsOfType('CardsLooked')).toHaveLength(1);
    // Offered: the <Slash> Character and the green Event among the 5; not the red Event, not <Ranged>, not the 6th card.
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'deck', SLASH3), g.find('p1', 'deck', GREEN_EVENT)].sort(),
    );
    pick(g, [g.find('p1', 'deck', GREEN_EVENT)]);
    expect(hand(g, 'p1')).toEqual([GREEN_EVENT]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(GREEN_EVENT);
    finishOrder(g);
    expect(atMain(g)).toBe(true);
    const deck = deckOf(g);
    expect(deck).toHaveLength(DECK.length - 1);
    expect(deck.slice(0, 2)).toEqual([SLASH1, V.c1]);
    expect(deck.slice(2).sort()).toEqual([SLASH3, RED_EVENT, RANGED4, V.c5].sort());
  });

  it('a <Slash> Character of any cost can be taken instead', () => {
    const g = board();
    activate(g, hiyori(g), AB);
    pick(g, [g.find('p1', 'deck', SLASH3)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SLASH3]);
  });

  it('"up to 1": taking nothing is allowed, and all 5 go to the bottom', () => {
    const g = board();
    activate(g, hiyori(g), AB);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(deckOf(g).slice(0, 2)).toEqual([SLASH1, V.c1]);
    expect(deckOf(g)).toHaveLength(DECK.length);
  });

  it('"If your Leader is [Roronoa Zoro]" follows the cost: with another Leader the cost is paid and nothing is looked at', () => {
    const g = board(PLAIN_BLUE);
    activate(g, hiyori(g), AB);
    expect(atMain(g)).toBe(true);
    expect(g.card(hiyori(g)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(deckOf(g)).toEqual(DECK);
    expect(g.eventsOfType('CardsLooked')).toHaveLength(0);
  });

  it('is not offered when Hiyori is rested or there is no active DON!! to rest', () => {
    const rested = board(ZORO_LEADER, { characters: [{ card: ID, rested: true }] });
    expect(offeredAb(rested, hiyori(rested), AB)).toBe(false);
    const noDon = mine(ZORO_LEADER, { characters: [ID], deck: DECK }, {}, 0, 2);
    expect(offeredAb(noDon, hiyori(noDon), AB)).toBe(false);
    expect(offeredAb(board(), hiyori(board()), AB)).toBe(true);
  });
});

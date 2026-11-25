/** OP12-034 Perona. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play, V } from './helpers.ts';
import {
  atMain,
  finishOrder,
  GREEN_EVENT,
  mine,
  offered,
  OTHER_LEADER,
  RANGED4,
  RED_EVENT,
  SLASH1,
  SLASH3,
  SLASH_LEADER,
} from './helpers-lfa.ts';

const ID = 'OP12-034';
/** Top 5: a <Slash> Character, a green Event, a red Event and two <Ranged> Characters; below them a <Slash> one. */
const DECK = [SLASH3, GREEN_EVENT, RED_EVENT, RANGED4, V.c5, SLASH1, V.c1];
const board = (leader: string) => mine(leader, { hand: [ID], deck: DECK }, {}, 1);
const deckOf = (g: ReturnType<typeof board>) => g.zone('p1', 'deck').map((c) => c.card);

describe('OP12-034 Perona', () => {
  it('[On Play] with a <Slash> Leader: look at 5, add a <Slash> card or green Event, the rest go to the bottom', () => {
    const g = board(SLASH_LEADER);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(g.eventsOfType('CardsLooked')).toHaveLength(1);
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'deck', SLASH3), g.find('p1', 'deck', GREEN_EVENT)].sort(),
    );
    pick(g, [g.find('p1', 'deck', SLASH3)]);
    expect(hand(g, 'p1')).toEqual([SLASH3]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(SLASH3);
    finishOrder(g);
    expect(atMain(g)).toBe(true);
    expect(deckOf(g).slice(0, 2)).toEqual([SLASH1, V.c1]);
    expect(deckOf(g)).toHaveLength(DECK.length - 1);
  });

  it('a green Event can be taken; a red Event and a <Ranged> Character cannot', () => {
    const g = board(SLASH_LEADER);
    play(g, ID);
    expect(offered(g)).not.toContain(g.find('p1', 'deck', RED_EVENT));
    expect(offered(g)).not.toContain(g.find('p1', 'deck', RANGED4));
    pick(g, [g.find('p1', 'deck', GREEN_EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([GREEN_EVENT]);
  });

  it('"up to 1": none is allowed', () => {
    const g = board(SLASH_LEADER);
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(deckOf(g)).toHaveLength(DECK.length);
    expect(deckOf(g).slice(0, 2)).toEqual([SLASH1, V.c1]);
  });

  it('must not look with a Leader that is not <Slash>: the ability fires and nothing happens', () => {
    const g = board(OTHER_LEADER);
    play(g, ID);
    expect(atMain(g)).toBe(true);
    expect(deckOf(g)).toEqual(DECK);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.eventsOfType('CardsLooked')).toHaveLength(0);
  });
});

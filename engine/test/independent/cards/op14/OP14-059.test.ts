/**
 * OP14-059 Please Take Me with You!! I Can Be of Great Help to You!! (Event, Blue, cost 1,
 * {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}).
 *
 * Card text: "[Main] If your Leader is [Jinbe] and you have 2 or less cards in your hand, draw 2 cards.
 * [Trigger] Return up to 1 Character with a cost of 4 or less to the owner's hand."
 *
 * Rules: CR 2-1-2 (a [Name] reference is an exact card name), CR 8-4-2 (an Event is trashed before its
 * effect is carried out, so it is not in the hand when the hand size is checked), CR 8-3-3, CR 4-8-1.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  C14,
  canFinish,
  choose,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  inst,
  L14,
  mine,
  need,
  offeredNow,
  put,
  theirs,
  trash,
} from './kit-op14b.ts';

const EVT = 'OP14-059';
const DECK = [C14.kingdew, C14.thatch, C14.marco, BLUE, BLUE];

function start(leader: string, handExtra: string[], chars: string[] = []) {
  return mine(leader, { hand: [EVT, ...handExtra], deck: DECK, characters: chars });
}

describe('OP14-059 Please Take Me with You!!: [Main] with a [Jinbe] Leader and 2 or fewer cards in hand draw 2; [Trigger] return a Character (cost 4 or less)', () => {
  it('[Main] Leader [Jinbe] (OP14-040), 2 other cards in hand: draws 2', () => {
    const g = start(L14.jinbe, [C14.sai, C14.camie]);
    put(g, EVT);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C14.sai, C14.camie, C14.kingdew, C14.thatch].sort());
    expect(deck(g)).toHaveLength(3);
    expect(trash(g)).toEqual([EVT]);
  });

  it('[Main] boundary: 3 other cards in hand (the Event is not counted once played): draws nothing', () => {
    const g = start(L14.jinbe, [C14.sai, C14.camie, C14.doma]);
    put(g, EVT);
    expect(hand(g)).toEqual([C14.sai, C14.camie, C14.doma].sort());
    expect(deck(g)).toHaveLength(5);
  });

  it('[Main] boundary: 1 other card and 0 other cards in hand both draw 2', () => {
    const one = start(L14.jinbe, [C14.sai]);
    put(one, EVT);
    expect(hand(one)).toHaveLength(3);
    const none = start(L14.jinbe, []);
    put(none, EVT);
    expect(hand(none)).toHaveLength(2);
  });

  it('[Main] the other [Jinbe] Leader (OP11-021) also qualifies', () => {
    const g = start(L14.jinbe2, [C14.sai]);
    put(g, EVT);
    expect(hand(g)).toHaveLength(3);
  });

  it('[Main] a Leader that is not [Jinbe] (a {Fish-Man} Leader): draws nothing even with an empty hand', () => {
    const g = start(L14.fish, []);
    put(g, EVT);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(5);
  });

  it('[Main] a [Jinbe] Character does not stand in for the Leader: with a Leader that is not [Jinbe] nothing is drawn', () => {
    const g = start(L14.luffy, [], [C14.jinbe2]);
    put(g, EVT);
    expect(hand(g)).toEqual([]);
  });

  it('[Main] draws exactly 2 cards, not more', () => {
    const g = start(L14.jinbe, []);
    put(g, EVT);
    expect(hand(g)).toHaveLength(2);
    expect(deck(g)).toHaveLength(3);
  });

  it("[Trigger] returns a Character of cost 4 to its owner's hand; a Character of cost 5 is not offered", () => {
    const g = theirs(
      L14.jinbe,
      { life: [EVT, BLUE, BLUE, BLUE] },
      { characters: [C14.hajrudin, C14.kingdew, C14.camie] },
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.camie, C14.hajrudin].sort());
    choose(g, [inst(g, 'p2', 'characters', C14.hajrudin)]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([C14.camie, C14.kingdew].sort());
    expect(hand(g, 'p2').filter((c) => c === C14.hajrudin)).toHaveLength(1);
  });

  it('[Trigger] works with any Leader (no [Jinbe] needed) and may also return my own Character', () => {
    const g = theirs(
      L14.luffy,
      { life: [EVT, BLUE, BLUE, BLUE], characters: [C14.sai] },
      { characters: [C14.kingdew] },
    );
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.sai]);
  });

  it('[Trigger] "up to 1": may return nothing', () => {
    const g = theirs(L14.jinbe, { life: [EVT, BLUE, BLUE, BLUE] }, { characters: [C14.hajrudin] });
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.hajrudin]);
  });

  it('[Trigger] declined: the card goes to hand and nothing is returned', () => {
    const g = theirs(L14.jinbe, { life: [EVT, BLUE, BLUE, BLUE] }, { characters: [C14.hajrudin] });
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVT]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([C14.hajrudin]);
  });
});

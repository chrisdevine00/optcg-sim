/**
 * OP14-057 Don't Worry!! I'm Here!! (Event, Blue, cost 2, {Fish-Man}/{The Seven Warlords of the Sea}/{The Sun Pirates}).
 *
 * Card text: "[Main] All of your {Fish-Man} or {Merfolk} type Leader and Character cards gain +1000
 * power during this turn.
 * [Trigger] Draw 2 cards."
 *
 * Rules: CR 6-6-1-2 ("during this turn" ends with the turn), CR 2-4-3 (exact type), CR 4-4 (an Event
 * with only [Main] cannot be used in the Counter Step). Not asserted (no official ruling): whether a
 * Character that arrives after the Event resolved is covered.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C14,
  canCounterWith,
  declineTrigger,
  deck,
  don,
  endTurn,
  hand,
  hitLeader,
  inst,
  L14,
  mine,
  need,
  put,
  theirs,
  trash,
} from './kit-op14b.ts';
import { attack, passBlock } from '../../helpers.ts';

const EVT = 'OP14-057';

function start(
  leader: string,
  chars: string[],
  p2chars: string[] = [],
  p2Leader: string = L14.luffy,
) {
  return mine(leader, { hand: [EVT], characters: chars }, { characters: p2chars }, p2Leader);
}

describe("OP14-057 Don't Worry!! I'm Here!!: [Main] my {Fish-Man}/{Merfolk} Leader and Characters +1000 this turn; [Trigger] draw 2", () => {
  it('[Main] a {Fish-Man} Leader, a {Fish-Man} Character and a {Merfolk} Character each gain +1000', () => {
    const g = start(L14.fish, [C14.namule, C14.camie]);
    put(g, EVT);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(6000);
    expect(g.power(inst(g, 'p1', 'characters', C14.camie))).toBe(4000);
  });

  it('[Main] a {Merfolk} Leader is covered too', () => {
    const g = start(L14.merfolk, []);
    put(g, EVT);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('[Main] Characters of other types gain nothing (Marco {Former Whitebeard Pirates}, Praline is a {Merfolk} so it does)', () => {
    const g = start(L14.fish, [C14.marco, C14.praline]);
    put(g, EVT);
    expect(g.power(inst(g, 'p1', 'characters', C14.marco))).toBe(5000);
    expect(g.power(inst(g, 'p1', 'characters', C14.praline))).toBe(6000);
  });

  it('[Main] a Leader without {Fish-Man}/{Merfolk} gains nothing while the Characters that qualify do', () => {
    const g = start(L14.luffy, [C14.namule]);
    put(g, EVT);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(6000);
  });

  it("[Main] the opponent's {Fish-Man} Leader and Characters gain nothing", () => {
    const g = start(L14.fish, [], [C14.jinbe4], L14.hody);
    put(g, EVT);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(g.power(inst(g, 'p2', 'characters', C14.jinbe4))).toBe(6000);
  });

  it('[Main] the Event costs 2 DON!!', () => {
    const g = start(L14.fish, []);
    put(g, EVT);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(trash(g)).toEqual([EVT]);
  });

  it("[Main] the bonus lasts this turn only: it is gone when the opponent's turn starts", () => {
    const g = start(L14.fish, [C14.namule]);
    put(g, EVT);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Main] the bonus counts in battle this turn: a boosted 5000 Character wins against a rested 6000 one only with +1000', () => {
    const g = mine(
      L14.fish,
      { hand: [EVT], characters: [C14.namule] },
      { characters: [{ card: C14.hajrudin, rested: true }] },
    );
    put(g, EVT);
    attack(g, inst(g, 'p1', 'characters', C14.namule), inst(g, 'p2', 'characters', C14.hajrudin));
    passBlock(g);
    need(g, 'counter', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', C14.namule))).toBe(6000);
  });

  it('[Main] with no qualifying card nothing happens and the Event is still spent', () => {
    const g = start(L14.luffy, [C14.marco]);
    put(g, EVT);
    expect(atMain(g)).toBe(true);
    expect(g.power(inst(g, 'p1', 'characters', C14.marco))).toBe(5000);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] activated from the Life area: draws 2 cards (the Event itself is not added to the hand)', () => {
    const g = theirs(
      L14.luffy,
      { life: [EVT, BLUE, BLUE, BLUE], deck: [C14.kingdew, C14.thatch, BLUE, BLUE] },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    expect(hand(g)).toEqual([C14.kingdew, C14.thatch].sort());
    expect(deck(g)).toHaveLength(2);
    expect(g.life('p1')).toBe(3);
  });

  it('[Trigger] declined: the card goes to hand and nothing is drawn', () => {
    const g = theirs(
      L14.luffy,
      { life: [EVT, BLUE, BLUE, BLUE], deck: [C14.kingdew, C14.thatch, BLUE, BLUE] },
      {},
    );
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([EVT]);
    expect(deck(g)).toHaveLength(4);
  });

  it('it has no [Counter]: it cannot be used in the Counter Step', () => {
    const g = theirs(L14.fish, { hand: [EVT], costArea: { active: 5, rested: 0 } }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVT))).toBe(false);
  });
});

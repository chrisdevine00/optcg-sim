/**
 * OP17-019 I Don't Have Time to Chat with Snot-Nosed Brats (Event, Red, cost 1, {The Four Emperors}/
 * {Whitebeard Pirates}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 card with a type including
 * "Whitebeard Pirates" and add it to your hand. Then, place the rest at the bottom of your deck in
 * any order.
 * [Trigger] Your Leader gains +1000 power during this turn."
 *
 * Rules: CR 8-4-4-2 (a hidden-area search may take none), CR 8-4-4-4, CR 4-6-3 ([Trigger]), RL-09
 * ("during this turn"), "a type including".
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, passBlock } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  checkLook,
  declineTrigger,
  deck,
  describeLookAdd,
  endTurn,
  expectMain,
  hand,
  kind,
  LD,
  lp,
  mine,
  noDefenceUntilTrigger,
  playCard,
  RED,
  theirs,
  VAN,
  WB,
  YL,
} from './kit-op17a.ts';

const EVENT = 'OP17-019';
/** OP02-022 Whitebeard Pirates: an Event with the type {Whitebeard Pirates}. */
const WB_EVENT = 'OP02-022';

describeLookAdd({
  id: EVENT,
  title: 'I Don’t Have Time to Chat [Main]',
  n: 5,
  match: [WB.doma, WB.jil],
  miss: VAN.mohji,
  beyond: WB.kingdew,
});

describe('OP17-019 [Main]: what counts as "a type including Whitebeard Pirates"', () => {
  function start(top: string[]) {
    const g = mine(YL.neutral, { hand: [EVENT], deck: [...top, ...fill(BLUE, 12)] });
    playCard(g, EVENT);
    return g;
  }

  it('Characters of every Whitebeard Pirates family are candidates ({Whitebeard Pirates Allies}, {Former Whitebeard Pirates}, plain)', () => {
    const g = start([WB.doma, WB.formerMarco, WB.jil, VAN.mohji, VAN.gordon]);
    checkLook(g, { candidates: [WB.doma, WB.formerMarco, WB.jil], pick: [WB.formerMarco] });
    expect(hand(g)).toEqual([WB.formerMarco]);
  });

  it('"a card", not "a Character card": a Whitebeard Pirates Event among the five is a candidate', () => {
    const g = start([WB_EVENT, VAN.mohji, VAN.mohji, VAN.mohji, VAN.mohji]);
    checkLook(g, { candidates: [WB_EVENT], pick: [WB_EVENT] });
    expect(hand(g)).toEqual([WB_EVENT]);
  });

  it('the revealed card goes to hand and exactly the other four go to the bottom (deck: 12 + 4)', () => {
    const g = start([WB.jil, VAN.mohji, VAN.gordon, VAN.mohji, VAN.gordon]);
    checkLook(g, { candidates: [WB.jil], pick: [WB.jil] });
    expect(hand(g)).toEqual([WB.jil]);
    expect(deck(g)).toHaveLength(16);
    expect(deck(g).slice(0, 12)).toEqual(fill(BLUE, 12));
  });
});

describe('OP17-019 [Trigger]: your Leader gains +1000 power during this turn', () => {
  /** p2’s Leader hits my Leader (5000 vs 5000) and the Life card taken is this Event. */
  function struck(life: string[] = [EVENT, ...fill(BLUE, 3)]) {
    const g = theirs(LD.luffy, { life }, { characters: [WB.kingdew] });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    return g;
  }

  it('the Trigger is offered; activating it gives the Leader +1000 (6000)', () => {
    const g = struck();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(lp(g, 'p1')).toBe(6000);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([]);
  });

  it('declining the Trigger adds the card to hand and gives no boost', () => {
    const g = struck();
    declineTrigger(g);
    expect(lp(g, 'p1')).toBe(5000);
    expect(hand(g)).toEqual([EVENT]);
  });

  it('RL-09: the boost lasts the whole turn: a second attack faces a 6000 Leader (the 5000 Kingdew... 7000 still wins; the Leader stays 6000 after the first battle)', () => {
    const g = struck();
    activateTrigger(g);
    expectMain(g, 'p2');
    expect(lp(g, 'p1')).toBe(6000);
  });

  it('RL-09: the boost ends at the end of the turn', () => {
    const g = struck();
    activateTrigger(g);
    endTurn(g);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('only the Leader gains power, not my Characters', () => {
    const g = theirs(
      LD.luffy,
      { life: [EVENT, ...fill(BLUE, 3)], characters: [WB.jil] },
      { characters: [WB.kingdew] },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    expect(g.power(g.find('p1', 'characters', WB.jil))).toBe(6000);
    expect(lp(g, 'p1')).toBe(6000);
    void passBlock;
    void RED;
  });
});

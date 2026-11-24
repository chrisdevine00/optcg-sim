/**
 * EB05-004 Baby 5 (Character, Red, cost 4, 6000, no Counter, {Donquixote Pirates}/{Punk Hazard}).
 *
 * Card text: "[On Play] You may reveal 2 Event cards from your hand: Draw 2 cards.
 * [On K.O.] Play up to 1 Character card with 6000 power or less from your hand rested."
 *
 * Rules: CR 8-3-1-3/-4 (costs: optional, all-or-nothing), CR 11-2-2 (revealed cards stay in hand),
 * CR 8-4-4-1 ("up to" allows 0), CR 10-2-17 ([On K.O.]), CR 10-2-1-3 (trash is not K.O.).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, noDefence } from '../../helpers.ts';
import {
  accept,
  BLUE,
  chars,
  chooseNone,
  choiceCards,
  decline,
  deck,
  EV,
  EL,
  hand,
  kind,
  mine,
  offered,
  payWith,
  playCard,
  reachablePickSets,
  settleYes,
  skipUnusable,
  theirs,
  VAN,
  EC,
  inHand,
  choose,
  chooseCards,
} from './kit-eb05a.ts';

const BABY = 'EB05-004';

function played(inHand: string[]) {
  const g = mine(EL.croc, { hand: [BABY, ...inHand], deck: fill(BLUE, 12) });
  playCard(g, BABY);
  return g;
}

describe('EB05-004 Baby 5: [On Play] reveal 2 Event cards: draw 2', () => {
  it('revealing 2 Events draws 2 cards; the revealed Events stay in hand', () => {
    const g = played([EV.redA, EV.redB]);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payWith(g, [inHand(g, EV.redA), inHand(g, EV.redB)]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([BLUE, BLUE, EV.redA, EV.redB].sort());
    expect(deck(g)).toHaveLength(10);
    expect(chars(g)).toEqual([BABY]);
  });

  it('CR 8-3-1-4: declining the cost draws nothing and Baby 5 is still played', () => {
    const g = played([EV.redA, EV.redB]);
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(hand(g)).toEqual([EV.redA, EV.redB].sort());
    expect(deck(g)).toHaveLength(12);
    expect(chars(g)).toEqual([BABY]);
  });

  it('CR 8-3-1-3: with only 1 Event in hand the cost cannot be paid', () => {
    const g = played([EV.redA, VAN.mohji]);
    skipUnusable(g, 'p1');
    expect(hand(g)).toEqual([EV.redA, VAN.mohji].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('non-Event cards cannot be revealed for the cost', () => {
    const g = played([EV.redA, EV.redB, VAN.mohji, EC.fullbody]);
    accept(g);
    const cards = new Set([...reachablePickSets(g)].flatMap((s) => s.split('+')).filter(Boolean));
    expect([...cards].sort()).toEqual([EV.redA, EV.redB].sort());
  });

  it('exactly 2 Events are revealed even when 3 are in hand (the player picks which)', () => {
    const g = played([EV.redA, EV.redB, EV.redC]);
    accept(g);
    const sets = [...reachablePickSets(g)].filter(Boolean);
    expect(sets.length).toBeGreaterThan(0);
    for (const s of sets) expect(s.split('+')).toHaveLength(2);
    expect(sets).toContain([EV.redA, EV.redB].sort().join('+'));
    expect(sets).toContain([EV.redB, EV.redC].sort().join('+'));
  });

  it('any color of Event counts (a Yellow Event is a legal reveal)', () => {
    const g = played([EV.redA, EV.yellow]);
    accept(g);
    payWith(g, [inHand(g, EV.redA), inHand(g, EV.yellow)]);
    settleYes(g, 'p1');
    expect(deck(g)).toHaveLength(10);
  });

  it('draws exactly 2, not more, with 3 Events in hand', () => {
    const g = played([EV.redA, EV.redB, EV.redC]);
    accept(g);
    choose(g, [inHand(g, EV.redA), inHand(g, EV.redB)]);
    settleYes(g, 'p1');
    expect(hand(g)).toHaveLength(5);
  });
});

describe('EB05-004 Baby 5: [On K.O.] play up to 1 Character with 6000 power or less from hand, rested', () => {
  /** p2's Kingdew (7000) K.O.s p1's rested Baby 5 (6000). */
  function koed(inHand: string[]) {
    const g = theirs(
      EL.croc,
      { characters: [{ card: BABY, rested: true }], hand: inHand },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', BABY));
    noDefence(g);
    return g;
  }

  it('plays the chosen Character rested; 6000 is allowed, 7000 is not', () => {
    const g = koed([VAN.hajrudin, VAN.kingdew, VAN.mohji]);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.mohji].sort());
    chooseCards(g, [VAN.hajrudin]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([VAN.hajrudin]);
    const inst = g.find('p1', 'characters', VAN.hajrudin);
    expect(g.card(inst).rested).toBe(true);
    expect(hand(g)).toEqual([VAN.kingdew, VAN.mohji].sort());
  });

  it('"up to 1": may play nothing', () => {
    const g = koed([VAN.hajrudin]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([VAN.hajrudin]);
  });

  it('plays only 1 even with two candidates', () => {
    const g = koed([VAN.hajrudin, VAN.mohji]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no eligible Character in hand nothing is played', () => {
    const g = koed([VAN.kingdew, EV.redA]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([VAN.kingdew, EV.redA].sort());
  });

  it('Events are not Character cards and are not offered', () => {
    const g = koed([EV.redA, VAN.mohji]);
    expect(choiceCards(g)).toEqual([VAN.mohji]);
  });

  it('does not trigger when Baby 5 survives the battle', () => {
    const g = theirs(
      EL.croc,
      { characters: [{ card: BABY, rested: true }], hand: [VAN.mohji] },
      { characters: [VAN.sunny] },
    );
    attack(g, g.find('p2', 'characters', VAN.sunny), g.find('p1', 'characters', BABY));
    noDefence(g);
    expect(chars(g)).toEqual([BABY]);
    expect(kind(g)).toBe('main');
  });
});

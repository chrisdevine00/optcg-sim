/**
 * OP14-013 Monkey.D.Luffy (Character, cost 1, 0 power, Counter +1000, {Straw Hat Crew}/{Supernovas}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Supernovas} type
 * card other than [Monkey.D.Luffy] and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order.
 * [When Attacking] Give up to 1 of your opponent's Characters -1000 power during this turn."
 *
 * Rules: "other than [Monkey.D.Luffy]" excludes every card with that NAME, whatever the card number
 * (the card name, not the card number). Any card category qualifies, not only Characters. A card added from the
 * deck by an effect is revealed (CR 11-2-1). "Up to 1" may be none. An attacker with 0 power may
 * still attack (power only decides battles).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  chr,
  deck,
  endTurn,
  fill,
  hand,
  hasEvent,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  reachablePickSets,
  S14,
  settleEmpty,
  settleOrders,
  swing,
  tail,
} from './kit-op14a.ts';

const LUFFY = 'OP14-013';
/** OP14-018: Event with the Supernovas type. */
const SN_EVENT = 'OP14-018';
/** ST16-005 Monkey.D.Luffy: green Supernovas Character named [Monkey.D.Luffy]. */
const NAMED = 'ST16-005';

function played(top: string[]) {
  const g = mine(LD14.luffy, {
    hand: [LUFFY],
    deck: [...top, ...fill(BLUE, 12)],
  });
  playRaw(g, LUFFY);
  return g;
}

const FIVE = [S14.zoroSn, S14.killer2, SN_EVENT, NAMED, S14.dadan];

describe('OP14-013 Monkey.D.Luffy: [On Play] look at 5, add up to 1 {Supernovas} other than [Monkey.D.Luffy]', () => {
  it('offers the Supernovas cards of any category, not the one named Monkey.D.Luffy, not other types', () => {
    const g = played(FIVE);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.killer2, S14.zoroSn, SN_EVENT].sort());
  });

  it('adds the chosen card to hand, revealed, and puts the other four at the bottom', () => {
    const g = played(FIVE);
    pickInst(g, [g.find('p1', 'deck', SN_EVENT)]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([SN_EVENT]);
    expect(hasEvent(g, 'CardRevealed', { card: SN_EVENT })).toBe(true);
    expect(deck(g)).toHaveLength(16);
    expect(tail(deck(g), 4)).toEqual([S14.zoroSn, S14.killer2, NAMED, S14.dadan].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('"up to 1": adding nothing sends all 5 to the bottom', () => {
    const g = played(FIVE);
    need(g, 'choose', 'p1');
    none(g);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([...FIVE].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('adds at most 1 card even when three qualify', () => {
    const sets = reachablePickSets(played(FIVE));
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a Supernovas card in 6th place is not offered', () => {
    const g = played([S14.dadan, S14.dadan, S14.dadan, S14.dadan, S14.dadan, S14.zoroSn]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(S14.zoroSn);
  });

  it('a second copy of OP14-013 (same name) is not offered', () => {
    const g = played([LUFFY, S14.zoroSn, S14.dadan, S14.dadan, S14.dadan]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.zoroSn]);
  });
});

function attacking(p2chars: string[] = [S14.marco, S14.sai]) {
  return mine(LD14.luffy, { characters: [LUFFY] }, { characters: p2chars });
}

describe('OP14-013 Monkey.D.Luffy: [When Attacking] -1000 power to up to 1 opposing Character', () => {
  it('gives -1000 to the chosen opposing Character; the 0-power attacker may attack', () => {
    const g = attacking();
    expect(g.power(at(g, 'p1', 'characters', LUFFY))).toBe(0);
    swing(g, LUFFY);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.marco, S14.sai].sort());
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(4000);
    expect(g.power(chr(g, 'p2', S14.sai))).toBe(4000);
    expect(kind(g)).toBe('block');
  });

  it('"up to 1": choosing nothing changes no power', () => {
    const g = attacking();
    swing(g, LUFFY);
    none(g);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
  });

  it('never targets the opposing Leader', () => {
    const g = attacking();
    swing(g, LUFFY);
    expect(offeredIds(g)).not.toContain(LD14.luffy);
    none(g);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('with no opposing Characters the effect finds nothing and the attack goes on', () => {
    const g = attacking([]);
    swing(g, LUFFY);
    settleEmpty(g);
    expect(kind(g)).toBe('block');
  });

  it('the -1000 lasts until the end of the turn only', () => {
    const g = attacking();
    attack(g, at(g, 'p1', 'characters', LUFFY), g.leader('p2'));
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    passBlock(g);
    passCounter(g);
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(4000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(chr(g, 'p2', S14.marco))).toBe(5000);
  });
});

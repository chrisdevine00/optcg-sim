/**
 * EB02-056 Vegapunk (Yellow Character, cost 5, 0 power, Counter +1000, {Scientist}/{Egghead}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Look at 5 cards from the top of your deck; play up to 1 "Scientist" type
 * Character card with a cost of 5 or less other than [Vegapunk]. Then, place the rest at the bottom of
 * your deck in any order and if your opponent has 2 or less Characters, trash 1 card from your hand.
 * [Trigger] Draw 1 card."
 *
 * Rules: only the top 5 are looked at; the quoted type matches any type including "Scientist"; [Vegapunk]
 * is excluded by name; "up to 1" may be 0; the rest go to the bottom in an order the owner chooses; the
 * hand trash is exactly 1 and needs the OPPONENT to have 2 or less Characters (own Characters do not
 * count).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateTrigger,
  attack,
  blockers,
  canFinish,
  chars,
  deck,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LE,
  mine,
  need,
  none,
  noDefence,
  offeredIds,
  orderFirst,
  pickCards,
  playRaw,
  SE,
  tail,
  theirs,
  trash,
  kw,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const VEGA = 'EB02-056';
/** The six cards below the top 5. */
const BELOW = [SE.shaka5, ...Array(8).fill(SE.mohji)];
const TOP5 = [SE.atlas5, SE.pythagoras6, SE.vegapunk1, SE.mohji, SE.indigo2];

function start(top: string[], o: { opp?: string[]; hand?: string[]; own?: string[] } = {}) {
  const g = mine(
    LE.luffy,
    { hand: [VEGA, ...(o.hand ?? [SE.sai])], characters: o.own ?? [], deck: [...top, ...BELOW] },
    { characters: o.opp ?? [SE.marco, SE.sai] },
  );
  playRaw(g, VEGA);
  return g;
}

describe('EB02-056 Vegapunk: printed values, [Blocker] and [Trigger]', () => {
  it('cost 5, 0 power, Counter +1000, [Blocker]', () => {
    const g = mine(LE.luffy, { characters: [VEGA] });
    const v = ch(g, 'p1', VEGA);
    expect(g.card(v).cost).toBe(5);
    expect(g.power(v)).toBe(0);
    expect(g.card(v).counter).toBe(1000);
    expect(kw(g, v)).toContain('Blocker');
  });

  it('blocks an attack on the Leader', () => {
    const g = theirs(LE.luffy, { characters: [VEGA] });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([ch(g, 'p1', VEGA)]);
    act(g, { type: 'block', blocker: ch(g, 'p1', VEGA) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });

  it('[Trigger] draws 1 card when activated from Life', () => {
    const g = theirs(LE.luffy, { life: [VEGA, SE.mohji, SE.mohji, SE.mohji] });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(14);
  });

  it('[Trigger] declined: the card goes to the hand and nothing is drawn', () => {
    const g = theirs(LE.luffy, { life: [VEGA, SE.mohji, SE.mohji, SE.mohji] });
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([VEGA]);
    expect(deck(g)).toHaveLength(15);
  });
});

describe('EB02-056 Vegapunk: [On Play] look at 5, play a "Scientist" Character (cost 5 or less, not [Vegapunk]), rest to the bottom', () => {
  it('offers Scientist Characters with cost 5 or less other than [Vegapunk], from the top 5 only', () => {
    const g = start(TOP5);
    need(g, 'choose', 'p1');
    // Atlas (5) and Dr. Indigo (2, {FILM}/{Scientist}/...) qualify; Pythagoras costs 6, ST21-013 is named [Vegapunk], Mohji is no Scientist.
    // Shaka (cost 5, a Scientist) is the 6th card and is not looked at.
    expect(offeredIds(g)).toEqual([SE.atlas5, SE.indigo2].sort());
  });

  it('plays the chosen card active onto the field; the other 4 go to the bottom, the 6th card is now on top', () => {
    const g = start(TOP5);
    pickCards(g, [SE.atlas5]);
    orderFirst(g);
    // The trash prompt of the second half may follow (opponent has 2 Characters).
    need(g, 'choose', 'p1');
    pickCards(g, [SE.sai]);
    expect(chars(g)).toEqual([VEGA, SE.atlas5].sort());
    expect(g.card(ch(g, 'p1', SE.atlas5)).rested).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(SE.shaka5);
    expect(deck(g)).toHaveLength(13);
    expect(tail(deck(g), 4)).toEqual([SE.pythagoras6, SE.vegapunk1, SE.mohji, SE.indigo2].sort());
  });

  it('"up to 1": may play nothing; all 5 cards go to the bottom', () => {
    const g = start(TOP5, { opp: [SE.marco, SE.sai, SE.hajrudin] });
    none(g);
    orderFirst(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([VEGA]);
    expect(deck(g)[0]).toBe(SE.shaka5);
    expect(tail(deck(g), 5)).toEqual([...TOP5].sort());
  });

  it('plays at most 1 Character even when two qualify', () => {
    const g = start(TOP5, { opp: [SE.marco, SE.sai, SE.hajrudin] });
    pickCards(g, [SE.indigo2]);
    orderFirst(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([VEGA, SE.indigo2].sort());
    expect(tail(deck(g), 4)).toEqual([SE.atlas5, SE.pythagoras6, SE.vegapunk1, SE.mohji].sort());
  });

  it('opponent with 3 Characters (boundary): no card is trashed from the hand', () => {
    const g = start(TOP5, { opp: [SE.marco, SE.sai, SE.hajrudin], hand: [SE.sai, SE.marco] });
    pickCards(g, [SE.atlas5]);
    orderFirst(g);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SE.sai, SE.marco].sort());
    expect(trash(g)).toEqual([]);
  });

  it("opponent with 2 Characters (boundary): trashes exactly 1 card from the hand of the player's choice", () => {
    const g = start(TOP5, { opp: [SE.marco, SE.sai], hand: [SE.sai, SE.marco] });
    pickCards(g, [SE.atlas5]);
    orderFirst(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    expect(offeredIds(g)).toEqual([SE.sai, SE.marco].sort());
    pickCards(g, [SE.marco]);
    expect(hand(g)).toEqual([SE.sai]);
    expect(trash(g)).toEqual([SE.marco]);
  });

  it('opponent with 0 Characters: the hand trash applies as well, even when nothing was played', () => {
    const g = start(TOP5, { opp: [], hand: [SE.sai] });
    none(g);
    orderFirst(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SE.sai]);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SE.sai]);
  });

  it("only the opponent's Characters count: 3 own Characters do not stop the hand trash", () => {
    const g = start(TOP5, {
      opp: [SE.marco],
      hand: [SE.sai],
      own: [SE.mohji, SE.komachiyo, SE.hajrudin],
    });
    none(g);
    orderFirst(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SE.sai]);
    expect(trash(g)).toEqual([SE.sai]);
  });

  it('with no qualifying Scientist in the top 5 all 5 go to the bottom (and the hand trash still follows)', () => {
    const g = start([SE.mohji, SE.pythagoras6, SE.vegapunk1, SE.marco, SE.sai], {
      opp: [SE.marco, SE.sai, SE.hajrudin],
    });
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    orderFirst(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([VEGA]);
    expect(deck(g)[0]).toBe(SE.shaka5);
    expect(tail(deck(g), 5)).toEqual(
      [SE.mohji, SE.pythagoras6, SE.vegapunk1, SE.marco, SE.sai].sort(),
    );
  });
});

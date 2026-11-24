/**
 * OP11-099 I'm Gonna Be a Navy Officer!!! (Event, Black, cost 1, {Navy}/{East Blue}).
 *
 * Card text: "[Main] Look at 3 cards from the top of your deck; reveal up to 1 "Navy" type card other
 * than [I'm Gonna Be a Navy Officer!!!] and add it to your hand. Then, trash the rest.
 * [Trigger] Activate this card's [Main] effect."
 *
 * Rules: CR 8-4-4 ("up to"), type match CR 2-4-3, the revealed card is public, the rest go to the
 * trash (no order choice for the trash), RL-26 (decks keep at least 1 card).
 * Scenery: OP02-097 Komille, OP02-107 Doberman (Navy), OP01-023 Marco (not Navy), EB05-029 (Navy Event).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  cnt,
  declineTrigger,
  deckSize,
  hand,
  hitLeader,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SC11,
  them,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-099';
const NAVY_EVENT = 'EB05-029';

function start(deck: string[]) {
  const g = me(LD11.plain, { hand: [ID], deck });
  playRaw(g, ID);
  return g;
}

describe('OP11-099 I’m Gonna Be a Navy Officer!!!: look at 3, add 1 {Navy} card, trash the rest', () => {
  it('printed effect: the chosen {Navy} card goes to my hand and the other 2 looked-at cards are trashed', () => {
    const g = start([SC11.navyB1, SC11.r2, SC11.r3, SC11.r4, SC11.r5]);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'deck', SC11.navyB1)]);
    expect(hand(g)).toEqual([SC11.navyB1]);
    expect(trash(g)).toEqual([ID, SC11.r2, SC11.r3].sort());
    expect(deckSize(g)).toBe(2);
    expect(kind(g)).toBe('main');
  });

  it('only the top 3 cards are looked at: a {Navy} card in 4th place is not offered', () => {
    const g = start([SC11.navyB1, SC11.r2, SC11.r3, SC11.navyB2, SC11.r5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.navyB1]);
  });

  it('non-{Navy} cards among the 3 are not offered', () => {
    const g = start([SC11.r1, SC11.navyB2, SC11.navyG4, SC11.r4]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.navyB2, SC11.navyG4].sort());
  });

  it('"up to 1": I may take none, and then all 3 looked-at cards are trashed', () => {
    const g = start([SC11.navyB1, SC11.navyB2, SC11.r3, SC11.r4, SC11.r5]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SC11.navyB1, SC11.navyB2, SC11.r3].sort());
    expect(deckSize(g)).toBe(2);
  });

  it('only 1 card may be added even with 3 {Navy} cards looked at', () => {
    const g = start([SC11.navyB1, SC11.navyB2, SC11.navyB3, SC11.r4, SC11.r5]);
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(1);
    pickInst(g, [at(g, 'p1', 'deck', SC11.navyB2)]);
    expect(hand(g)).toEqual([SC11.navyB2]);
    expect(trash(g)).toEqual([ID, SC11.navyB1, SC11.navyB3].sort());
  });

  it('a second copy of itself is excluded ("other than [I’m Gonna Be a Navy Officer!!!]")', () => {
    const g = start([ID, SC11.navyB2, SC11.r3, SC11.r4, SC11.r5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.navyB2]);
  });

  it('an Event with the {Navy} type qualifies (any {Navy} card, not only Characters)', () => {
    const g = start([NAVY_EVENT, SC11.r2, SC11.r3, SC11.r4, SC11.r5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([NAVY_EVENT]);
    pickInst(g, [at(g, 'p1', 'deck', NAVY_EVENT)]);
    expect(hand(g)).toEqual([NAVY_EVENT]);
  });

  it('no {Navy} card in the top 3: nothing to add, all 3 are trashed', () => {
    const g = start([SC11.r1, SC11.r2, SC11.r3, SC11.navyB4, SC11.r5]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SC11.r1, SC11.r2, SC11.r3].sort());
    expect(deckSize(g)).toBe(2);
  });

  it('the cards below the top 3 are untouched and keep their order', () => {
    const g = start([SC11.navyB1, SC11.r2, SC11.r3, SC11.r4, SC11.r5]);
    pickInst(g, [at(g, 'p1', 'deck', SC11.navyB1)]);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([SC11.r4, SC11.r5]);
  });
});

describe('OP11-099 [Trigger]: activate this card’s [Main] effect', () => {
  function hit(deck: string[]) {
    const g = them(LD11.plain, { life: [ID, SC11.r1, SC11.r2], deck }, {});
    hitLeader(g);
    return g;
  }

  it('activating it from Life runs the [Main]: I may take a {Navy} card and the rest is trashed', () => {
    const g = hit([SC11.navyB3, SC11.r2, SC11.r3, SC11.r4, SC11.r5]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'deck', SC11.navyB3)]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(SC11.navyB3);
    expect(trash(g)).toEqual([ID, SC11.r2, SC11.r3].sort());
  });

  it('declining the [Trigger] leaves my deck alone and adds the Event to my hand', () => {
    const g = hit([SC11.navyB3, SC11.r2, SC11.r3, SC11.r4, SC11.r5]);
    const deckBefore = deckSize(g);
    declineTrigger(g);
    expect(deckSize(g)).toBe(deckBefore);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(ID);
    expect(cnt(g, 'p1', 'trash')).toBe(0);
  });
});

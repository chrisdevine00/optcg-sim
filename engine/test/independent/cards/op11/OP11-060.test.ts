/**
 * OP11-060 Let's Crash This Wedding!!! (Blue Event, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Main] If your Leader is multicolored, look at 5 cards from the top of your deck; reveal
 * up to 1 {Straw Hat Crew} type card other than [Let's Crash This Wedding!!!] and add it to your
 * hand. Then, place the rest at the bottom of your deck in any order. [Trigger] Activate this card's
 * [Main] effect."
 *
 * Rules: the Leader must have two or more colours; otherwise nothing is looked at. "Other than
 * [name]" excludes every card with that name. Events qualify (any card). The [Trigger] runs the
 * [Main] effect, including its condition.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  attack,
  BLUE,
  C11,
  choices,
  deck,
  describeLook,
  E11,
  fill,
  hand,
  L11,
  mine,
  need,
  noDefenceUntilTrigger,
  offeredIds,
  pickInst,
  playCard,
  settleOrders,
  theirs,
  trash,
} from './kit-op11b.ts';

const WEDDING = 'OP11-060';

const start = (leader: string) => (deckTop: string[]) => {
  const g = mine(leader, { hand: [WEDDING], deck: deckTop });
  playCard(g, WEDDING);
  return g;
};

describeLook({
  id: WEDDING,
  n: 5,
  start: start(L11.multi),
  match: [C11.shc3, C11.shc5],
  miss: C11.c3,
  notOffered: [
    { card: WEDDING, why: "another copy of [Let's Crash This Wedding!!!] is excluded by name" },
    { card: C11.fire3, why: 'a {Firetank Pirates} Character is not {Straw Hat Crew}' },
  ],
  rest: 'bottom',
});

describe("OP11-060 Let's Crash This Wedding!!!: Leader condition and [Trigger]", () => {
  it('another {Straw Hat Crew} Event (not the same name) is a valid pick', () => {
    const g = start(L11.multi)([E11.cobra59, WEDDING, C11.c3, C11.c3, C11.c3, ...fill(BLUE, 10)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([E11.cobra59]);
    pickInst(g, [choices(g)[0]!]);
    settleOrders(g);
    expect(hand(g)).toEqual([E11.cobra59]);
  });

  it('with a single-colour Leader nothing is looked at, the deck is untouched and the Event is used up', () => {
    const g = mine(L11.mono, {
      hand: [WEDDING],
      deck: [C11.shc3, C11.shc5, ...fill(BLUE, 13)],
    });
    playCard(g, WEDDING);
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
    expect(deck(g)).toHaveLength(15);
    expect(deck(g)[0]).toBe(C11.shc3);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([WEDDING]);
  });

  it('[Trigger]: with a multicoloured Leader it runs the [Main] effect', () => {
    const g = theirs(L11.multi, {
      life: [WEDDING, ...fill(BLUE, 3)],
      deck: [C11.shc3, C11.c3, C11.c3, C11.c3, C11.c3, ...fill(BLUE, 10)],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.shc3]);
    pickInst(g, [choices(g)[0]!]);
    settleOrders(g);
    expect(hand(g)).toEqual([C11.shc3]);
    expect(trash(g)).toEqual([WEDDING]);
  });

  it('[Trigger]: with a single-colour Leader the effect finds its condition false', () => {
    const g = theirs(L11.mono, {
      life: [WEDDING, ...fill(BLUE, 3)],
      deck: [C11.shc3, ...fill(BLUE, 14)],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    activateTrigger(g);
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(C11.shc3);
  });

  it('[Trigger]: declined, the Event is added to the hand and nothing is looked at', () => {
    const g = theirs(L11.multi, {
      life: [WEDDING, ...fill(BLUE, 3)],
      deck: [C11.shc3, ...fill(BLUE, 14)],
    });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefenceUntilTrigger(g);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([WEDDING]);
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
  });
});

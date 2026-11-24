/**
 * OP11-070 Charlotte Pudding (Purple Character, cost 1, 0 power, Counter +1000, {Big Mom Pirates}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 {Big Mom Pirates} type
 * card with a cost of 2 or more and add it to your hand. Then, place the rest at the bottom of your
 * deck in any order. [Activate: Main] DON!! -1, You may rest this Character: Look at 1 card from the
 * top of your opponent's deck."
 *
 * Rules: "card" so Events qualify; cost filter is printed cost 2 or more. DON!! -1 returns one DON!!
 * from my field to my DON!! deck (CR 10-?); it cannot be paid with no DON!! on the field. Resting is
 * a cost, so the Character is rested afterwards. Looking at the top card changes nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  answerIfAsked,
  at,
  BLUE,
  C11,
  deck,
  describeLook,
  donOf,
  fill,
  hand,
  isRested,
  L11,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickInst,
  choices,
  playCard,
  settleOrders,
} from './kit-op11b.ts';

const PUDDING = 'OP11-070';
/** OP03-119 Buzz Cut Mochi: Yellow Event, cost 2, {Big Mom Pirates}. */
const BMP_EVENT = 'OP03-119';

const start = (deckTop: string[]) => {
  const g = mine(L11.bmp, { hand: [PUDDING], deck: deckTop });
  playCard(g, PUDDING);
  return g;
};

describeLook({
  id: PUDDING,
  n: 5,
  start,
  match: [C11.bmpP5, C11.bmpP7],
  miss: C11.c3,
  notOffered: [
    { card: C11.anana, why: 'a {Big Mom Pirates} Character with cost 1 is below the cost of 2' },
    { card: C11.c4, why: 'a cost-4 Character of another type does not qualify' },
  ],
  rest: 'bottom',
});

describe('OP11-070 Charlotte Pudding: [On Play] extras', () => {
  it('a {Big Mom Pirates} Event with cost 2 qualifies', () => {
    const g = start([BMP_EVENT, C11.c3, C11.c3, C11.c3, C11.c3, ...fill(BLUE, 10)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([BMP_EVENT]);
    pickInst(g, [choices(g)[0]!]);
    settleOrders(g);
    expect(hand(g)).toEqual([BMP_EVENT]);
  });
});

describe('OP11-070 Charlotte Pudding: [Activate: Main] DON!! -1, may rest this: look at 1 of the opponent deck', () => {
  const field = (spec: { active: number; rested?: number } = { active: 10 }) =>
    mine(
      L11.bmp,
      { characters: [PUDDING], costArea: { active: spec.active, rested: spec.rested ?? 0 } },
      { deck: [C11.c3, C11.c4, ...fill(BLUE, 13)] },
    );

  it('activating returns 1 DON!! to the DON!! deck, rests Pudding and looks at 1 card of the opponent deck', () => {
    const g = field();
    const p = at(g, 'p1', 'characters', PUDDING);
    const [ability] = offeredAbilities(g, p);
    expect(ability).toBeDefined();
    g.act({ type: 'activate', card: p, ability: ability! });
    answerIfAsked(g, true);
    expect(donOf(g, 'p1').active + donOf(g, 'p1').rested).toBe(9);
    expect(donOf(g, 'p1').deck).toBe(1);
    expect(isRested(g, p)).toBe(true);
    const looks = g.events.filter((e) => e.type === 'CardsLooked');
    expect(looks).toHaveLength(1);
    expect(looks[0]!.owner).toBe('p2');
    expect(looks[0]!.count).toBe(1);
  });

  it('looking changes nothing: the opponent deck keeps its size and order', () => {
    const g = field();
    const p = at(g, 'p1', 'characters', PUDDING);
    g.act({ type: 'activate', card: p, ability: offeredAbilities(g, p)[0]! });
    answerIfAsked(g, true);
    expect(deck(g, 'p2')).toHaveLength(15);
    expect(deck(g, 'p2').slice(0, 2)).toEqual([C11.c3, C11.c4]);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('DON!! -1 can be paid with a rested DON!! when no active one is left', () => {
    const g = field({ active: 0, rested: 2 });
    const p = at(g, 'p1', 'characters', PUDDING);
    expect(offeredAbilities(g, p)).toHaveLength(1);
    g.act({ type: 'activate', card: p, ability: offeredAbilities(g, p)[0]! });
    answerIfAsked(g, true);
    expect(donOf(g, 'p1').rested).toBe(1);
    expect(donOf(g, 'p1').deck).toBe(9);
  });

  it('with no DON!! on my field the ability is not offered', () => {
    const g = field({ active: 0 });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', PUDDING))).toEqual([]);
  });

  it('after it is used the Character is rested, so it cannot be used a second time this turn', () => {
    const g = field();
    const p = at(g, 'p1', 'characters', PUDDING);
    g.act({ type: 'activate', card: p, ability: offeredAbilities(g, p)[0]! });
    answerIfAsked(g, true);
    expect(isRested(g, p)).toBe(true);
    expect(offeredAbilities(g, p)).toEqual([]);
  });

  it('it is not offered in the opponent turn (it is an [Activate: Main])', () => {
    const g = field();
    g.act({ type: 'endTurn' });
    expect(g.decider).toBe('p2');
    expect(g.legal().some((a) => a.type === 'activate')).toBe(false);
  });
});

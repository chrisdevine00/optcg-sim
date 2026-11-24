/** EB03-060 Will You Be My Servant? */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, trash, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import {
  canPick,
  cardsIn,
  EVENT,
  finishOrder,
  mk,
  NAMI_LEADER,
  RED_LEADER,
} from './helpers-eb03g2.ts';

const ID = 'EB03-060';
/** Purple vanilla, cost 10. */
const COST10 = 'P-041';
const COST8 = 'EB02-004';
// Top 4: cost 1, cost 2, cost 8, cost 10; then filler.
const top4 = [V.c1, V.c2, COST8, COST10];

describe('EB03-060 Will You Be My Servant?', () => {
  it('[Main] with [Nami] as Leader: reveals a card with a cost of 2 to 8 from the top 4 into your hand, the rest go to the bottom', () => {
    const g = mk({ leader: NAMI_LEADER, hand: [ID], deck: [...top4, ...times(5, BLUE)] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // cost 1
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(true); // boundary: cost 2
    expect(canPick(g, g.find('p1', 'deck', COST8))).toBe(true); // boundary: cost 8
    expect(canPick(g, g.find('p1', 'deck', COST10))).toBe(false);
    pick(g, [g.find('p1', 'deck', COST8)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([COST8]);
    const deck = cardsIn(g, 'p1', 'deck');
    expect(deck).toHaveLength(8);
    expect(deck.slice(5).sort()).toEqual([V.c1, V.c2, COST10].sort());
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('any category counts: an Event of cost 3 may be taken', () => {
    const g = mk({
      leader: NAMI_LEADER,
      hand: [ID],
      deck: [EVENT, V.c1, V.c1, V.c1, ...times(5, BLUE)],
    });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', EVENT))).toBe(true);
    pick(g, [g.find('p1', 'deck', EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([EVENT]);
  });

  it('"up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = mk({ leader: NAMI_LEADER, hand: [ID], deck: [...top4, ...times(5, BLUE)] });
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(5).sort()).toEqual([...top4].sort());
  });

  it('boundary: the 5th card is not looked at', () => {
    const g = mk({
      leader: NAMI_LEADER,
      hand: [ID],
      deck: [V.c1, V.c1, V.c1, V.c1, V.c2, ...times(5, BLUE)],
    });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });

  it('a Leader other than [Nami]: nothing happens, nothing is asked', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck: [...top4, ...times(5, BLUE)] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsIn(g, 'p1', 'deck').slice(0, 4)).toEqual(top4);
  });

  it("[Trigger]: activates this card's [Main] effect", () => {
    const g = damageWith(ID, { leader: NAMI_LEADER, deck: [...top4, ...times(5, BLUE)] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p1', 'deck', V.c2)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('[Trigger] with another Leader does nothing', () => {
    const g = damageWith(ID, { deck: [...top4, ...times(5, BLUE)] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });
});

/** OP11-070 Charlotte Pudding. */
import { describe, expect, it } from 'vitest';
import { BLUE, don, expectDecision, hand, none, payDon, pick, play, times, V } from './helpers.ts';
import {
  activate,
  ANANA_Y,
  BM_P6,
  BM_Y2,
  BM_Y4,
  canPick,
  cardsOf,
  finishOrder,
  known,
  mk,
  offeredAb,
} from './helpers-op11g2.ts';

const ID = 'OP11-070';
// Top 5: {BM} cost 4, {BM} cost 2, {BM} cost 1, a plain card, {BM} cost 6; the 6th is {BM} cost 4.
const top5 = [BM_Y4, BM_Y2, ANANA_Y, V.c2, BM_P6];
const deck = [...top5, BM_Y4, ...times(4, BLUE)];

describe('OP11-070 Charlotte Pudding', () => {
  it('[On Play]: looks at 5; offers {Big Mom Pirates} cards with cost 2 or more (2 is the boundary, 1 is not), the rest to the bottom', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', BM_Y4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', BM_Y2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', BM_P6))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', ANANA_Y))).toBe(false); // cost 1
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'deck', BM_Y2)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([BM_Y2]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(BM_Y2);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d).toHaveLength(deck.length - 1);
    expect(d[0]).toBe(BM_Y4); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([BM_Y4, ANANA_Y, V.c2, BM_P6].sort());
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = mk({ hand: [ID], deck });
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck').slice(-5).sort()).toEqual([...top5].sort());
  });

  it("[Activate: Main]: DON!! -1 and rest this Character, look at the top card of your opponent's deck", () => {
    const g = mk({ characters: [ID] }, { deck: [V.c4, V.c5, ...times(5, V.c1)] });
    const pudding = g.find('p1', 'characters', ID);
    expect(offeredAb(g, pudding, 'look-opp')).toBe(true);
    activate(g, pudding, 'look-opp');
    payDon(g);
    expect(g.card(pudding).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ deck: 1 });
    expect(known(g, 'p1')['p2.deck.0']).toBe(V.c4);
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c4); // nothing moved
    expect(known(g, 'p2')['p2.deck.0']).toBeUndefined();
  });

  it('must not be usable when this Character is already rested', () => {
    const g = mk({ characters: [{ card: ID, rested: true }] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'look-opp')).toBe(false);
  });

  it('must not be usable with no DON!! on the field (the DON!! -1 cannot be paid)', () => {
    const g = mk({ characters: [ID], costArea: { active: 0, rested: 0 } });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'look-opp')).toBe(false);
  });
});

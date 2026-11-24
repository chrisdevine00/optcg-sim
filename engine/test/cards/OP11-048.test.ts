/** OP11-048 Capone"Gang"Bege. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import {
  BM_Y4,
  canPick,
  cardsOf,
  FIRE5,
  finishOrder,
  mk,
  SHC1,
  SHC4,
  SHC5,
} from './helpers-op11g2.ts';

const ID = 'OP11-048';
/** [Jinbe] {Straw Hat Crew} vanilla, cost 2. */
const SHC2 = 'ST21-005';
// Top 4: {Firetank Pirates} cost 5, {Straw Hat Crew} cost 1, {Straw Hat Crew} cost 2, a Big Mom Pirates card; 5th: {Straw Hat Crew} cost 4.
const top4 = [FIRE5, SHC1, SHC2, BM_Y4];
const deck = [...top4, SHC4, ...times(5, BLUE)];
const start = (d = deck) => {
  const g = mk({ hand: [ID], deck: d });
  play(g, ID);
  return g;
};

describe('OP11-048 Capone"Gang"Bege', () => {
  it('[On Play]: looks at 4; offers {Firetank Pirates} / {Straw Hat Crew} cards with cost 2 or more (cost 2 is the boundary, cost 1 is not)', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', FIRE5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SHC2))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SHC1))).toBe(false); // cost 1
    expect(canPick(g, g.find('p1', 'deck', BM_Y4))).toBe(false); // wrong type
    expect(canPick(g, g.find('p1', 'deck', SHC4))).toBe(false); // the 5th card is not looked at
    pick(g, [g.find('p1', 'deck', SHC2)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SHC2]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(SHC2);
  });

  it('the other 3 go to the bottom; the 5th card is now on top', () => {
    const g = start();
    pick(g, [g.find('p1', 'deck', FIRE5)]);
    finishOrder(g);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d).toHaveLength(deck.length - 1);
    expect(d[0]).toBe(SHC4);
    expect(d.slice(-3).sort()).toEqual([SHC1, SHC2, BM_Y4].sort());
  });

  it('"up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = start();
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck').slice(-4).sort()).toEqual([...top4].sort());
  });

  it('must not offer anything when only cost-1 or wrong-type cards are in the top 4', () => {
    const g = start([SHC1, BM_Y4, V.c3, V.c4, SHC5, ...times(5, BLUE)]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
  });
});

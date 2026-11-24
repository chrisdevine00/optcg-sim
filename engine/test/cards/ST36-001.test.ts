/** ST36-001 Cavendish. */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, expectDecision, pick, PURPLE, trash } from './helpers.ts';
import { canAccept, idsOf, koedInBattle, SUPERNOVAS_LEADER } from './helpers-stg2.ts';

const ID = 'ST36-001';
const start = (handCards: string[]) =>
  koedInBattle(ID, {
    leader: SUPERNOVAS_LEADER,
    hand: handCards,
    deck: [PURPLE, BLUE],
    life: [BLUE, BLUE],
  });

describe('ST36-001 Cavendish', () => {
  it('[On K.O.] trash 1 card from your hand: add the top card of your deck to the top of your Life', () => {
    const g = start([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    accept(g); // "up to 1" card from the deck
    expect(trash(g, 'p1')).toContain(BLUE);
    expect(g.zone('p1', 'life')).toHaveLength(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(PURPLE); // the former deck top is the top Life card
    expect(idsOf(g, 'p1', 'deck')).toEqual([BLUE]);
    expectDecision(g, 'main', 'p2');
  });

  it('"up to 1": the Life card may be declined after paying the cost', () => {
    const g = start([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    decline(g);
    expect(trash(g, 'p1')).toContain(BLUE);
    expect(g.zone('p1', 'life')).toHaveLength(2);
    expect(idsOf(g, 'p1', 'deck')).toEqual([PURPLE, BLUE]);
  });

  it('the cost may be declined: no card is trashed and no Life is added', () => {
    const g = start([BLUE]);
    decline(g);
    expect(idsOf(g, 'p1', 'hand')).toEqual([BLUE]);
    expect(g.zone('p1', 'life')).toHaveLength(2);
    expect(idsOf(g, 'p1', 'deck')).toEqual([PURPLE, BLUE]);
  });

  it('with an empty hand the cost cannot be paid', () => {
    const g = start([]);
    expect(canAccept(g)).toBe(false);
    decline(g);
    expect(g.zone('p1', 'life')).toHaveLength(2);
  });

  it('the Life gained does not come from the Life area: the deck loses exactly one card', () => {
    const g = start([BLUE]);
    accept(g);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    accept(g);
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });
});

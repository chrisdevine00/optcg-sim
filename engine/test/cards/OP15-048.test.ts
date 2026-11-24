/** OP15-048 Chinjao. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  expectDecision,
  hand,
  pick,
  play,
  PURPLE,
  V,
} from './helpers.ts';
import { EVENT, EVENT2, koedInBattle, mine, OTHER_LEADER, plant } from './helpers-op15g2.ts';

const ID = 'OP15-048';

describe('OP15-048 Chinjao', () => {
  const start = (handCards: string[]) =>
    mine(OTHER_LEADER, { hand: [ID, ...handCards], deck: [V.c1, V.c2, V.c3, V.c4] });

  it('[On Play] trash 1 Event from your hand: draw 2 cards', () => {
    const g = start([EVENT, V.c5]);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', EVENT)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([EVENT]);
    expect(hand(g, 'p1')).toEqual([V.c5, V.c1, V.c2]);
  });

  it('only Events can pay the cost (a Character in hand is not a candidate)', () => {
    const g = start([EVENT, EVENT2, V.c5]);
    play(g, ID);
    accept(g);
    const picks = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(picks).toHaveLength(2);
    expect(picks).not.toContain(g.find('p1', 'hand', V.c5));
  });

  it('the cost may be declined: nothing is trashed or drawn', () => {
    const g = start([EVENT]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([EVENT]);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('with no Event in hand the cost cannot be paid and nothing is drawn', () => {
    const g = start([V.c5]);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    if (dec(g)?.kind === 'optional') decline(g);
    expect(hand(g, 'p1')).toEqual([V.c5]);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });

  const ko = (oppHand: string[]) =>
    koedInBattle(ID, { leader: OTHER_LEADER }, { hand: oppHand, deck: [PURPLE, PURPLE] });

  it("[Opponent's Turn] [On K.O.] your opponent places 1 card from their hand at the bottom of their deck", () => {
    const g = ko([BLUE, V.c3]);
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'hand', BLUE)]);
    expect(hand(g, 'p2')).toEqual([V.c3]);
    expect(g.zone('p2', 'deck').map((c) => c.card)).toEqual([PURPLE, PURPLE, BLUE]);
  });

  it('exactly 1 card, chosen by the opponent (the other card stays)', () => {
    const g = ko([BLUE, V.c3, V.c4]);
    pick(g, [g.find('p2', 'hand', V.c4)]);
    expect(hand(g, 'p2')).toEqual([BLUE, V.c3]);
  });

  it('with an empty opponent hand nothing happens', () => {
    const g = ko([]);
    expect(dec(g)?.player).toBe('p2');
    expect(g.zone('p2', 'deck')).toHaveLength(2);
  });

  it("does not fire when it is K.O.d on its controller's own turn", () => {
    const g = mine(OTHER_LEADER, { characters: [ID] }, { hand: [BLUE], deck: [PURPLE, PURPLE] });
    plant(g, 'p1', { ko: { from: 'characters', owner: 'you', filter: { name: 'Chinjao' } } });
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
    expect(hand(g, 'p2')).toEqual([BLUE]);
    expect(g.zone('p2', 'deck')).toHaveLength(2);
  });
});

/** OP14-097 Hurry Up and Make Me the Pirate King! */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, PURPLE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { BW5, ids, start, TBP4, TBP4B, TBP8, TBP_LEADER } from './helpers-op14g4.ts';

const ID = 'OP14-097';
// Top 3: BLUE, TBP4, ID. The 4th card (TBP8) is not looked at.
const DECK = [BLUE, TBP4, ID, TBP8, PURPLE];
const run = (deck = DECK) => {
  const g = start({
    leader: TBP_LEADER,
    hand: [ID],
    deck,
    costArea: { active: 1, rested: 0 },
  });
  play(g, ID);
  return g;
};

describe('OP14-097 Hurry Up and Make Me the Pirate King!', () => {
  it('[Main] takes 1 {Thriller Bark Pirates} card of the top 3 and trashes the rest', () => {
    const g = run();
    expectDecision(g, 'choose', 'p1');
    // Offered: TBP4 only (this Event is excluded by name; BLUE is not a {Thriller Bark Pirates} card).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', TBP4)]);
    expect(hand(g, 'p1')).toEqual([TBP4]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([BLUE, ID, ID].sort());
    expect(ids(g, 'p1', 'deck')).toEqual([TBP8, PURPLE]);
  });

  it('"up to 1": may take nothing, the 3 cards are trashed', () => {
    const g = run();
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(4);
    expect(ids(g, 'p1', 'deck')).toEqual([TBP8, PURPLE]);
  });

  it('with two candidates only one can be taken', () => {
    const g = run([TBP4, TBP4B, V.c1, TBP8]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', TBP4)]);
    expect(hand(g, 'p1')).toEqual([TBP4]);
    expect(ids(g, 'p1', 'trash')).toContain(TBP4B);
  });

  it('a card of the wrong type (a Baroque Works card) is not offered', () => {
    const g = run([BW5, BLUE, PURPLE, TBP4]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] activates the [Main] effect', () => {
    const g = damageWith(ID, { leader: TBP_LEADER, deck: DECK });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', TBP4)]);
    expect(hand(g, 'p1')).toEqual([TBP4]);
  });
});

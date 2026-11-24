/** OP14-099 Disappointed? */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, PURPLE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { BENTHAM, BW5, BW_LEADER, ids, start, TBP4 } from './helpers-op14g4.ts';

const ID = 'OP14-099';
// Top 3: BLUE, BW5, ID. The 4th card (BENTHAM) is not looked at.
const DECK = [BLUE, BW5, ID, BENTHAM, PURPLE];
const run = (deck = DECK) => {
  const g = start({ leader: BW_LEADER, hand: [ID], deck, costArea: { active: 1, rested: 0 } });
  play(g, ID);
  return g;
};

describe('OP14-099 Disappointed?', () => {
  it('[Main] takes 1 Baroque Works card of the top 3 (any card category) and trashes the rest', () => {
    const g = run();
    expectDecision(g, 'choose', 'p1');
    // Offered: BW5 only (this Event is a Baroque Works card but excluded by name).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', BW5)]);
    expect(hand(g, 'p1')).toEqual([BW5]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([BLUE, ID, ID].sort());
    expect(ids(g, 'p1', 'deck')).toEqual([BENTHAM, PURPLE]);
  });

  it('"Former Baroque Works" counts as a type including "Baroque Works"', () => {
    const g = run([BENTHAM, V.c1, V.c2, BW5]);
    pick(g, [g.find('p1', 'deck', BENTHAM)]);
    expect(hand(g, 'p1')).toEqual([BENTHAM]);
  });

  it('"up to 1": may take nothing', () => {
    const g = run();
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(4);
  });

  it('a card of another type is not offered', () => {
    const g = run([TBP4, BLUE, PURPLE, BW5]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger] activates the [Main] effect', () => {
    const g = damageWith(ID, { leader: BW_LEADER, deck: DECK });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', BW5)]);
    expect(hand(g, 'p1')).toEqual([BW5]);
  });
});

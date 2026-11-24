/** OP14-087 Miss.Valentine(Mikita). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, PURPLE, trash, V } from './helpers.ts';
import { BW5, BW_LEADER, BENTHAM, ids, OTHER_LEADER, start } from './helpers-op14g4.ts';

const ID = 'OP14-087';
// BW5, BENTHAM and the second Mikita are Baroque Works cards; V.c1 and BLUE are not.
const DECK = [V.c1, BW5, ID, BENTHAM, BLUE, PURPLE];
const run = (leader: string, deck = DECK) => {
  const g = start({ leader, hand: [ID], deck, costArea: { active: 1, rested: 0 } });
  play(g, ID);
  return g;
};

describe('OP14-087 Miss.Valentine(Mikita)', () => {
  it('[On Play] with a Baroque Works Leader: takes 1 Baroque Works card of the top 4, trashes the rest', () => {
    const g = run(BW_LEADER);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', BW5)]);
    expect(hand(g, 'p1')).toEqual([BW5]);
    expect(ids(g, 'p1', 'trash').sort()).toEqual([V.c1, ID, BENTHAM].sort());
    expect(ids(g, 'p1', 'deck')).toEqual([BLUE, PURPLE]);
  });

  it('offers no other [Miss.Valentine(Mikita)] (excluded by name) nor non-Baroque cards', () => {
    const g = run(BW_LEADER);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(2); // BW5 and BENTHAM; not V.c1, not the other Mikita
  });

  it('"up to 1": may take nothing; all 4 are trashed', () => {
    const g = run(BW_LEADER);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toHaveLength(4);
    expect(ids(g, 'p1', 'deck')).toHaveLength(2);
  });

  it('with a Leader that is not Baroque Works nothing happens', () => {
    const g = run(OTHER_LEADER);
    expect(ids(g, 'p1', 'deck')).toHaveLength(6);
    expect(trash(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('with no Baroque Works card among the top 4 the look is shown and all 4 are trashed', () => {
    const g = run(BW_LEADER, [V.c1, V.c2, BLUE, PURPLE, BW5]);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p1', 'deck')).toEqual([BW5]);
  });
});

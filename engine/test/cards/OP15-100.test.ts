/** OP15-100 Kamakiri. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, pick, play, PURPLE, V } from './helpers.ts';
import { donArea, mine, names, offers, OTHER_LEADER } from './helpers-op15g3.ts';

const ID = 'OP15-100';

describe('OP15-100 Kamakiri', () => {
  const start = (opp: string[], life = [PURPLE, V.c1, V.c2]) =>
    mine({ leader: OTHER_LEADER, hand: [ID], life, ...donArea(5) }, { characters: opp });

  it("[On Play] trash this Character and add the top Life card to your hand: K.O. up to 1 of your opponent's Characters with cost 6 or less", () => {
    const g = start([V.c6, V.c7]);
    play(g, ID);
    accept(g);
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(2);
    expect(offers(g, g.find('p2', 'characters', V.c7))).toBe(false); // cost 7 is out
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(names(g, 'p2', 'trash')).toEqual([V.c6]);
  });

  it('declining the cost keeps Kamakiri on the field, Life untouched and no K.O.', () => {
    const g = start([V.c6]);
    play(g, ID);
    decline(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
    expect(names(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('cannot be paid with no Life cards', () => {
    const g = start([V.c6], []);
    play(g, ID);
    // The cost is unpayable, so the optional effect is not even offered.
    expectDecision(g, 'main', 'p1');
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('"up to 1": after paying, the K.O. may be declined (the cost is still lost)', () => {
    const g = start([V.c6]);
    play(g, ID);
    accept(g);
    none(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
  });

  it('with no opposing Character the effect still costs (nothing to K.O.)', () => {
    const g = start([]);
    play(g, ID);
    accept(g);
    expectDecision(g, 'main', 'p1');
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });
});

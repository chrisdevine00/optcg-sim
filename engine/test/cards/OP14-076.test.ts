/** OP14-076 Ever White. */
import { describe, expect, it } from 'vitest';
import { accept, addMost, dec, decline, don, play } from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { DP_LEADER, mine, OTHER_LEADER } from './helpers-op14g3.ts';

const ID = 'OP14-076';

describe('OP14-076 Ever White', () => {
  it('[Main] you may rest 2 DON!!: with a {Donquixote Pirates} Leader, add up to 1 DON!! rested', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 3);
    play(g, ID);
    accept(g);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4, deck: 6 });
  });

  it('the 2 DON!! is an optional cost: declining adds nothing and rests nothing extra', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 3);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1, deck: 7 });
  });

  it('the "If" follows the colon: with another Leader the 2 DON!! are rested for nothing', () => {
    const g = mine(OTHER_LEADER, { hand: [ID] }, {}, 3);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('with fewer than 2 active DON!! left after paying the Event, the optional cost cannot be accepted', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 2);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = counterStep({ leader: DP_LEADER, hand: [ID], costArea: { active: 2, rested: 0 } });
    expect(g.power(g.leader('p1'))).toBe(5000);
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the [Counter] needs no Leader type and does not add DON!!', () => {
    const g = counterStep({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 2, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(don(g, 'p1').deck).toBe(8);
  });
});

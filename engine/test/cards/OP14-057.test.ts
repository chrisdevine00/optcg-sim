/** OP14-057 Don't Worry!! I'm Here!!. */
import { describe, expect, it } from 'vitest';
import { hand, play, V } from './helpers.ts';
import { damageGame } from './helpers-hancock-rosi.ts';
import { FM3, FM_LEADER, mine, MER3, OTHER_LEADER } from './helpers-op14g2.ts';

const ID = 'OP14-057';

describe("OP14-057 Don't Worry!! I'm Here!!", () => {
  it('[Main]: all your {Fish-Man} or {Merfolk} Leader and Characters gain +1000 this turn', () => {
    const g = mine(FM_LEADER, { hand: [ID], characters: [FM3, MER3, V.c2] });
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', FM3))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', MER3))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000); // another type: unchanged
  });

  it('the boost ends with the turn', () => {
    const g = mine(FM_LEADER, { hand: [ID], characters: [FM3] });
    play(g, ID);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', FM3))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader that is neither type is not boosted', () => {
    const g = mine(OTHER_LEADER, { hand: [ID], characters: [FM3] });
    play(g, ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', FM3))).toBe(6000);
  });

  it('opposing Characters are not boosted', () => {
    const g = mine(FM_LEADER, { hand: [ID] }, { characters: [FM3] });
    play(g, ID);
    expect(g.power(g.find('p2', 'characters', FM3))).toBe(5000);
  });

  it('[Trigger]: draws 2 cards', () => {
    const g = damageGame(ID, { leader: FM_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toHaveLength(2);
  });
});

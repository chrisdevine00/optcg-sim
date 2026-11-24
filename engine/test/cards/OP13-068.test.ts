/** OP13-068 Douglas Bullet. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, play } from './helpers.ts';
import { mine, OTHER_LEADER, ROGER_LEADER, withDon } from './helpers-op13g3.ts';

const ID = 'OP13-068';

describe('OP13-068 Douglas Bullet', () => {
  const power = (active: number, rested: number, given = 0, leader = OTHER_LEADER) => {
    const g = mine(
      { leader: given ? withDon(leader, given) : leader, characters: [ID] },
      {},
      active,
      rested,
    );
    return g.power(g.find('p1', 'characters', ID));
  };

  it('with 8 or more DON!! on your field this Character gains +2000 power', () => {
    expect(power(8, 0)).toBe(6000);
  });

  it('boundary: 7 DON!! is not enough (4000), 8 is (6000)', () => {
    expect(power(7, 0)).toBe(4000);
    expect(power(5, 2, 1)).toBe(4000 + 2000);
    expect(power(4, 2, 1)).toBe(4000);
  });

  it('rested and given DON!! count toward the 8 (the whole field)', () => {
    expect(power(4, 4)).toBe(6000);
    expect(power(6, 0, 2)).toBe(6000);
  });

  it('the bonus follows the count live: DON!! -1 below 8 drops it', () => {
    const g = mine({ characters: [ID] }, {}, 8, 0);
    const id = g.find('p1', 'characters', ID);
    expect(g.power(id)).toBe(6000);
    const g2 = mine({ characters: [ID] }, {}, 7, 0);
    expect(g2.power(g2.find('p1', 'characters', ID))).toBe(4000);
  });

  it('[On Play] with a {Roger Pirates} Leader: add up to 1 DON!! from the DON!! deck and rest it', () => {
    const g = mine({ leader: ROGER_LEADER, hand: [ID] });
    play(g, ID);
    const rested = don(g, 'p1').rested;
    addMost(g);
    expect(don(g, 'p1').rested).toBe(rested + 1);
  });

  it('[On Play] with another Leader type nothing happens', () => {
    const g = mine({ hand: [ID] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });
});

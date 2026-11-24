/** OP16-055 Mr.2.Bon.Kurei(Bentham) (Blue, cost 2, 1000). */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, play } from './helpers.ts';
import { BLUE_LEADER, IMPEL_LEADER, mine } from './helpers-op16g2.ts';

const ID = 'OP16-055';

describe('OP16-055 Mr.2.Bon.Kurei(Bentham)', () => {
  it('[On Play] draws 1', () => {
    const g = mine({ hand: [ID], deck: [BLUE, BLUE] });
    play(g, ID);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  const attacker = (don: number) =>
    game(
      {
        leader: IMPEL_LEADER,
        characters: [{ card: ID, don }],
        costArea: { active: 9, rested: 0 },
      },
      { leader: BLUE_LEADER },
    );
  const attack = (g: ReturnType<typeof attacker>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it("[DON!! x1] [When Attacking] its base power becomes the same as your opponent's Leader's power during this turn", () => {
    const g = attacker(1);
    const me = g.find('p1', 'characters', ID);
    expect(g.power(me)).toBe(2000); // 1000 base + the DON!!
    attack(g);
    expect(g.power(me)).toBe(g.power(g.leader('p2'))! + 1000); // the given DON!! still adds
    expect(g.power(me)).toBe(6000);
  });

  it('without a DON!! given it does not fire', () => {
    const g = attacker(0);
    attack(g);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });

  it('DON!! on the opposing Leader do not count: on your turn its power is its printed 5000', () => {
    const g = game(
      {
        leader: IMPEL_LEADER,
        characters: [{ card: ID, don: 1 }],
        costArea: { active: 9, rested: 0 },
      },
      { leader: { card: BLUE_LEADER, don: 2 }, costArea: { active: 8, rested: 0 } },
    );
    attack(g);
    // DON!! on the opposing Leader add only on its owner's turn: 5000 now.
    expect(g.power(g.find('p1', 'characters', ID))).toBe(g.power(g.leader('p2'))! + 1000);
  });
});

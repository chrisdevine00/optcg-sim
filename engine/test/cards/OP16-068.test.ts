/** OP16-068 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, game, play, PLAIN_BLUE } from './helpers.ts';
import { DQ_LEADER, NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-068';

describe('OP16-068 Trafalgar Law', () => {
  it('[On Play] adds 1 DON!! from the DON!! deck, active', () => {
    const g = game(
      { leader: NOT_NAVY, hand: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4, deck: 5 });
  });

  const attack = (leader: string) => {
    const g = game({ leader, characters: [ID] }, { leader: PLAIN_BLUE });
    const law = g.find('p1', 'characters', ID);
    g.act({ type: 'attack', attacker: law, target: g.leader('p2') });
    return { g, law };
  };

  it('[When Attacking] with a {Donquixote Pirates} Leader gains +3000 power this turn', () => {
    const { g, law } = attack(DQ_LEADER);
    expectDecision(g, 'block', 'p2');
    expect(g.power(law)).toBe(6000);
  });

  it('with another Leader type the power stays 3000', () => {
    const { g, law } = attack(NOT_NAVY);
    expectDecision(g, 'block', 'p2');
    expect(g.power(law)).toBe(3000);
  });
});

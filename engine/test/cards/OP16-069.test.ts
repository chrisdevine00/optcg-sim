/** OP16-069 Donquixote Doflamingo. */
import { describe, expect, it } from 'vitest';
import { addMost, don, game, play, PLAIN_BLUE } from './helpers.ts';
import { NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-069';

describe('OP16-069 Donquixote Doflamingo', () => {
  it('[On Play] adds 1 DON!! from the DON!! deck, active', () => {
    const g = game(
      { leader: NOT_NAVY, hand: [ID], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 7, deck: 2 });
  });

  it('[When Attacking] adds 1 DON!! from the DON!! deck, active, with no Leader condition', () => {
    const g = game({ leader: NOT_NAVY, characters: [ID] }, { leader: PLAIN_BLUE });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0, deck: 9 });
  });

  it('with no DON!! left in the DON!! deck nothing is added', () => {
    const g = game(
      { leader: NOT_NAVY, hand: [ID], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 7, deck: 0 });
  });
});

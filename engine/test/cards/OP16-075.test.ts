/** OP16-075 Monkey.D.Garp. */
import { describe, expect, it } from 'vitest';
import { addMost, don, game, play, PLAIN_BLUE } from './helpers.ts';
import { NAVY_LEADER, NOT_NAVY } from './helpers-op16g3.ts';

const ID = 'OP16-075';
const start = (leader: string) =>
  game({ leader, hand: [ID], costArea: { active: 5, rested: 0 } }, { leader: PLAIN_BLUE });

describe('OP16-075 Monkey.D.Garp', () => {
  it('[On Play] with a {Navy} Leader: adds 1 active DON!! and 1 additional rested DON!!', () => {
    const g = start(NAVY_LEADER);
    play(g, ID);
    addMost(g, 2);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 6, deck: 3 });
  });

  it('with another Leader type nothing is added', () => {
    const g = start(NOT_NAVY);
    play(g, ID);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 5, deck: 5 });
  });

  it('with only 1 DON!! left in the DON!! deck, it is added active and the second adds nothing', () => {
    const g = game(
      { leader: NAVY_LEADER, hand: [ID], costArea: { active: 5, rested: 4 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 9, deck: 0 });
  });
});

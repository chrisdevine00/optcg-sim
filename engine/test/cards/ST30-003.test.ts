/** ST30-003 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, V } from './helpers.ts';
import { ACE6, ATMOS, P5000, P7000, SLASH_LEADER } from './helpers-stg1.ts';

const ID = 'ST30-003';

describe('ST30-003 Edward.Newgate', () => {
  it('[Your Turn]: all your Characters with 6000 base power gain +1000 power, this one included', () => {
    const g = game({ leader: SLASH_LEADER, characters: [ID, ATMOS, ACE6] }, { leader: PLAIN_BLUE });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', ATMOS))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', ACE6))).toBe(7000);
  });

  it('5000 and 7000 base power Characters, and the Leader, get nothing (exact boundary on base power)', () => {
    const g = game(
      { leader: SLASH_LEADER, characters: [ID, P5000, P7000] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', P5000))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', P7000))).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('reads base power: a 5000 Character with 1 DON!! (current 6000) gets no bonus', () => {
    const g = game(
      {
        leader: SLASH_LEADER,
        characters: [ID, { card: P5000, don: 1 }],
        costArea: { active: 0, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', P5000))).toBe(6000);
  });

  it('a 6000 Character with 1 DON!! gets both bonuses', () => {
    const g = game(
      { leader: SLASH_LEADER, characters: [ID, { card: ATMOS, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    expect(g.power(g.find('p1', 'characters', ATMOS))).toBe(8000);
  });

  it("does not apply on your opponent's turn, and never to your opponent's Characters", () => {
    const g = game(
      { leader: SLASH_LEADER, characters: [ID, ATMOS] },
      { leader: PLAIN_BLUE, characters: [ACE6] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(g.power(g.find('p1', 'characters', ATMOS))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    expect(g.power(g.find('p2', 'characters', ACE6))).toBe(6000);
    const own = game(
      { leader: SLASH_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
    );
    expect(own.power(own.find('p2', 'characters', V.c4))).toBe(6000);
  });
});

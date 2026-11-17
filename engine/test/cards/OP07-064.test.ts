/** OP07-064 Sanji. The hand-zone cost permanent (OP07-064 is the audit's G2 example). */
import { describe, expect, it } from 'vitest';
import { game, play, PLAIN_PURPLE } from './helpers.ts';
import { PLAIN_BLUE } from './helpers-rgl-penel.ts';

describe('OP07-064 Sanji', () => {
  const start = (mine: number, theirs: number, myGiven = 0, theirGiven = 0) =>
    game(
      {
        leader: { card: PLAIN_PURPLE, don: myGiven },
        hand: ['OP07-064'],
        costArea: { active: mine, rested: 0 },
      },
      {
        leader: { card: PLAIN_BLUE, don: theirGiven },
        costArea: { active: theirs, rested: 0 },
      },
    );
  const cost = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'hand', 'OP07-064')).cost;
  const canPlay = (g: ReturnType<typeof start>) =>
    g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', 'OP07-064'), player: 'p1' });

  it('[Blocker] is a printed keyword', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: ['OP07-064'] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', 'OP07-064')).keywords).toContain('Blocker');
  });

  it('in the hand it costs 3 less when you have at least 2 fewer DON!! on your field', () => {
    const g = start(3, 5);
    expect(cost(g)).toBe(3);
    expect(canPlay(g)).toBe(true);
    play(g, 'OP07-064');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP07-064']);
  });

  it('with only 1 fewer DON!! it keeps its cost of 6', () => {
    const g = start(3, 4);
    expect(cost(g)).toBe(6);
    expect(canPlay(g)).toBe(false);
  });

  it('with equal DON!! it keeps its cost of 6', () => {
    const g = start(6, 6);
    expect(cost(g)).toBe(6);
    expect(canPlay(g)).toBe(true);
  });

  it('given DON!! count as on the field, for both players', () => {
    // Mine: 3 in the cost area + 1 given = 4. Theirs: 4 + 1 given = 5. Only 1 fewer.
    expect(cost(start(3, 4, 1, 1))).toBe(6);
    // Theirs: 5 + 1 given = 6 against my 3 + 1 = 4: 2 fewer.
    expect(cost(start(3, 5, 1, 1))).toBe(3);
  });

  it('the reduction applies only while the card is in the hand', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: ['OP07-064'], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, costArea: { active: 5, rested: 0 } },
    );
    expect(g.card(g.find('p1', 'characters', 'OP07-064')).cost).toBe(6);
  });
});

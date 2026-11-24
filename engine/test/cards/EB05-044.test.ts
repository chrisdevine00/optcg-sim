/** EB05-044 Ms. Father's Day: [On Play] If your Leader's type includes "Baroque Works" and your opponent has a Character with a cost of 0, give your opponent's Leader -1000 power during this turn. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { lowerOpponentCost } from './helpers-eb05g3.ts';

const FD = 'EB05-044';

describe("EB05-044 Ms. Father's Day", () => {
  /** p1's Leader is `leader`; p2 has `opp` Characters; `zero` lowers every opposing Character to cost 0 first. */
  const setup = (leader: string, opp: string[], zero: boolean) => {
    const g = game(
      { leader, hand: [FD], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: opp },
    );
    if (zero) lowerOpponentCost(g, leader);
    play(g, FD);
    return g;
  };

  it('with a Baroque Works Leader and an opposing cost 0 Character: opponent Leader -1000 this turn', () => {
    const g = setup(PLAIN_BLUE, [BLUE], true);
    expect(g.card(g.find('p2', 'characters', BLUE)).cost).toBe(0);
    expect(g.power(g.leader('p2'))).toBe(4000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('does nothing when no opposing Character has a cost of 0', () => {
    const g = setup(PLAIN_BLUE, [BLUE], false);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('does nothing when the opponent has no Characters', () => {
    const g = setup(PLAIN_BLUE, [], false);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('does nothing when the Leader is not Baroque Works', () => {
    // Kaido (ST04-001) is not Baroque Works; its own text is replaced by the planted cost effect.
    const g = setup('ST04-001', [BLUE], true);
    expect(g.card(g.find('p2', 'characters', BLUE)).cost).toBe(0);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });

  it('a Character with cost 1 or more does not count even next to a cost 0 one', () => {
    const g = setup(PLAIN_BLUE, [V.c4], false);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});

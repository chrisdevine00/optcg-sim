/** ST36-003 Scratchmen Apoo. */
import { describe, expect, it } from 'vitest';
import { BLUE, PLAIN_BLUE, PURPLE } from './helpers.ts';
import { idsOf, SUPERNOVAS_LEADER, triggerGame } from './helpers-stg2.ts';

const ID = 'ST36-003';

describe('ST36-003 Scratchmen Apoo', () => {
  it('[Trigger] draws 1 card and a {Supernovas} Leader base power becomes 7000 this turn', () => {
    const g = triggerGame(ID, { leader: SUPERNOVAS_LEADER, deck: [PURPLE, BLUE] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    g.act({ type: 'trigger', activate: true });
    expect(idsOf(g, 'p1', 'hand')).toEqual([PURPLE]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('it is a base power (not +2000 on top of DON!!): a Leader with 1 DON!! on the opponent turn stays 7000', () => {
    const g = triggerGame(ID, {
      leader: { card: SUPERNOVAS_LEADER, don: 1 },
      deck: [PURPLE, BLUE],
    });
    g.act({ type: 'trigger', activate: true });
    // DON!! given to a Leader add power only during its owner's turn.
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Leader that is not {Supernovas} keeps its power, but the draw still happens', () => {
    const g = triggerGame(ID, { leader: PLAIN_BLUE, deck: [PURPLE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    expect(idsOf(g, 'p1', 'hand')).toEqual([PURPLE]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the base power lasts only this turn', () => {
    const g = triggerGame(ID, { leader: SUPERNOVAS_LEADER, deck: [PURPLE, BLUE] });
    g.act({ type: 'trigger', activate: true });
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the Trigger adds the card to hand and changes nothing', () => {
    const g = triggerGame(ID, { leader: SUPERNOVAS_LEADER, deck: [PURPLE, BLUE] });
    g.act({ type: 'trigger', activate: false });
    expect(idsOf(g, 'p1', 'hand')).toEqual([ID]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

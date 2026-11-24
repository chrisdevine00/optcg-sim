/** OP15-103 Genbo. */
import { describe, expect, it } from 'vitest';
import { PURPLE } from './helpers.ts';
import { names, OTHER_LEADER, trig } from './helpers-op15g3.ts';

const ID = 'OP15-103';

describe('OP15-103 Genbo', () => {
  it('[Trigger] draws 1 card; with 2 or less Life cards (after the damage) plays this card', () => {
    // Life [ID, PURPLE]: 1 card is left once this one is taken.
    const g = trig(ID, { leader: OTHER_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.life('p1')).toBe(1);
  });

  it('the threshold is inclusive: exactly 2 Life cards left still plays it', () => {
    const g = trig(ID, { leader: OTHER_LEADER, life: [ID, PURPLE, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });

  it('with 3 Life cards left it draws but must not play the card: it is trashed', () => {
    const g = trig(ID, { leader: OTHER_LEADER, life: [ID, PURPLE, PURPLE, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the [Trigger] adds the card to the hand and draws nothing', () => {
    const g = trig(ID, { leader: OTHER_LEADER });
    g.act({ type: 'trigger', activate: false });
    expect(names(g, 'p1', 'hand')).toEqual([ID]);
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });

  it('is a 4000-power Character with no [On Play] text of its own', () => {
    const g = trig(ID, { leader: OTHER_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });
});

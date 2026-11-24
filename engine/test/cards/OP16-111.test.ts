/** OP16-111 Boa Sandersonia. */
import { describe, expect, it } from 'vitest';
import { hand, PURPLE } from './helpers.ts';
import { names, OTHER_LEADER, trig } from './helpers-op16g4.ts';
import { game, PLAIN_BLUE } from './helpers.ts';

const ID = 'OP16-111';

describe('OP16-111 Boa Sandersonia', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: PLAIN_BLUE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[Trigger] with 2 or less Life (after the damage), play this card', () => {
    // Life [ID, PURPLE]: 1 card is left once this one is taken.
    const g = trig(ID, { leader: OTHER_LEADER });
    g.act({ type: 'trigger', activate: true });
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.life('p1')).toBe(1);
  });

  it('the threshold is inclusive: exactly 2 Life cards left still plays it', () => {
    const g = trig(ID, { leader: OTHER_LEADER, life: [ID, PURPLE, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.life('p1')).toBe(2);
  });

  it('must not play with 3 Life cards left: the card is trashed', () => {
    const g = trig(ID, { leader: OTHER_LEADER, life: [ID, PURPLE, PURPLE, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });
});

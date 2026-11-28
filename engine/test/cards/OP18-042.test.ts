/** OP18-042 Hack. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, pick } from './helpers.ts';
import {
  activate,
  candidates,
  DR_L,
  koBy,
  offeredAb,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers-op18-g2.ts';

const ID = 'OP18-042';
const start = (rested: number, leader = DR_L) =>
  game({ leader, characters: [ID, V.c3], costArea: { active: 2, rested } }, { leader: PLAIN_BLUE });

describe('OP18-042 Hack', () => {
  it('[On K.O.] draws 1 card', () => {
    const g = start(0);
    koBy(g, 'p1', ID, 'p2');
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('[Activate: Main] gives 1 rested DON!! to a {Dressrosa} Leader or Character (not to other types)', () => {
    const g = start(2);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual([g.leader('p1'), g.find('p1', 'characters', ID)].sort());
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('may give it to Hack itself', () => {
    const g = start(1);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
  });

  it('[Once Per Turn]: not offered a second time', () => {
    const g = start(2);
    const id = g.find('p1', 'characters', ID);
    activate(g, id, 'give-don');
    pick(g, [g.leader('p1')]);
    expect(offeredAb(g, id, 'give-don')).toBe(false);
  });

  it('only Hack is a {Dressrosa} card when the Leader is not: the DON!! goes to Hack', () => {
    const g = start(1, PLAIN_PURPLE);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    // the only {Dressrosa} card is Hack
    expect(candidates(g)).toEqual([g.find('p1', 'characters', ID)]);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
    expect(g.card(g.find('p1', 'characters', V.c3)).don).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});

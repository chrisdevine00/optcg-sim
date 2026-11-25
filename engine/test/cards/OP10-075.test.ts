/** OP10-075 Foxy. */
import { describe, expect, it } from 'vitest';
import { hand, trash } from './helpers.ts';
import { activate, canActivate, idsOf, mk, OTHER_LEADER, V, withDon } from './helpers-a10g3.ts';

const ID = 'OP10-075';
type Area = { active: number; rested: number };
const start = (mine: Area, theirs: Area) =>
  mk({ characters: [ID], costArea: mine, deck: [V.c1, V.c2] }, { costArea: theirs });

describe('OP10-075 Foxy', () => {
  it('trashes itself and draws 1 when you have fewer DON!! than your opponent', () => {
    const g = start({ active: 2, rested: 0 }, { active: 5, rested: 0 });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('draws at the equal boundary (rested DON!! count)', () => {
    const g = start({ active: 1, rested: 2 }, { active: 0, rested: 3 });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(hand(g, 'p1')).toEqual([V.c1]);
  });

  it('must not draw with more DON!! than your opponent: the cost is paid and nothing happens', () => {
    const g = start({ active: 4, rested: 0 }, { active: 3, rested: 0 });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c1, V.c2]);
  });

  it('DON!! given to a card count as on your field', () => {
    const g = mk(
      {
        leader: withDon(OTHER_LEADER, 2),
        characters: [ID],
        costArea: { active: 2, rested: 0 },
        deck: [V.c1],
      },
      { costArea: { active: 3, rested: 0 } },
    );
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('can be activated with no DON!! at all (the cost is the Character itself)', () => {
    const g = start({ active: 0, rested: 0 }, { active: 0, rested: 0 });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });
});

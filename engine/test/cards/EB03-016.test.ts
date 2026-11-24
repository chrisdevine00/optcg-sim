/** EB03-016 Kouzuki Hiyori. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, pick, play, V } from './helpers.ts';
import { activate, cardsIn, mk, ODEN_L, STRIKE_L } from './helpers-eb03g1.ts';

const ID = 'EB03-016';

describe('EB03-016 Kouzuki Hiyori', () => {
  it('[On Play] with a [Kouzuki Oden] Leader: draws 1', () => {
    const g = mk({ leader: ODEN_L, hand: [ID] });
    const before = g.zone('p1', 'deck').length;
    play(g, ID);
    expect(cardsIn(g, 'p1', 'hand')).toHaveLength(1);
    expect(g.zone('p1', 'deck')).toHaveLength(before - 1);
  });

  it('[On Play] with another Leader: no draw', () => {
    const g = mk({ leader: STRIKE_L, hand: [ID] });
    play(g, ID);
    expect(cardsIn(g, 'p1', 'hand')).toHaveLength(0);
    expectDecision(g, 'main', 'p1');
  });

  it('an [Kouzuki Oden] Character does not count (the Leader is checked)', () => {
    const g = mk({ leader: STRIKE_L, characters: ['OP14-026'], hand: [ID] });
    play(g, ID);
    expect(cardsIn(g, 'p1', 'hand')).toHaveLength(0);
  });

  it('[Activate: Main] trashes itself, then gives up to 1 rested DON!! to your {Land of Wano} Leader', () => {
    const g = mk({ leader: ODEN_L, characters: [ID], costArea: { active: 2, rested: 2 } });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.leader('p1')]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 1 });
  });

  it('[Activate: Main] with a Leader that is not {Land of Wano}: the cost is paid, nothing is given', () => {
    const g = mk({ leader: STRIKE_L, characters: [ID], costArea: { active: 2, rested: 2 } });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(cardsIn(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g, 'p1')).toMatchObject({ rested: 2 });
  });

  it('[Activate: Main] with no rested DON!!: still trashes, gives nothing', () => {
    const g = mk({ leader: ODEN_L, characters: [ID, V.c1], costArea: { active: 3, rested: 0 } });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});

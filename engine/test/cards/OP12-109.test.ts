/** OP12-109 Pacifista. */
import { describe, expect, it } from 'vitest';
import { dec, hand, pick, trash, V } from './helpers.ts';
import { ids, offeredPicks, trigGame } from './helpers-w6c2.ts';

const ID = 'OP12-109';

describe('OP12-109 Pacifista', () => {
  it('[Trigger]: K.O. up to 1 Character with cost 1 or less (2 is not a target) and add this card to the hand', () => {
    const g = trigGame(ID, {}, { characters: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c2]);
    expect(trash(g, 'p2')).toEqual([V.c1]);
    // The card goes to the hand instead of the trash (CR 10-1-5-3).
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('"and add this card" does not depend on the K.O.: with no target (or none chosen) it still goes to the hand', () => {
    const noTarget = trigGame(ID, {}, { characters: [V.c2] });
    noTarget.act({ type: 'trigger', activate: true });
    if (dec(noTarget)?.kind === 'choose') {
      expect(offeredPicks(noTarget)).toEqual([]);
      noTarget.act({ type: 'done' });
    }
    expect(hand(noTarget, 'p1')).toEqual([ID]);
    expect(ids(noTarget, 'p2', 'characters')).toEqual([V.c7, V.c2]);

    const declined = trigGame(ID, {}, { characters: [V.c1] });
    declined.act({ type: 'trigger', activate: true });
    declined.act({ type: 'done' });
    expect(ids(declined, 'p2', 'characters')).toEqual([V.c7, V.c1]);
    expect(hand(declined, 'p1')).toEqual([ID]);
  });

  it('"up to 1": with two cost 1 Characters only one is K.O.\'d', () => {
    const g = trigGame(ID, {}, { characters: [V.c1, V.c1] });
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c1, 0)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c1]);
    expect(hand(g, 'p1')).toEqual([ID]);
  });

  it('declining the [Trigger] adds the card to the hand and K.O.s nothing', () => {
    const g = trigGame(ID, {}, { characters: [V.c1] });
    g.act({ type: 'trigger', activate: false });
    expect(hand(g, 'p1')).toEqual([ID]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c1]);
  });

  it("a Character with a cost of 1 owned by you is not a target (the opponent's only)", () => {
    const g = trigGame(ID, { characters: [V.c1] }, { characters: [V.c1] });
    g.act({ type: 'trigger', activate: true });
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p1', 'characters')).toEqual([V.c1]);
  });
});

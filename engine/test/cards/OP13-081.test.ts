/** OP13-081 Koala. */
import { describe, expect, it } from 'vitest';
import { expectDecision, don, pick, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';
import { ARMY_LEADER, canActivate, idsOf, mine, OTHER_LEADER } from './helpers-op13g3.ts';

const ID = 'OP13-081';

describe('OP13-081 Koala', () => {
  const start = (leader: string, trash: string[] = [V.c1, V.c2], active = 2, rested = 2) =>
    mine({ leader, characters: [ID], trash }, {}, active, rested);

  it('with a "Revolutionary Army" Leader this Character gains +3 cost (5 becomes 8)', () => {
    const g = start(ARMY_LEADER);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
  });

  it('with another Leader type her cost stays 5', () => {
    const g = start(OTHER_LEADER);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(5);
  });

  it('[Activate: Main] [Once Per Turn] place 1 card from your trash at the bottom of your deck: give up to 1 rested DON!! to your Leader or 1 of your Characters', () => {
    const g = start(OTHER_LEADER);
    const koala = g.find('p1', 'characters', ID);
    activate(g, koala, 'give-don');
    pick(g, [g.find('p1', 'trash', V.c2)]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(idsOf(g, 'p1', 'deck').at(-1)).toBe(V.c2);
    // The rested DON!! goes to the Leader or Koala (the only two targets).
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('may give it to a Character instead of the Leader', () => {
    const g = start(OTHER_LEADER);
    const koala = g.find('p1', 'characters', ID);
    activate(g, koala, 'give-don');
    pick(g, [g.find('p1', 'trash', V.c1)]);
    pick(g, [koala]);
    expect(g.card(koala).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('once per turn: not offered again after use', () => {
    const g = start(OTHER_LEADER, [V.c1]);
    const koala = g.find('p1', 'characters', ID);
    expect(canActivate(g, koala, 'give-don')).toBe(true);
    activate(g, koala, 'give-don');
    pick(g, [g.leader('p1')]);
    expectDecision(g, 'main', 'p1');
    expect(canActivate(g, koala, 'give-don')).toBe(false);
  });

  it('with an empty trash the cost cannot be paid: not offered', () => {
    const g = start(OTHER_LEADER, []);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });

  it('with no rested DON!! the cost is still paid and nothing is given', () => {
    const g = start(OTHER_LEADER, [V.c1], 4, 0);
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});

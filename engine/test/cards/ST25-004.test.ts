/** ST25-004 Buggy. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BUGGY_LEADER,
  CG2,
  CG5,
  CG6,
  CG7,
  dec,
  EVENT,
  expectDecision,
  hand,
  ids,
  mk,
  NOT_BUGGY_LEADER,
  none,
  offeredAb,
  pick,
  pickable,
  trash,
  V,
} from './helpers-lfc.ts';

const ID = 'ST25-004';

describe('ST25-004 Buggy', () => {
  const start = (leader: string, handCards: string[]) =>
    mk({ leader, characters: [ID], hand: handCards });

  it('with a [Buggy] Leader: trashes a card from hand and itself, then plays a {Cross Guild} Character of cost 6 or less', () => {
    const g = start(BUGGY_LEADER, [CG5, V.c2]);
    activate(g, g.find('p1', 'characters', ID), 'main');
    pick(g, [g.find('p1', 'hand', V.c2)]); // the cost
    pick(g, [g.find('p1', 'hand', CG5)]);
    expect(ids(g, 'p1', 'characters')).toEqual([CG5]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c2].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('the play is limited to {Cross Guild} Characters of cost 6 or less (6 yes, 7 no; Events and other types no)', () => {
    const g = start(BUGGY_LEADER, [CG2, CG6, CG7, V.c3, EVENT, V.c1]);
    activate(g, g.find('p1', 'characters', ID), 'main');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const open = pickable(g);
    expect(open.sort()).toEqual([g.find('p1', 'hand', CG2), g.find('p1', 'hand', CG6)].sort());
  });

  it('"up to 1": the play may be declined, and the cost stays paid', () => {
    const g = start(BUGGY_LEADER, [CG5, V.c2]);
    activate(g, g.find('p1', 'characters', ID), 'main');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([CG5]);
    expect(trash(g, 'p1')).toContain(ID);
  });

  it('must not play with a Leader that is not [Buggy]: the cost is paid and nothing is asked', () => {
    const g = start(NOT_BUGGY_LEADER, [CG5, V.c2]);
    activate(g, g.find('p1', 'characters', ID), 'main');
    pick(g, [g.find('p1', 'hand', V.c2)]);
    // The effect's `if` fails: no play prompt at all.
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([CG5]);
    expect(trash(g, 'p1')).toContain(ID);
  });

  it('the card trashed as the cost cannot be the card played; with an empty hand the ability is not offered', () => {
    const g = start(BUGGY_LEADER, [CG5]);
    activate(g, g.find('p1', 'characters', ID), 'main');
    // The only card in hand is the cost; the play is then asked at max 0 (nothing to choose).
    pick(g, [g.find('p1', 'hand', CG5)]);
    expect(expectDecision(g, 'choose', 'p1').max).toBe(0);
    none(g);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1').sort()).toEqual([CG5, ID].sort());
    const empty = start(BUGGY_LEADER, []);
    expect(offeredAb(empty, empty.find('p1', 'characters', ID), 'main')).toBe(false);
  });
});

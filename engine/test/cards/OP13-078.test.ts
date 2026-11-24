/** OP13-078 Oro Jackson. */
import { describe, expect, it } from 'vitest';
import { addMost, don, expectDecision, pick, V } from './helpers.ts';
import {
  idsOf,
  koedInBattle,
  mine,
  plant,
  plantOpponentEffect,
  RP,
  SHANKS,
} from './helpers-op13g3.ts';

const ID = 'OP13-078';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('OP13-078 Oro Jackson', () => {
  /** p2's turn with Oro Jackson on p1's field. */
  const theirTurn = (chars: string[]) => {
    const g = mine({ stage: ID, characters: chars }, {}, 4);
    g.act({ type: 'endTurn' });
    return g;
  };
  const remove = (g: ReturnType<typeof theirTurn>, target: string, action = KO) => {
    plantOpponentEffect(g, action);
    pick(g, [g.find('p1', 'characters', target)]);
  };

  it("[Once Per Turn] when your {Roger Pirates} Character is removed by your opponent's effect: add up to 1 DON!! from the DON!! deck and rest it", () => {
    const g = theirTurn([RP, V.c3]);
    const before = don(g, 'p1');
    remove(g, RP);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ rested: before.rested + 1, active: before.active });
    expect(idsOf(g, 'p1', 'trash')).toEqual([RP]);
  });

  it('a removal that is not a K.O. counts too (returned to the hand)', () => {
    const g = theirTurn([RP]);
    remove(g, RP, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    } as never);
    expectDecision(g, 'choose', 'p1');
    addMost(g);
    expect(idsOf(g, 'p1', 'hand')).toEqual([RP]);
  });

  it('only once per turn: a second removal in the same turn adds nothing', () => {
    const g = theirTurn([RP, SHANKS]);
    remove(g, RP);
    addMost(g);
    const mid = don(g, 'p1');
    remove(g, SHANKS);
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toEqual(mid);
  });

  it('a Character without a Roger Pirates type does not trigger it', () => {
    const g = theirTurn([V.c3]);
    const before = don(g, 'p1');
    remove(g, V.c3);
    expectDecision(g, 'main', 'p2');
    expect(don(g, 'p1')).toEqual(before);
  });

  it('a K.O. in battle does not trigger it', () => {
    const g = koedInBattle(RP, {
      leader: 'ST01-001',
      stage: ID,
      costArea: { active: 4, rested: 0 },
    });
    expectDecision(g, 'main', 'p2');
    expect(idsOf(g, 'p1', 'trash')).toEqual([RP]);
  });

  it('your own effect removing your Character does not trigger it', () => {
    const g = mine({ stage: ID, characters: [RP] }, {}, 4);
    plant(g, 'p1', { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'trash')).toEqual([RP]);
    expect(don(g, 'p1').rested).toBe(0);
  });
});

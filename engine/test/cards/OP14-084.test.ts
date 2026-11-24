/** OP14-084 Ms. All Sunday. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, V } from './helpers.ts';
import {
  BW1,
  BW1B,
  BW4,
  BW5,
  BW_LEADER,
  canPick,
  idsOf,
  mine,
  OTHER_LEADER,
} from './helpers-op14g3.ts';

const ID = 'OP14-084';

describe('OP14-084 Ms. All Sunday', () => {
  const start = (leader: string, trash: string[]) => mine(leader, { hand: [ID], trash }, {}, 7);

  it('[On Play] with a Baroque Works Leader: play up to 1 BW Character cost 4 or less and up to 1 BW Character cost 1 from your trash', () => {
    const g = start(BW_LEADER, [BW4, BW1, BW5]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'trash', BW5))).toBe(false); // cost 5
    pick(g, [g.find('p1', 'trash', BW4)]);
    pick(g, [g.find('p1', 'trash', BW1)]);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([ID, BW4, BW1].sort());
    expect(idsOf(g, 'p1', 'trash')).toEqual([BW5]);
  });

  it('the second pick is a cost of exactly 1 (a cost 4 card is not offered)', () => {
    const g = start(BW_LEADER, [BW4, BW1, V.c1]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', BW1)]);
    // BW1 was played by the first pick; the cost-1 slot has no other candidate (V.c1 is not Baroque Works).
    expect(dec(g)?.kind).not.toBe('choose');
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([ID, BW1].sort());
  });

  it('two cost-1 cards can fill both slots; each pick is "up to 1"', () => {
    const g = start(BW_LEADER, [BW1, BW1B]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', BW1)]);
    pick(g, [g.find('p1', 'trash', BW1B)]);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([ID, BW1, BW1B].sort());
  });

  it('either pick may be declined', () => {
    const g = start(BW_LEADER, [BW4, BW1]);
    play(g, ID);
    none(g);
    pick(g, [g.find('p1', 'trash', BW1)]);
    expect(idsOf(g, 'p1', 'characters').sort()).toEqual([ID, BW1].sort());
  });

  it('a Leader whose type does not include Baroque Works plays nothing and asks nothing', () => {
    const g = start(OTHER_LEADER, [BW4, BW1]);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });
});

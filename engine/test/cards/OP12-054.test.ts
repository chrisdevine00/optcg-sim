/** OP12-054 Marshall.D.Teach. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { BW_LEADER, ids, mine, offered, OTHER_LEADER } from './helpers-op12g2.ts';

const ID = 'OP12-054';

describe('OP12-054 Marshall.D.Teach', () => {
  const start = (leader: string) =>
    mine({ leader, hand: [ID], characters: [V.c1, V.c2] }, { characters: [V.c1, V.c3] });

  it("with a {The Seven Warlords of the Sea} Leader: returns an opposing cost 1 Character to its owner's hand", () => {
    const g = start(BW_LEADER);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(ids(g, 'p2', 'hand')).toEqual([V.c1]);
  });

  it('may return your own cost 1 Character; cost 1 is the limit and Teach (cost 1) is excluded', () => {
    const g = start(BW_LEADER);
    play(g, ID);
    const cands = offered(g);
    expect(cands).toContain(g.find('p1', 'characters', V.c1));
    expect(cands).toContain(g.find('p2', 'characters', V.c1));
    expect(cands).not.toContain(g.find('p1', 'characters', ID));
    expect(cands).not.toContain(g.find('p1', 'characters', V.c2));
    expect(cands).not.toContain(g.find('p2', 'characters', V.c3));
    expect(cands).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(ids(g, 'p1', 'hand')).toEqual([V.c1]);
  });

  it('"up to 1": may return nothing', () => {
    const g = start(BW_LEADER);
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c3]);
    expect(ids(g, 'p1', 'characters')).toHaveLength(3);
  });

  it('must not fire with a Leader that lacks the type: nothing is asked or returned', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c3]);
  });
});

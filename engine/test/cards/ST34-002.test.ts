/** ST34-002 Charlotte Cracker. */
import { describe, expect, it } from 'vitest';
import {
  addMost,
  don,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { BMP_LEADER, donArea, ids, NONSLASH_LEADER, offeredPicks } from './helpers-stg1.ts';

const ID = 'ST34-002';

const start = (leader: string, opp: Parameters<typeof game>[1]['characters'], donDeck?: number) =>
  game(
    {
      leader,
      hand: [ID],
      ...(donDeck === undefined ? donArea(4) : { ...donArea(4), donDeck }),
    },
    { leader: PLAIN_BLUE, characters: opp },
  );

describe('ST34-002 Charlotte Cracker', () => {
  it("[On Play]: if your Leader has {Big Mom Pirates}, add up to 1 DON!! and rest it. Then, K.O. up to 1 of your opponent's Characters with a cost of 2 or less", () => {
    const g = start(BMP_LEADER, [V.c2, V.c3]);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 4 + 1 });
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c2)]);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c2]);
  });

  it('without a {Big Mom Pirates} Leader neither step happens: no DON!! added, no K.O., nothing asked', () => {
    const g = start(NONSLASH_LEADER, [V.c1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(don(g, 'p1')).toMatchObject({ rested: 4 });
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('a cost of 3 is not a candidate (exact boundary at 2) and "up to 1" may K.O. none, the DON!! still being added', () => {
    const g = start(BMP_LEADER, [V.c3, V.c2]);
    play(g, ID);
    addMost(g);
    none(g);
    expect(ids(g, 'p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1').rested).toBe(5);
  });

  it('"Then" is a sequence: with the DON!! deck empty the K.O. still happens', () => {
    const g = game(
      { leader: BMP_LEADER, hand: [ID], ...donArea(10), donDeck: 0 },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(0);
  });

  it('may add no DON!! ("up to 1") and still K.O.', () => {
    const g = start(BMP_LEADER, [V.c1]);
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options!.map((o) => o.label)).toEqual(['1 DON!!', 'None']);
    g.act({ type: 'pick', choice: { option: d.options![1]!.id } });
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(don(g, 'p1').rested).toBe(4);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([]);
  });
});

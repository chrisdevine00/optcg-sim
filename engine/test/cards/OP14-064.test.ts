/** OP14-064 Giolla. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, none, pick, V } from './helpers.ts';
import { canPick, DP_LEADER, idsOf, koedInBattle, ZERO_POWER } from './helpers-op14g3.ts';

const ID = 'OP14-064';

describe('OP14-064 Giolla', () => {
  const ko = (opp: string[], donDeck?: number) =>
    koedInBattle(
      ID,
      { leader: DP_LEADER, costArea: { active: donDeck === 0 ? 10 : 0, rested: 0 }, donDeck },
      { characters: opp },
    );

  it('[On K.O.] add up to 1 DON!! rested, then K.O. up to 1 opposing Character with a base power of 0', () => {
    const g = ko([ZERO_POWER, V.c1]);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false);
    pick(g, [g.find('p2', 'characters', ZERO_POWER)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([ZERO_POWER]);
  });

  it('a Character with a base power of 3000 is not a target', () => {
    const g = ko([V.c1]);
    addMost(g);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = ko([ZERO_POWER]);
    addMost(g);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toContain(ZERO_POWER);
  });

  it('"Then" is not "if you do": with an empty DON!! deck the K.O. still happens', () => {
    const g = ko([ZERO_POWER], 0);
    expect(dec(g)?.kind).toBe('choose');
    pick(g, [g.find('p2', 'characters', ZERO_POWER)]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([ZERO_POWER]);
  });

  it('the added DON!! can be declined (count 0) and the K.O. is still offered', () => {
    const g = ko([ZERO_POWER]);
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1').rested).toBe(0);
    expectDecision(g, 'choose');
  });
});

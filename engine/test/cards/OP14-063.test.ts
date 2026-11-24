/** OP14-063 Sugar. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, DP3, DP5, DP6, DP_LEADER, idsOf, koedInBattle, mine } from './helpers-op14g3.ts';

const ID = 'OP14-063';

describe('OP14-063 Sugar', () => {
  it('[On Play] add up to 1 DON!! from the DON!! deck and set it as active', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 5);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4, deck: 4 });
  });

  it('"up to 1": may add none', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 5);
    play(g, ID);
    const d = expectDecision(g, 'choose');
    g.act({ type: 'pick', choice: { option: d.options!.at(-1)!.id } });
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 4, deck: 5 });
  });

  const ko = (oppDon: number, hnd: string[]) =>
    koedInBattle(ID, { leader: DP_LEADER, hand: hnd }, { costArea: { active: oppDon, rested: 0 } });

  it('[On K.O.] with 6 opposing DON!!: play up to 1 {Donquixote Pirates} Character with a cost of 5 or less from your hand', () => {
    const g = ko(6, [DP3, DP5]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', DP5)]);
    expect(idsOf(g, 'p1', 'characters')).toEqual([DP5]);
    expect(hand(g, 'p1')).toEqual([DP3]);
  });

  it('cost 6 and non-{Donquixote Pirates} cards are not candidates; "up to 1" may play nothing', () => {
    const g = ko(6, [DP6, V.c1, DP3]);
    expect(canPick(g, g.find('p1', 'hand', DP6))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', DP3))).toBe(true);
    none(g);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('with only 5 opposing DON!! the condition fails and nothing is asked', () => {
    const g = ko(5, [DP3]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('opposing DON!! given to a Character count (cost area 4 + 2 given)', () => {
    const g = koedInBattle(
      ID,
      { leader: DP_LEADER, hand: [DP3] },
      { costArea: { active: 4, rested: 0 }, characters: [{ card: V.c1, don: 2 }] },
    );
    expectDecision(g, 'choose', 'p1');
  });
});

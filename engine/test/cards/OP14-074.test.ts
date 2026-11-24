/** OP14-074 Monet. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { DP_LEADER, koedInBattle, mine, OTHER_LEADER } from './helpers-op14g3.ts';

const ID = 'OP14-074';

describe('OP14-074 Monet', () => {
  it('[On Play] with a {Donquixote Pirates} Leader: add up to 1 DON!! and set it as active', () => {
    const g = mine(DP_LEADER, { hand: [ID] }, {}, 5);
    play(g, ID);
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5, deck: 4 });
  });

  it('[On Play] with another Leader nothing is added and nothing is asked', () => {
    const g = mine(OTHER_LEADER, { hand: [ID] }, {}, 5);
    play(g, ID);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(don(g, 'p1').deck).toBe(5);
  });

  const ko = (hnd: string[] = [V.c1]) =>
    koedInBattle(ID, {
      leader: DP_LEADER,
      hand: hnd,
      deck: [V.c2, V.c3, V.c4],
      costArea: { active: 0, rested: 0 },
    });

  it('[On K.O.] draw 2, trash 1 from your hand, then add up to 2 DON!! rested', () => {
    const g = ko();
    expect(hand(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(trash(g, 'p1')).toContain(V.c1);
    expect(hand(g, 'p1').sort()).toEqual([V.c2, V.c3].sort());
    addMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2, deck: 8 });
  });

  it('the trash is mandatory and exactly 1: the drawn cards are candidates', () => {
    const g = ko();
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks).toHaveLength(3);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('"up to 2": the count may be 1 or 0', () => {
    const g = ko();
    pick(g, [g.find('p1', 'hand', V.c1)]);
    const d = expectDecision(g, 'choose');
    expect(d.options!.map((o) => o.label)).toHaveLength(3);
    g.act({ type: 'pick', choice: { option: d.options![1]!.id } });
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('with an empty hand the drawn cards are still trashed from, and the DON!! is added', () => {
    const g = ko([]);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    addMost(g);
    expect(don(g, 'p1').rested).toBe(2);
  });
});

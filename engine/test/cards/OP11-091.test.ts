/** OP11-091 Berry Good. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, pick, play, V } from './helpers.ts';
import { canPick, EVT, finishOrder, idsOf, mk } from './helpers-op11g3.ts';

const ID = 'OP11-091';

describe('OP11-091 Berry Good', () => {
  const start = (trash: string[], deck: string[] = [V.c1, V.c2]) =>
    mk({ hand: [ID], costArea: { active: 4, rested: 0 } }, { trash, deck });

  it('[On Play]: your opponent places 3 Events from their trash at the bottom of their deck (they choose)', () => {
    const g = start([EVT[0], EVT[1], EVT[2], EVT[3], V.c3]);
    play(g, ID);
    expectDecision(g, 'choose', 'p2');
    expect(canPick(g, g.find('p2', 'trash', V.c3))).toBe(false);
    pick(g, [
      g.find('p2', 'trash', EVT[0]),
      g.find('p2', 'trash', EVT[1]),
      g.find('p2', 'trash', EVT[3]),
    ]);
    finishOrder(g);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'deck').slice(0, 2)).toEqual([V.c1, V.c2]);
    expect(idsOf(g, 'p2', 'deck').slice(2).sort()).toEqual([EVT[0], EVT[1], EVT[3]].sort());
    expect(idsOf(g, 'p2', 'trash').sort()).toEqual([V.c3, EVT[2]].sort());
  });

  it('the opponent decides the order of the three', () => {
    const g = start([EVT[0], EVT[1], EVT[2]]);
    play(g, ID);
    if (dec(g)?.kind === 'choose')
      pick(g, [
        g.find('p2', 'trash', EVT[0]),
        g.find('p2', 'trash', EVT[1]),
        g.find('p2', 'trash', EVT[2]),
      ]);
    expect(dec(g)?.kind).toBe('order');
    expect(dec(g)?.player).toBe('p2');
    finishOrder(g);
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
    expect(idsOf(g, 'p2', 'deck')).toHaveLength(5);
  });

  it('with fewer than 3 Events they place all they have', () => {
    const g = start([EVT[0], EVT[1], V.c3]);
    play(g, ID);
    while (dec(g)?.kind === 'choose' || dec(g)?.kind === 'order') g.act(g.legal()[0]!);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c3]);
    expect(idsOf(g, 'p2', 'deck').slice(2).sort()).toEqual([EVT[0], EVT[1]].sort());
  });

  it('with no Events in their trash nothing happens', () => {
    const g = start([V.c3, V.c4]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p2', 'trash')).toHaveLength(2);
  });

  it('your own trash is not touched', () => {
    const g = mk(
      { hand: [ID], trash: [EVT[0]], costArea: { active: 4, rested: 0 } },
      { trash: [] },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(idsOf(g, 'p1', 'trash')).toEqual([EVT[0]]);
  });
});

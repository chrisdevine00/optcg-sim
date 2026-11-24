/** OP14-017 Chambres. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, pick, V } from './helpers.ts';
import { canPick, mk, SN2 } from './helpers-w4sb.ts';

const ID = 'OP14-017';
/** A 10000-power Character (OP14-009: its effects need an attack by p1, which never happens here). */
const TEN = 'OP14-009';
const pw = (g: ReturnType<typeof mk>, card: string) => g.power(g.find('p2', 'characters', card));

describe('OP14-017 Chambres', () => {
  it('[Main]: swaps the base power of 2 opposing Characters during this turn', () => {
    const g = mk({ hand: [ID] }, { characters: [SN2, V.c4] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    pick(g, [g.find('p2', 'characters', SN2)]); // a; b is the only other eligible Character
    expect([pw(g, SN2), pw(g, V.c4)]).toEqual([6000, 2000]);
    expectDecision(g, 'main', 'p1');
  });

  it('boundary: 9000 base power is eligible, 10000 is not', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c7, SN2, TEN] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', SN2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', TEN))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect([pw(g, V.c7), pw(g, SN2), pw(g, TEN)]).toEqual([2000, 9000, 10000]);
  });

  it('must not touch your own Characters, and does nothing with one eligible opposing Character', () => {
    const g = mk({ hand: [ID], characters: [V.c1, V.c2] }, { characters: [V.c4, TEN] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
    expect([pw(g, V.c4), pw(g, TEN)]).toEqual([6000, 10000]);
  });

  it('the swap ends with the turn', () => {
    const g = mk({ hand: [ID] }, { characters: [SN2, V.c4] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    pick(g, [g.find('p2', 'characters', SN2)]);
    g.act({ type: 'endTurn' });
    expect([pw(g, SN2), pw(g, V.c4)]).toEqual([2000, 6000]);
  });

  it('the Event is trashed and costs 3', () => {
    const g = mk({ hand: [ID] }, { characters: [SN2, V.c4] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    pick(g, [g.find('p2', 'characters', SN2)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
    expect(don(g, 'p1').active).toBe(7);
  });
});

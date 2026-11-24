/** OP11-002 Ain. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { buff, canPick, ids, mk, ZERO } from './helpers-op11g1.ts';

const ID = 'OP11-002';
const start = (p2chars: string[]) => mk({ hand: [ID] }, { characters: p2chars });

describe('OP11-002 Ain', () => {
  it('[On Play]: -1000 power this turn, then K.O. a Character with 0 power or less (the lowered one qualifies)', () => {
    const g = start([V.c1]);
    buff(g, g.find('p2', 'characters', V.c1), -2000, 'p1'); // 3000 -> 1000
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(ids(g, 'p2', 'characters')).toEqual([]);
  });

  it('boundary: 1 power is not K.O.-eligible, 0 is', () => {
    const g = start([ZERO, V.c1]);
    buff(g, g.find('p2', 'characters', V.c1), -2999, 'p1'); // 1 power
    play(g, ID);
    pick(g, [g.find('p2', 'characters', ZERO)]); // -1000 to the 0-power one
    expect(canPick(g, g.find('p2', 'characters', ZERO))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(false); // still 1 power
    pick(g, [g.find('p2', 'characters', ZERO)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('"Then" is not "If you do": with no power given, a 0-power Character can still be K.O.\'d', () => {
    const g = start([ZERO, V.c1]);
    play(g, ID);
    none(g); // give nobody -1000
    pick(g, [g.find('p2', 'characters', ZERO)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('must not K.O. a Character that stays above 0: nothing eligible, no prompt', () => {
    const g = start([V.c1, V.c2]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]); // 3000 -> 2000
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
  });

  it('the lowering lasts only this turn', () => {
    const g = start([V.c1]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(2000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });
});

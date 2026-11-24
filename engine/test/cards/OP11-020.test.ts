/** OP11-020 X Calibur. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, NAVY, pw, trigGame } from './helpers-op11g1.ts';

const ID = 'OP11-020';
const start = () =>
  mk({ hand: [ID], characters: [NAVY.c2, V.c1] }, { characters: [V.c1, V.c2, V.c3] });

describe('OP11-020 X Calibur', () => {
  it('[Main]: up to 2 opponent Characters get -2000, then a {Navy} Character gets +1000 (this turn)', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c3)]);
    expect(pw(g, 'p2', V.c1)).toBe(1000);
    expect(pw(g, 'p2', V.c2)).toBe(4000);
    expect(pw(g, 'p2', V.c3)).toBe(3000);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // not {Navy}
    pick(g, [g.find('p1', 'characters', NAVY.c2)]);
    expect(pw(g, 'p1', NAVY.c2)).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p2', V.c1)).toBe(3000);
    expect(pw(g, 'p1', NAVY.c2)).toBe(4000);
  });

  it('"up to 2": a single target is allowed, and so is none', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(pw(g, 'p2', V.c2)).toBe(4000 - 2000);
    expect(pw(g, 'p2', V.c1)).toBe(3000);
    none(g);
    const h = start();
    play(h, ID);
    none(h);
    expect(pw(h, 'p2', V.c1)).toBe(3000);
  });

  it('"Then" is sequential: the {Navy} boost still happens when no opponent Character was lowered', () => {
    const g = start();
    play(g, ID);
    none(g);
    pick(g, [g.find('p1', 'characters', NAVY.c2)]);
    expect(pw(g, 'p1', NAVY.c2)).toBe(5000);
  });

  it('with no {Navy} Character the boost is not asked', () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [V.c1] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('[Trigger]: K.O. a Character with 4000 power or less', () => {
    const g = trigGame(ID, {}, [V.c2, V.c3]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // 4000
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // 5000
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c3]);
  });
});

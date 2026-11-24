/** OP11-018 Honesty Impact. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import { canPick, ids, mk, pw, trigGame } from './helpers-op11g1.ts';

const ID = 'OP11-018';
const main = (p2chars: string[]) => mk({ hand: [ID] }, { characters: p2chars });

describe('OP11-018 Honesty Impact', () => {
  it('[Main]: -4000 power, then K.O. a Character with 6000 power or less (the lowered one qualifies)', () => {
    const g = main([V.c7, V.c5, V.c4]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c7)]); // 9000 -> 5000
    expect(pw(g, 'p2', V.c7)).toBe(5000);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // 6000: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // 7000
    pick(g, [g.find('p2', 'characters', V.c7)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5, V.c4]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"Then" is not "If you do": with nobody lowered a 6000 Character can still be K.O.\'d', () => {
    const g = main([V.c4, V.c5]);
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('must not K.O. a 7000 Character, and the -4000 ends with the turn', () => {
    const g = main([V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]); // 7000 -> 3000: now eligible
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p2', V.c5)).toBe(7000);
  });

  it('[Trigger]: K.O. a Character with 6000 power or less', () => {
    const g = trigGame(ID, {}, [V.c4, V.c5]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c5]);
  });

  it('[Trigger]: "up to 1": may K.O. nobody; with no eligible target nothing is asked', () => {
    const g = trigGame(ID, {}, [V.c4]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c7, V.c4]);
    const h = trigGame(ID, {}, [V.c5]);
    h.act({ type: 'trigger', activate: true });
    expect(dec(h)?.kind).not.toBe('choose');
  });
});

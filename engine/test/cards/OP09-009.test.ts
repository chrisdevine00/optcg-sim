/** OP09-009 Benn.Beckman. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { boost, canPick, ids, mk, shrink, types } from './helpers-a09g1.ts';

const ID = 'OP09-009';

describe('OP09-009 Benn.Beckman', () => {
  it("[On Play]: trashes up to 1 of your opponent's Characters with 6000 power or less (a trash, not a K.O.)", () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c5] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c4]);
    expect(types(g)).not.toContain('KO');
  });

  it('boundary: 6000 is a candidate, 7000 is not', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c5, V.c1] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
  });

  it('reads current power: a 7000 Character lowered to 6000 qualifies, a 6000 one raised to 7000 does not', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4, V.c5] });
    shrink(g, g.find('p2', 'characters', V.c5), 1000);
    boost(g, g.find('p2', 'characters', V.c4), 1000);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
  });

  it('"up to 1": may trash nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('only opponent Characters: not their Leader, not your own Characters', () => {
    const g = mk({ hand: [ID], characters: [V.c1] }, { characters: [V.c4] });
    play(g, ID);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
  });

  it('with no eligible Character nothing is asked', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c5] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });
});

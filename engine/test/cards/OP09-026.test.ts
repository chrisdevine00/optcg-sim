/** OP09-026 Sakazuki. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, ids, mk, rested, types } from './helpers-a09g1.ts';

const ID = 'OP09-026';
const two = [rested(V.c1), rested(V.c2)];

describe('OP09-026 Sakazuki', () => {
  it("[On Play]: with 2 rested Characters, K.O.s up to 1 of your opponent's Characters with a cost of 5 or less", () => {
    const g = mk({ hand: [ID], characters: two }, { characters: [V.c5, V.c6] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c6]);
    expect(ids(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(types(g)).toContain('KO');
  });

  it('boundary: cost 5 is a candidate, cost 6 is not; the Leader is not a candidate', () => {
    const g = mk({ hand: [ID], characters: two }, { characters: [V.c5, V.c6, V.c1] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
  });

  it('must not K.O. with only 1 rested Character (no choice is asked)', () => {
    const g = mk({ hand: [ID], characters: [rested(V.c1), V.c2] }, { characters: [V.c5] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('Sakazuki is not rested when played: he does not count toward the 2', () => {
    const g = mk({ hand: [ID], characters: [rested(V.c1)] }, { characters: [V.c5] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = mk({ hand: [ID], characters: two }, { characters: [V.c5] });
    play(g, ID);
    none(g);
    expect(ids(g, 'p2', 'characters')).toEqual([V.c5]);
  });
});

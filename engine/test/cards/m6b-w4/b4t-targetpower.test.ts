/**
 * B4T-R1: "Set the power of ... to 0" lowers the target's power by its current power at resolution
 * (CR 4-12-1, rules-digest 35), so power from given DON!! or an earlier buff does not survive.
 * The amount `{ mul: [{ targetPower: true }, -1] }` reads the target's current power once per
 * target. Planted on vanilla cards; each test fails with the `targetPower` read reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities } from '../../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { boost } from '../helpers-op15g1.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const sel = (owner: 'you' | 'opponent') => ({ from: 'characters', owner });
const zero = (owner: 'you' | 'opponent') =>
  ({
    do: {
      power: {
        target: sel(owner),
        amount: { mul: [{ targetPower: true }, -1] },
        duration: 'thisTurn',
      },
    },
  }) as const;

const oneOpp = () =>
  game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE, characters: [V.c5] });

describe('B4T-R1 targetPower', () => {
  it('validates in a power or cost amount only', () => {
    expectValid([main([zero('opponent')] as never)]);
    const raw = (effect: unknown[]) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect,
    });
    expect(errorsOf(raw([{ do: { draw: { targetPower: true } } }]))).not.toEqual([]);
    expect(
      errorsOf(raw([{ if: { cmp: [{ targetPower: true }, '>=', 1] }, then: [] }])),
    ).not.toEqual([]);
  });

  it('an unbuffed target goes to 0', () => {
    const g = oneOpp();
    g.state = withAbilities(g.state, BLUE, [main([zero('opponent')] as never)]);
    run(g);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(0);
  });

  it('a buffed target goes to 0 and a later buff still adds', () => {
    const g = oneOpp();
    const t = g.find('p2', 'characters', V.c5);
    boost(g, t, 2000);
    g.state = withAbilities(g.state, BLUE, [main([zero('opponent')] as never)]);
    run(g);
    expect(g.power(t)).toBe(0);
    boost(g, t, 1000);
    expect(g.power(t)).toBe(1000);
  });

  it("DON!! given to the target (+1000 each on its owner's turn) do not survive", () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, { card: PURPLE, don: 3 }] },
      { leader: PLAIN_BLUE },
    );
    const t = g.find('p1', 'characters', PURPLE);
    expect(g.power(t)).toBeGreaterThanOrEqual(4000); // printed power plus 3000 from DON!!
    g.state = withAbilities(g.state, BLUE, [main([zero('you')] as never)]);
    run(g);
    expect(g.power(t)).toBe(0);
  });
});

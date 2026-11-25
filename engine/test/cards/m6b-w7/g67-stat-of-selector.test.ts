/**
 * M6b wave 7, G67: `Num` of a selector (OP14-053 Vista: "this Character's base power becomes the
 * same as your Leader's base power", OP10-022 Trafalgar Law: "if the total cost of your Characters
 * is 5 or more"). `{ statOf }` reads one stat of the card a zone names (the Leader, this card) where
 * nothing can be bound; `{ totalCost }` adds up the current costs of the cards a selector names.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, hand, PLAIN_BLUE, PLAIN_PURPLE, pick, V } from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const leaderStat = (stat: string, over: object = {}) => ({
  statOf: { from: 'leader', owner: 'you', ...over },
  stat,
});
const totalCost = (over: object = {}) => ({
  totalCost: { from: 'characters', owner: 'you', ...over },
});
const basePowerPermanent = (value: unknown): Ability =>
  ({
    id: 'p',
    kind: 'permanent',
    apply: [{ setBasePower: { target: { from: 'self', owner: 'you' }, value } }],
  }) as unknown as Ability;

describe('G67 a stat of a selector', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (n: unknown) =>
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [{ if: { cmp: [n, '>=', 1] }, then: [{ do: { draw: 1 } }] }],
      });
    expect(bad(leaderStat('basePower'))).toEqual([]);
    expect(bad({ statOf: { from: 'self', owner: 'you' }, stat: 'cost' })).toEqual([]);
    expect(bad(totalCost())).toEqual([]);
    expect(bad(totalCost({ from: ['characters', 'stage'] }))).toEqual([]);
    // One card by zone: no pick, no bind, not several zones, not a hand; a stat that exists.
    expect(bad(leaderStat('basePower', { pick: { exactly: 1 } }))).not.toEqual([]);
    expect(bad(leaderStat('basePower', { bind: 'x' }))).not.toEqual([]);
    expect(bad(leaderStat('basePower', { from: 'characters' }))).not.toEqual([]);
    expect(bad(leaderStat('basePower', { owner: 'any' }))).not.toEqual([]);
    expect(bad(leaderStat('life'))).not.toEqual([]);
    // A total adds up every match: no choice; the field only.
    expect(bad(totalCost({ pick: { upTo: 1 } }))).not.toEqual([]);
    expect(bad(totalCost({ from: 'hand' }))).not.toEqual([]);
  });

  it('a permanent base power "the same as your Leader’s base power" (OP14-053)', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [basePowerPermanent(leaderStat('basePower'))]);
    // Mohji prints 3000; the Leader's base power is 5000.
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(5000);
  });

  it('reads the Leader’s base power, not its current power: DON!! given do not count', () => {
    const g = game(
      { leader: { card: PLAIN_PURPLE, don: 2 }, characters: [BLUE] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [basePowerPermanent(leaderStat('basePower'))]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(5000);
    // The current power is the other stat.
    g.state = withAbilities(g.state, BLUE, [basePowerPermanent(leaderStat('power'))]);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(7000);
  });

  it('follows the Leader: the opponent’s Leader is read with owner "opponent"', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      basePowerPermanent(leaderStat('basePower', { owner: 'opponent' })),
    ]);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(5000); // ST03-001 prints 5000 too
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'p',
        kind: 'permanent',
        apply: [
          {
            power: {
              target: { from: 'self', owner: 'you' },
              amount: { mul: [{ statOf: { from: 'self', owner: 'you' }, stat: 'cost' }, 1000] },
            },
          },
        ],
      } as unknown as Ability,
    ]);
    // Mohji costs 1: +1000 for each point of its own cost.
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(4000);
  });

  const drawIfTotal = (n: number): unknown[] => [
    {
      if: { cmp: [totalCost(), '>=', n] },
      then: [{ do: { draw: 1 } }],
    },
  ];
  const mkTotal = (chars: string[], effect: unknown[]) => {
    const g = game({ leader: PLAIN_PURPLE, characters: chars }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [main(effect as never)]);
    return g;
  };

  it('the total cost of your Characters (OP10-022)', () => {
    const under = mkTotal([BLUE, V.c3], drawIfTotal(5)); // 1 + 3 = 4
    const b = hand(under, 'p1').length;
    run(under);
    expect(hand(under, 'p1')).toHaveLength(b);
    const over = mkTotal([BLUE, V.c4], drawIfTotal(5)); // 1 + 4 = 5
    run(over);
    expect(hand(over, 'p1')).toHaveLength(b + 1);
  });

  it('reads the cost as it is now: an effect that raises it first counts', () => {
    const raise = {
      do: {
        cost: {
          target: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
          amount: 2,
          duration: 'thisTurn',
        },
      },
    };
    const g = mkTotal([BLUE, V.c3], [raise, ...drawIfTotal(5)]);
    const b = hand(g, 'p1').length;
    run(g);
    // The pick of the card to raise comes first.
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(hand(g, 'p1')).toHaveLength(b + 1);
  });

  it('only the cards the selector names are added', () => {
    const g = mkTotal(
      [BLUE, V.c4],
      [
        {
          if: { cmp: [totalCost({ filter: { cost: { lte: 1 } } }), '>=', 5] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    );
    const b = hand(g, 'p1').length;
    run(g);
    expect(hand(g, 'p1')).toHaveLength(b);
  });
});

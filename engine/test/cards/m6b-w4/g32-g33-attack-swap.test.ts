/**
 * M6b wave 4, G32 (`canAttackActive`: "can also attack active Characters during this turn") and
 * G33 (`swapBasePower`: "swap the base power of the selected cards"). Planted on vanilla cards;
 * each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  takeDamage,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const raw = (effect: unknown[]) => ({ id: 'a', kind: 'activate', when: 'activateMain', effect });

describe('G32 can also attack active Characters', () => {
  const grant = (target: object = { from: 'self', owner: 'you' }) =>
    ({
      do: { canAttackActive: { target, duration: 'thisTurn' } },
    }) as const;
  const mk = () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, { card: V.c1, playedThisTurn: true }] },
      { leader: PLAIN_BLUE, characters: [PURPLE, { card: V.c2, rested: true }] },
    );
    g.state = withAbilities(g.state, BLUE, [main([grant()] as never)]);
    return g;
  };
  const can = (g: ReturnType<typeof mk>, attacker: string, target: string, p2 = 'characters') =>
    g.isLegal({
      type: 'attack',
      attacker: g.find('p1', 'characters', attacker),
      target: g.find('p2', p2 as 'characters', target),
      player: 'p1',
    });

  it('validates: a Leader or Character, this turn only', () => {
    expectValid([main([grant()] as never)]);
    expectValid([
      main([grant({ from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } })] as never),
    ]);
    expect(
      errorsOf(
        raw([
          {
            do: { canAttackActive: { target: { from: 'self', owner: 'you' }, duration: 'battle' } },
          },
        ]),
      ),
    ).not.toEqual([]);
    expect(
      errorsOf(
        raw([
          {
            do: {
              canAttackActive: { target: { from: 'hand', owner: 'you' }, duration: 'thisTurn' },
            },
          },
        ]),
      ),
    ).not.toEqual([]);
  });

  it('an active Character cannot be attacked until the grant, then it can', () => {
    const g = mk();
    expect(can(g, BLUE, PURPLE)).toBe(false);
    run(g);
    expect(can(g, BLUE, PURPLE)).toBe(true);
  });

  it('"also": a rested Character and the Leader can still be attacked', () => {
    const g = mk();
    run(g);
    expect(can(g, BLUE, V.c2)).toBe(true);
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', BLUE),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(true);
  });

  it('only the chosen card gets it', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, BLUE, [
      main([grant({ from: 'characters', owner: 'you', filter: { name: 'Blugori' } })] as never),
    ]);
    run(g);
    const hit = (att: string) =>
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', att),
        target: g.find('p2', 'characters', PURPLE),
        player: 'p1',
      });
    expect([hit(BLUE), hit(V.c1)]).toEqual([false, true]);
  });

  it('does not let a Character attack on the turn it is played (RL-17)', () => {
    const g = mk();
    g.state = withAbilities(g.state, V.c1, [main([grant()] as never)]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'a' });
    expect(can(g, V.c1, PURPLE)).toBe(false);
  });

  it('a real attack on an active Character goes through the battle', () => {
    const g = mk();
    run(g);
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', BLUE),
      target: g.find('p2', 'characters', PURPLE),
    });
    expect(
      g.eventsOfType('AttackDeclared').length + g.eventsOfType('Attack').length,
    ).toBeGreaterThan(0);
    expect(dec(g)?.kind).toBe('block');
  });

  it('the grant ends with the turn', () => {
    const g = mk();
    run(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' }); // p2 ends theirs: p1's next turn
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', BLUE),
        target: g.find('p2', 'characters', PURPLE),
        player: 'p1',
      }),
    ).toBe(false);
  });
});

describe('G33 swap base power', () => {
  const swap = (a: object, b: object, duration: 'thisTurn' | 'battle' = 'thisTurn') =>
    ({
      do: {
        swapBasePower: {
          a: { ...a, pick: { exactly: 1 } },
          b: { ...b, pick: { exactly: 1 } },
          duration,
        },
      },
    }) as const;
  const power = (g: ReturnType<typeof game>, p: 'p1' | 'p2', card: string) =>
    g.power(g.find(p, 'characters', card));

  it('validates: two selectors, each exactly 1, on a Leader or Character', () => {
    expectValid([
      main([
        swap(
          { from: 'characters', owner: 'you' },
          { from: 'characters', owner: 'you', filter: { not: { isSelf: true } } },
        ),
      ] as never),
    ]);
    expectValid([
      main([
        swap({ from: 'leader', owner: 'you' }, { from: 'characters', owner: 'you' }, 'battle'),
      ] as never),
    ]);
    const a = { from: 'characters', owner: 'you', pick: { upTo: 1 } };
    expect(
      errorsOf(raw([{ do: { swapBasePower: { a, b: a, duration: 'thisTurn' } } }])),
    ).not.toEqual([]);
    const ok = { from: 'characters', owner: 'you', pick: { exactly: 1 } };
    expect(
      errorsOf(
        raw([{ do: { swapBasePower: { a: ok, b: ok, duration: 'untilStartOfYourNextTurn' } } }]),
      ),
    ).not.toEqual([]);
    expect(
      errorsOf(
        raw([
          { do: { swapBasePower: { a: { ...ok, from: 'hand' }, b: ok, duration: 'thisTurn' } } },
        ]),
      ),
    ).not.toEqual([]);
  });

  it('two Characters trade base power for the turn', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c7] }, { leader: PLAIN_BLUE });
    expect([power(g, 'p1', BLUE), power(g, 'p1', V.c7)]).toEqual([3000, 9000]);
    g.state = withAbilities(g.state, BLUE, [
      main([
        swap({ from: 'characters', owner: 'you' }, { from: 'characters', owner: 'you' }),
      ] as never),
    ]);
    run(g);
    pick(g, [g.find('p1', 'characters', BLUE)]); // a; b is the only other card
    expect([power(g, 'p1', BLUE), power(g, 'p1', V.c7)]).toEqual([9000, 3000]);
  });

  it('b is never the card a chose: with one candidate nothing is swapped', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        swap({ from: 'characters', owner: 'you' }, { from: 'characters', owner: 'you' }),
      ] as never),
    ]);
    run(g);
    expect(power(g, 'p1', BLUE)).toBe(3000);
    expect(dec(g)?.kind).toBe('main');
  });

  it('a Leader and a Character, and the opponent’s Characters (filters on base power)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE, V.c7, V.c5] },
    );
    const leaderPower = g.power(g.leader('p1'));
    g.state = withAbilities(g.state, BLUE, [
      main([
        swap({ from: 'leader', owner: 'you' }, { from: 'characters', owner: 'you' }),
        swap(
          { from: 'characters', owner: 'opponent', filter: { basePower: { lte: 7000 } } },
          { from: 'characters', owner: 'opponent', filter: { basePower: { lte: 7000 } } },
        ),
      ] as never),
    ]);
    run(g);
    expect(g.power(g.leader('p1'))).toBe(3000);
    expect(power(g, 'p1', BLUE)).toBe(leaderPower);
    // Two opposing Characters of 3000 and 7000 (the 9000 one is not eligible): pick one, the other follows.
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect([power(g, 'p2', PURPLE), power(g, 'p2', V.c5), power(g, 'p2', V.c7)]).toEqual([
      7000, 3000, 9000,
    ]);
  });

  it('during this battle: it lasts the battle, then base power is back', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c1] },
      { activePlayer: 'p2', turn: 4 },
    );
    const lp = g.power(g.leader('p1'))!;
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'swap',
        kind: 'auto',
        when: ['onOpponentAttack'],
        effect: [
          swap({ from: 'leader', owner: 'you' }, { from: 'characters', owner: 'you' }, 'battle'),
        ],
      } as Ability,
    ]);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c1),
      target: g.leader('p1'),
    });
    expectDecision(g, 'block', 'p1');
    expect(g.power(g.leader('p1'))).toBe(3000);
    expect(power(g, 'p1', BLUE)).toBe(lp);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(lp);
    expect(power(g, 'p1', BLUE)).toBe(3000);
  });

  it('"during this battle" with no battle does nothing and asks nothing', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c7] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        swap({ from: 'characters', owner: 'you' }, { from: 'characters', owner: 'you' }, 'battle'),
      ] as never),
    ]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(power(g, 'p1', BLUE)).toBe(3000);
  });
});

/**
 * M6b wave 4, G34 (filter `donGiven`, the per-target amount `donGivenToTarget`, `refStat` of
 * `donGiven`) and BACKLOG OP-15 (a): `[DON!! xN] [On K.O.]` reads the K.O.'d card's last-known given
 * DON!! (OP14-051 Hatchan). Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, game, hand, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const raw = (effect: unknown[]) => ({ id: 'a', kind: 'activate', when: 'activateMain', effect });
const opp = (filter?: object, pick?: object) => ({
  from: 'characters',
  owner: 'opponent',
  ...(filter ? { filter } : {}),
  ...(pick ? { pick } : {}),
});

describe('G34 filter donGiven', () => {
  const mk = () =>
    game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      {
        leader: PLAIN_BLUE,
        characters: [{ card: PURPLE, don: 2 }, { card: V.c1, don: 1 }, V.c2],
      },
    );
  const restWith = (filter: object) => ({ do: { rest: opp(filter, { upTo: 1 }) } }) as const;
  const candidates = (g: ReturnType<typeof mk>) =>
    g
      .legal()
      .flatMap((a) => (a.type === 'pick' ? [a.choice] : []))
      .sort();

  it('validates a comparison', () => {
    expectValid([main([restWith({ donGiven: { gte: 1 } })] as never)]);
    expect(errorsOf(raw([restWith({ donGiven: 1 })]))).not.toEqual([]);
  });

  it('"with a DON!! card given" (gte 1) leaves out the Character with none', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [main([restWith({ donGiven: { gte: 1 } })] as never)]);
    run(g);
    expect(candidates(g)).toEqual(
      [g.find('p2', 'characters', PURPLE), g.find('p2', 'characters', V.c1)].sort(),
    );
    expect(candidates(g)).not.toContain(g.find('p2', 'characters', V.c2));
  });

  it('"2 or more DON!! cards given" (gte 2) leaves the one with 1 out', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [main([restWith({ donGiven: { gte: 2 } })] as never)]);
    run(g);
    // One candidate and "up to 1": still asked, the only choice is that Character.
    expect(candidates(g)).toEqual([g.find('p2', 'characters', PURPLE)]);
  });

  it('eq and lte read the same count', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [main([restWith({ donGiven: { eq: 0 } })] as never)]);
    run(g);
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c2)]);
  });
});

describe('G34 an amount read per target', () => {
  const mk = () =>
    game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      {
        leader: PLAIN_BLUE,
        characters: [{ card: PURPLE, don: 2 }, { card: V.c1, don: 1 }, V.c2],
      },
    );
  const perDon = (n: number) => ({ mul: [{ donGivenToTarget: true }, n] });

  it('-1000 power for every DON!! card given to that Character', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([
        { do: { power: { target: opp(), amount: perDon(-1000), duration: 'thisTurn' } } },
      ] as never),
    ]);
    run(g);
    // It is p1's turn: given DON!! add no power to the opponent's cards.
    const p = (c: string) => g.power(g.find('p2', 'characters', c));
    expect([p(PURPLE), p(V.c1), p(V.c2)]).toEqual([1000, 2000, 4000]);
  });

  it('the same for a cost change', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([{ do: { cost: { target: opp(), amount: perDon(1), duration: 'thisTurn' } } }] as never),
    ]);
    run(g);
    const c = (n: string) => g.card(g.find('p2', 'characters', n)).cost;
    expect([c(PURPLE), c(V.c1), c(V.c2)]).toEqual([3, 2, 2]);
  });

  it('is only read in a power or cost amount', () => {
    expectValid([
      main([
        { do: { power: { target: opp(), amount: perDon(-1000), duration: 'thisTurn' } } },
      ] as never),
    ]);
    expect(errorsOf(raw([{ do: { draw: { donGivenToTarget: true } } }]))).not.toEqual([]);
    expect(
      errorsOf(raw([{ if: { cmp: [{ donGivenToTarget: true }, '>=', 1] }, then: [] }])),
    ).not.toEqual([]);
    expect(
      errorsOf(
        raw([
          {
            do: {
              power: { target: opp(), amount: { donGivenToTarget: false }, duration: 'thisTurn' },
            },
          },
        ]),
      ),
    ).not.toEqual([]);
  });
});

describe('G34 refStat donGiven (OP15-031 Purinpurin)', () => {
  const purin = (mkTarget: { cost: string; don: number }) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      {
        leader: PLAIN_BLUE,
        characters: [{ card: mkTarget.cost, rested: true, don: mkTarget.don }],
      },
    );
    const eff = [
      { do: { select: { ...opp({ state: 'rested' }, { upTo: 1 }), bind: 'x' } } },
      {
        if: { cmp: [{ refStat: 'x', stat: 'cost' }, '=', { refStat: 'x', stat: 'donGiven' }] },
        then: [{ do: { ko: { from: 'characters', owner: 'opponent', filter: { ref: 'x' } } } }],
      },
    ];
    g.state = withAbilities(g.state, BLUE, [main(eff as never)]);
    run(g);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', mkTarget.cost) });
    if (dec(g)?.kind === 'choose') g.act({ type: 'done' });
    return g;
  };
  it('K.O.s a Character whose cost equals the DON!! given to it', () => {
    expect(purin({ cost: V.c3, don: 3 }).zone('p2', 'characters')).toHaveLength(0); // cost 3
  });
  it('does nothing when they differ', () => {
    expect(purin({ cost: V.c3, don: 2 }).zone('p2', 'characters')).toHaveLength(1);
    expect(purin({ cost: V.c3, don: 0 }).zone('p2', 'characters')).toHaveLength(1);
  });
});

describe('BACKLOG OP-15 (a): [DON!! xN] [On K.O.] (OP14-051 Hatchan)', () => {
  const hatchan = {
    id: 'ko',
    kind: 'auto',
    when: ['onKO'],
    conditions: [{ donGiven: 2 }],
    effect: [{ do: { draw: 1 } }],
  } as Ability;
  const mk = (don: number) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: V.c1, don }] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, V.c1, [hatchan]);
    return g;
  };
  const ko = (g: ReturnType<typeof mk>) =>
    (g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', V.c1),
      by: 'p2',
    }).state);

  it('is a valid script', () => expectValid([hatchan]));

  it('draws when it had 2 DON!! given as it was K.O.’d', () => {
    const g = mk(2);
    const before = hand(g, 'p1').length;
    ko(g);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('does not draw with 1 DON!! given', () => {
    const g = mk(1);
    const before = hand(g, 'p1').length;
    ko(g);
    expect(hand(g, 'p1')).toHaveLength(before);
  });

  it('a battle K.O. reads it too', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: V.c1, don: 2, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [hatchan]);
    const before = hand(g, 'p1').length;
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', V.c1),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });
});

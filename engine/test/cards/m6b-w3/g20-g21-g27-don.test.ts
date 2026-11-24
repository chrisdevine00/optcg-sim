/**
 * M6b wave 3 (audit m6b-runtime-audit §2): DON!! effects on the opponent.
 *  - G20 `giveDon` of the opponent's DON!! to the opponent's cards (effect and cost forms).
 *  - G21 the player restriction `cannotSetDonActive` by Character effects.
 *  - G27 `returnDon` for the opponent.
 * Planted on vanilla cards; each test fails with its gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  expectDecision,
  game,
  hand,
  option,
  setMost,
  payDon,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, offered, run } from '../m6b-w1/probe.ts';

const oppTo = {
  from: ['leader', 'characters'],
  owner: 'opponent',
  pick: { upTo: 1 },
} as const;
const give = (state: 'rested' | 'active' | 'any', n = 1) =>
  main([{ do: { giveDon: { n, state, from: 'opponent', to: oppTo } } }] as never);

describe('G20 give the opponent’s DON!! to the opponent’s cards', () => {
  it('moves a rested DON!! of the opponent to their Character; none of yours is spent', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 2, rested: 1 } },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 1, rested: 2 } },
    );
    g.state = withAbilities(g.state, BLUE, [give('rested')]);
    run(g);
    const target = g.find('p2', 'characters', PURPLE);
    pick(g, [target]);
    expect(g.card(target).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, given: 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1, given: 0 });
  });

  it('can only be given to the opponent’s own cards and is asked as a target of the giver', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 0, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 0, rested: 2 } },
    );
    g.state = withAbilities(g.state, BLUE, [give('rested')]);
    run(g);
    expectDecision(g, 'choose', 'p1');
    const offeredTargets = g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));
    for (const id of [g.leader('p1'), g.find('p1', 'characters', V.c1)])
      expect(offeredTargets).not.toContain(id);
    expect(offeredTargets).toContain(g.leader('p2'));
    expect(offeredTargets).toContain(g.find('p2', 'characters', PURPLE));
  });

  it('a state of "any": the giver picks how many are active when both kinds are there', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 2, rested: 2 } },
    );
    g.state = withAbilities(g.state, BLUE, [give('any', 3)]);
    run(g);
    option(g, '3'); // how many
    expectDecision(g, 'choose', 'p1'); // which: the active ones or the rested ones
    const kinds = () => g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));
    expect(kinds()).toContainEqual({ from: 'costActive' });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    g.act({ type: 'pick', choice: { from: 'costActive' } });
    expect(kinds()).not.toContainEqual({ from: 'costActive' }); // only 2 are active
    expect(kinds()).toContainEqual({ from: 'costRested' });
    g.act({ type: 'pick', choice: { from: 'costRested' } });
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(3);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 1, given: 3 });
  });

  it('"any" with all of them going, or one kind only, asks no kind', () => {
    const all = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 1, rested: 1 } },
    );
    all.state = withAbilities(all.state, BLUE, [give('any', 2)]);
    run(all);
    option(all, '2');
    pick(all, [all.find('p2', 'characters', PURPLE)]); // straight to the target
    expect(don(all, 'p2')).toMatchObject({ active: 0, rested: 0, given: 2 });
    const one = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 3, rested: 0 } },
    );
    one.state = withAbilities(one.state, BLUE, [give('any', 1)]);
    run(one);
    pick(one, [one.find('p2', 'characters', PURPLE)]);
    expect(don(one, 'p2')).toMatchObject({ active: 2, rested: 0, given: 1 });
  });

  it('with no DON!! of that state to give, nothing happens', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 2, rested: 0 } },
    );
    g.state = withAbilities(g.state, BLUE, [give('rested')]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p2')).toMatchObject({ active: 2, given: 0 });
  });

  it('the cost form: payable only with a rested DON!! and a Character of the opponent', () => {
    const cost = [
      {
        giveDon: {
          n: 1,
          state: 'rested',
          from: 'opponent',
          to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
        },
      },
    ] as const;
    const make = (rested: number, chars: string[]) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_BLUE, characters: chars, costArea: { active: 1, rested } },
      );
      g.state = withAbilities(g.state, BLUE, [main([{ do: { draw: 1 } }], [...cost])]);
      return g;
    };
    expect(offered(make(0, [PURPLE]))).toBe(false);
    expect(offered(make(2, []))).toBe(false);
    const g = make(2, [PURPLE]);
    expect(offered(g)).toBe(true);
    const before = hand(g, 'p1').length;
    run(g);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, given: 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 0 });
    expect(hand(g, 'p1').length).toBe(before + 1);
  });

  it('a given DON!! returns to its owner’s cost area, rested, at their Refresh Phase', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 0, rested: 2 } },
    );
    g.state = withAbilities(g.state, BLUE, [give('rested')]);
    run(g);
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    g.act({ type: 'endTurn' });
    // p2's turn: Refresh returned the given DON!!, then untapped the cost area.
    const p2 = don(g, 'p2');
    expect(p2.given).toBe(0);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(0);
    expect(p2.active + p2.rested).toBeGreaterThanOrEqual(2);
  });

  it('the validator refuses the variants that are not built', () => {
    const base = { n: 1, state: 'rested', from: 'opponent', to: oppTo };
    const act = (g: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { giveDon: g } }],
    });
    expectValid([give('rested'), { ...give('any', 2), id: 'b' }, { ...give('active'), id: 'c' }]);
    expect(errorsOf(act({ ...base, to: { ...oppTo, owner: 'you' } }))).not.toEqual([]);
    expect(errorsOf(act({ ...base, each: true }))).not.toEqual([]);
    expect(errorsOf(act({ ...base, to: { from: 'characters', owner: 'opponent' } }))).not.toEqual(
      [],
    );
    expect(errorsOf(act({ ...base, from: 'you' }))).not.toEqual([]);
    expect(errorsOf(act({ ...base, state: 'any', from: undefined, to: oppTo }))).not.toEqual([]);
    const cost = (g: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ giveDon: g }],
      effect: [{ do: { draw: 1 } }],
    });
    const cto = { from: 'characters', owner: 'opponent', pick: { exactly: 1 } };
    expect(errorsOf(cost({ n: 1, state: 'rested', from: 'opponent', to: cto }))).toEqual([]);
    expect(errorsOf(cost({ n: 1, state: 'active', from: 'opponent', to: cto }))).not.toEqual([]);
    expect(
      errorsOf(cost({ n: 1, state: 'rested', from: 'opponent', to: { ...cto, owner: 'you' } })),
    ).not.toEqual([]);
    expect(
      errorsOf(cost({ n: 1, state: 'rested', to: { ...cto, owner: 'opponent' } })),
    ).not.toEqual([]);
  });
});

describe('G21 cannotSetDonActive by Character effects', () => {
  const setOne = { do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } };
  const restrict = {
    do: {
      restrict: {
        target: 'you',
        what: { cannotSetDonActive: { by: 'characterEffects' } },
        duration: 'thisTurn',
      },
    },
  };

  it('the same ability may set one first; a Character effect then sets none this turn', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 0, rested: 4 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([setOne, restrict, setOne] as never)]);
    g.state = withAbilities(g.state, V.c1, [
      { id: 'b', kind: 'activate', when: 'activateMain', effect: [setOne] } as Ability,
    ]);
    run(g);
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 }); // only the first set
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'b' });
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 }); // another Character: none
  });

  it('Leader and Event effects still set DON!! active', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 0, rested: 4 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([restrict] as never)]);
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      { id: 'a', kind: 'activate', when: 'activateMain', effect: [setOne] } as Ability,
    ]);
    run(g);
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'a' });
    setMost(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 });
  });

  it('ends with the turn; the next turn a Character sets DON!! again', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 0, rested: 4 } },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [main([restrict] as never)]);
    run(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    // Back on p1's turn: the restriction expired, so the Character's set works.
    g.state = withAbilities(g.state, BLUE, [main([setOne] as never, [{ restDon: 2 }])]);
    const active = don(g, 'p1').active;
    run(g);
    setMost(g);
    expect(don(g, 'p1').active).toBe(active - 2 + 1);
  });

  it('the validator accepts it as a timed player restriction only', () => {
    expectValid([main([restrict] as never)]);
    const what = { cannotSetDonActive: { by: 'characterEffects' } };
    // Not on cards, not permanent, not any other scope.
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              restrict: { target: { from: 'leader', owner: 'you' }, what, duration: 'thisTurn' },
            },
          },
        ],
      }),
    ).not.toEqual([]);
    expect(
      errorsOf({ id: 'p', kind: 'permanent', apply: [{ restrict: { target: 'you', what } }] }),
    ).not.toEqual([]);
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              restrict: {
                target: 'you',
                what: { cannotSetDonActive: { by: 'anyEffects' } },
                duration: 'thisTurn',
              },
            },
          },
        ],
      }),
    ).not.toEqual([]);
  });
});

describe('G27 returnDon for the opponent', () => {
  const ret = (n: number, from?: 'active') =>
    main([{ do: { returnDon: { n, player: 'opponent', ...(from ? { from } : {}) } } }]);

  it('the opponent chooses which of their DON!! go back; yours stay', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], costArea: { active: 2, rested: 1 } },
      { leader: PLAIN_BLUE, costArea: { active: 1, rested: 1 } },
    );
    g.state = withAbilities(g.state, BLUE, [ret(1)]);
    const deck = don(g, 'p2').deck;
    run(g);
    expectDecision(g, 'choose', 'p2'); // the DON!! are theirs: they choose
    payDon(g);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 1, deck: deck + 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
  });

  it('returns as many as they have, and asks nothing when only one kind can go', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, costArea: { active: 0, rested: 2 } },
    );
    g.state = withAbilities(g.state, BLUE, [ret(4)]);
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 0 });
    const none = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, costArea: { active: 0, rested: 0 } },
    );
    none.state = withAbilities(none.state, BLUE, [ret(1)]);
    run(none);
    expect(dec(none)?.kind).toBe('main');
    expect(none.events.some((e) => e.type === 'Anomaly')).toBe(false);
  });

  it('"from active" returns only active cost-area DON!!', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, costArea: { active: 1, rested: 3 } },
    );
    g.state = withAbilities(g.state, BLUE, [ret(2, 'active')]);
    run(g);
    expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 3 });
  });

  it('fires "a DON!! card on your field is returned" for the opponent’s watchers only', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 2, rested: 0 } },
    );
    const watcher = (id: string): Ability =>
      ({
        id,
        kind: 'auto',
        when: [{ event: 'donReturned', owner: 'you' }],
        effect: [{ do: { draw: 1 } }],
      }) as Ability;
    g.state = withAbilities(g.state, PURPLE, [watcher('w')]);
    g.state = withAbilities(g.state, V.c1, [watcher('w')]);
    g.state = withAbilities(g.state, BLUE, [ret(1)]);
    const mine = hand(g, 'p1').length;
    const theirs = hand(g, 'p2').length;
    run(g);
    expect(hand(g, 'p2').length).toBe(theirs + 1);
    expect(hand(g, 'p1').length).toBe(mine);
  });

  it('the validator: only the opponent form takes "from", and it needs a count', () => {
    const act = (r: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [{ do: { returnDon: r } }],
    });
    expect(errorsOf(act({ n: 1, player: 'opponent', from: 'active' }))).toEqual([]);
    expect(errorsOf(act({ n: 1, from: 'active' }))).not.toEqual([]);
    expect(errorsOf(act({ n: 1, player: 'you' }))).not.toEqual([]);
    expect(errorsOf(act({ n: 'toMatchOpponent', player: 'opponent' }))).not.toEqual([]);
  });
});

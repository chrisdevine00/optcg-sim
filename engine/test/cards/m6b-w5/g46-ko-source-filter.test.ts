/**
 * M6b wave 5, G46: "cannot be K.O.'d" limited to a source: "in battle by <Slash> attribute cards"
 * (OP03-008, OP12-036), "in battle by Leaders" (OP09-025), "by effects of Characters without the
 * <Special> attribute" (OP11-005), "by effects of your opponent's Characters with 5000 base power
 * or less" (OP14-003). Planted on vanilla cards (Slash: V.c1, V.c3; Strike: V.c2; Special: V.c6);
 * each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, dec, endCounter, game, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main } from '../m6b-w1/probe.ts';

const self = { from: 'self', owner: 'you' } as const;
const guard = (cause: string, by?: object): Ability =>
  ({
    id: 'g',
    kind: 'permanent',
    apply: [
      { restrict: { target: self, what: { cannotBeKOd: { cause, ...(by ? { by } : {}) } } } },
    ],
  }) as Ability;
const koEffect = (owner: 'opponent' | 'you' = 'opponent'): Ability =>
  main([
    {
      do: {
        ko: { from: 'characters', owner, filter: { type: 'Buggy Pirates' }, pick: { exactly: 1 } },
      },
    },
  ] as never);

describe('G46 the validator', () => {
  it('accepts a source filter and refuses what a source filter cannot read', () => {
    expectValid([guard('battle', { attribute: 'Slash' })]);
    expectValid([
      guard('effect', { all: [{ category: ['Character'] }, { not: { attribute: 'Special' } }] }),
    ]);
    expectValid([
      guard('opponentEffect', { all: [{ category: ['Character'] }, { basePower: { lte: 5000 } }] }),
    ]);
    for (const by of [
      { ref: 'x' },
      { isSelf: true },
      { playedThisTurn: true },
      { donGiven: { gte: 1 } },
      { basePower: { lte: { count: self } } },
      { all: [{ category: ['Leader'] }, { ref: 'x' }] },
    ])
      expect(errorsOf(guard('battle', by))).not.toEqual([]);
    expect(errorsOf(guard('battle', { attribute: 'Sneaky' }))).not.toEqual([]);
  });
});

describe('G46 in battle by a source', () => {
  /** p2's turn: p2's `attacker` (or Leader) attacks p1's rested BLUE, which carries `g`. */
  const battle = (g1: Ability, attacker: string | 'leader') => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: BLUE, rested: true }] },
      { leader: PLAIN_BLUE, characters: attacker === 'leader' ? [] : [attacker] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, BLUE, [g1]);
    g.act({
      type: 'attack',
      attacker: attacker === 'leader' ? g.leader('p2') : g.find('p2', 'characters', attacker),
      target: g.find('p1', 'characters', BLUE),
    });
    g.act({ type: 'block', blocker: null });
    endCounter(g);
    return g;
  };
  const koed = (g: ReturnType<typeof battle>) => g.zone('p1', 'characters').length === 0;
  const prevented = (g: ReturnType<typeof battle>) => g.eventsOfType('KOPrevented').length > 0;

  it('by <Slash> attribute cards: a Slash attacker cannot, a Strike one can', () => {
    const slash = guard('battle', { attribute: 'Slash' });
    const a = battle(slash, V.c3); // Slash, 5000 power against 3000
    expect(koed(a)).toBe(false);
    expect(prevented(a)).toBe(true);
    const b = battle(slash, V.c2); // Strike
    expect(koed(b)).toBe(true);
    expect(prevented(b)).toBe(false);
  });

  it('by Leaders: a Leader attacker cannot K.O. it, a Character can', () => {
    const leaders = guard('battle', { category: ['Leader'] });
    const a = battle(leaders, 'leader');
    expect(koed(a)).toBe(false);
    expect(prevented(a)).toBe(true);
    const b = battle(leaders, V.c2);
    expect(koed(b)).toBe(true);
  });

  it('an unfiltered battle shield still stops every attacker (no regression)', () => {
    const all = battle(guard('battle'), V.c2);
    expect(koed(all)).toBe(false);
  });

  it('a battle protection does not stop an effect K.O.', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c2] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, BLUE, [guard('battle', { attribute: 'Strike' })]);
    g.state = withAbilities(g.state, V.c2, [koEffect()]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', V.c2), ability: 'a' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('a K.O. with no known source is not stopped by a protection that names one (timed form)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, V.c1, [
      main([
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'you', filter: { type: 'Buggy Pirates' } },
              what: { cannotBeKOd: { cause: 'effect', by: { category: ['Character'] } } },
              duration: 'thisTurn',
            },
          },
        },
      ] as never),
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c1), ability: 'a' });
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', BLUE),
      by: 'p2',
    }).state;
    // The test op has no source card: a protection that names a source does not stop it.
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c1]);
  });
});

describe('G46 by effects of a source', () => {
  const notSpecialCharacter = {
    all: [{ category: ['Character'] }, { not: { attribute: 'Special' } }],
  };
  /** p2's turn: p2's `src` card (a Character, or its Leader) K.O.s p1's BLUE, which carries `g`. */
  const effect = (g1: Ability, src: string | 'leader') => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: src === 'leader' ? [] : [src] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, BLUE, [g1]);
    if (src === 'leader') {
      g.state = withAbilities(g.state, PLAIN_BLUE, [koEffect()]);
      g.act({ type: 'activate', card: g.leader('p2'), ability: 'a' });
    } else {
      g.state = withAbilities(g.state, src, [koEffect()]);
      g.act({ type: 'activate', card: g.find('p2', 'characters', src), ability: 'a' });
    }
    return g;
  };
  const survives = (g: ReturnType<typeof effect>) => g.zone('p1', 'characters').length === 1;

  it('"by effects of Characters without the <Special> attribute" (OP11-005)', () => {
    const smoker = guard('effect', notSpecialCharacter);
    expect(survives(effect(smoker, V.c1))).toBe(true); // Slash Character: stopped
    expect(survives(effect(smoker, V.c6))).toBe(false); // Special Character: K.O.'d
    expect(survives(effect(smoker, 'leader'))).toBe(false); // a Leader is not a Character
  });

  it('"by effects of your opponent’s Characters with 5000 base power or less" (OP14-003)', () => {
    const bege = guard('opponentEffect', {
      all: [{ category: ['Character'] }, { basePower: { lte: 5000 } }],
    });
    expect(survives(effect(bege, V.c3))).toBe(true); // 5000: stopped
    expect(survives(effect(bege, V.c4))).toBe(false); // 6000: K.O.'d
    expect(survives(effect(bege, 'leader'))).toBe(false);
  });

  it('"opponentEffect" with a filter does not stop your own Character’s effect', () => {
    const bege = guard('opponentEffect', { category: ['Character'] });
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c3] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [bege]);
    g.state = withAbilities(g.state, V.c3, [koEffect('you')]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c3), ability: 'a' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
  });

  it('a K.O. cost is part of the effect: "by effects" stops it, by its source (RL-16)', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c3] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [guard('effect', { name: 'Vanillo' })]);
    // The source is V.c3 (a Slash Character): it is not named Vanillo, so the cost K.O. goes through.
    g.state = withAbilities(g.state, V.c3, [
      main(
        [{ do: { draw: 1 } }] as never,
        [
          {
            ko: {
              from: 'characters',
              owner: 'you',
              filter: { type: 'Buggy Pirates' },
              pick: { exactly: 1 },
            },
          },
        ] as never,
      ),
    ]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', V.c3), ability: 'a' });
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([V.c3]);
  });
});

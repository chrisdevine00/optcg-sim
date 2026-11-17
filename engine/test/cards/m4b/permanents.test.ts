/**
 * M4b wave 1: permanent effects as derive inputs (effect-dsl.md §4.9; CR 8-1-3-3, 4-9-2). Every
 * script here is planted on a vanilla card: none of the 143 meta cards is scripted by this wave.
 */
import { describe, expect, it } from 'vitest';
import { validateScript, type CardScript, type Continuous, type Condition } from '@optcg/cards';
import { applyOp, withAbilities, withAlsoNamed, type Ability } from '../../../src/testing.ts';
import { BLUE, game, pick, PLAIN_BLUE, PLAIN_PURPLE, PURPLE, V } from '../helpers.ts';
import { dec } from '../helpers.ts';

/** A permanent ability, checked against the script validator so the probe is a legal script. */
function perm(id: string, apply: Continuous[], conditions?: Condition[], zone?: 'hand'): Ability {
  const ab = { id, kind: 'permanent', apply } as Ability;
  if (conditions) ab.conditions = conditions;
  if (zone) (ab as { zone?: 'hand' }).zone = zone;
  const script = {
    cardId: 'OP02-060',
    textHash: 'x',
    verified: { source: 't', date: '2026-11-16' },
    abilities: [ab],
  } as unknown as CardScript;
  expect(validateScript(script)).toEqual([]);
  return ab;
}

const self = { from: 'self', owner: 'you' } as const;
const big = {
  exists: { from: 'characters', owner: 'any', filter: { cost: { gte: 12 } } },
} as const satisfies Condition;

describe('permanent cost and power layers', () => {
  it('a +12 cost effect makes the "Character with a cost of 12 or more" condition true (stage order)', () => {
    const mk = (withBig: boolean) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: withBig ? [BLUE, V.c1] : [BLUE] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, BLUE, [
        perm('p', [{ power: { target: self, amount: 3000 } }], [big]),
      ]);
      if (withBig)
        g.state = withAbilities(g.state, V.c1, [
          perm('c', [{ cost: { target: self, amount: 12 } }]),
        ]);
      return g;
    };
    const on = mk(true);
    expect(on.card(on.find('p1', 'characters', V.c1)).cost).toBe(13);
    expect(on.power(on.find('p1', 'characters', BLUE))).toBe(6000);
    const off = mk(false);
    expect(off.power(off.find('p1', 'characters', BLUE))).toBe(3000);
  });

  it('an opponent-turn condition and a given-DON!! condition gate a power effect', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: BLUE, don: 1 }] },
      { leader: PLAIN_BLUE },
    );
    g.state = withAbilities(g.state, BLUE, [
      perm(
        'o',
        [{ power: { target: self, amount: 2000 } }],
        [{ opponentsTurn: true }, { donGiven: 1 }],
      ),
      perm('y', [{ power: { target: self, amount: 500 } }], [{ yourTurn: true }]),
    ]);
    const id = g.find('p1', 'characters', BLUE);
    // p1's turn: the given DON!! adds 1000, the "your turn" effect 500, the opponent-turn one nothing.
    expect(g.power(id)).toBe(3000 + 1000 + 500);
  });

  it('power effects reach "your Leader and all your Characters", and a source that is negated adds nothing', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, PURPLE] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, PURPLE, [
      perm('all', [
        { power: { target: { from: ['leader', 'characters'], owner: 'you' }, amount: 1000 } },
      ]),
    ]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(4000);
    const negated = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'negate',
        target: g.find('p1', 'characters', PURPLE),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    });
    g.state = negated.state;
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a cost effect in hand changes the card in hand and what it costs to play (CR 2-7-2)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, hand: [V.c4], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    const hand = g.find('p1', 'hand', V.c4);
    expect(g.card(hand).cost).toBe(4);
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
    g.state = withAbilities(g.state, V.c4, [
      perm(
        'h',
        [{ cost: { target: self, amount: -3 } }],
        [{ cmp: [{ hand: 'you' }, '>=', 1] }],
        'hand',
      ),
    ]);
    expect(g.card(hand).cost).toBe(1);
    g.act({ type: 'playCard', card: hand });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V.c4);
  });
});

describe('permanent base power and tiers', () => {
  it('sets the base power of every Character that has 3000 base power, reading the printed value', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c4] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      perm('b', [
        {
          setBasePower: {
            target: { from: 'characters', owner: 'you', filter: { basePower: { eq: 3000 } } },
            value: 8000,
          },
        },
      ]),
    ]);
    expect(g.power(g.find('p1', 'characters', BLUE))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
  });

  it('tiers are cumulative thresholds on the trash (OP15-092 shape)', () => {
    const at = (n: number) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [V.c3], trash: Array.from({ length: n }, () => BLUE) },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, V.c3, [
        perm('t', [
          {
            tiers: [
              {
                when: { cmp: [{ trash: 'you' }, '>=', 10] },
                apply: [{ setBasePower: { target: self, value: 9000 } }],
              },
              {
                when: { cmp: [{ trash: 'you' }, '>=', 20] },
                apply: [{ cost: { target: self, amount: 10 } }],
              },
              {
                when: { cmp: [{ trash: 'you' }, '>=', 30] },
                apply: [{ power: { target: self, amount: 1000 } }],
              },
            ],
          },
        ]),
      ]);
      const id = g.find('p1', 'characters', V.c3);
      return { power: g.power(id), cost: g.card(id).cost };
    };
    expect(at(5)).toEqual({ power: 5000, cost: 3 });
    expect(at(10)).toEqual({ power: 9000, cost: 3 });
    expect(at(20)).toEqual({ power: 9000, cost: 13 });
    expect(at(30)).toEqual({ power: 10000, cost: 13 });
  });
});

describe('permanent keyword grants and restrictions', () => {
  it('grants [Blocker] to Characters with a cost of 12 or more, using the cost layer', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c1] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, V.c1, [perm('c', [{ cost: { target: self, amount: 11 } }])]);
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      perm('g', [
        {
          grant: {
            target: { from: 'characters', owner: 'you', filter: { cost: { gte: 12 } } },
            keyword: 'Blocker',
          },
        },
      ]),
    ]);
    expect(g.card(g.find('p1', 'characters', V.c1)).keywords).toContain('Blocker');
    expect(g.card(g.find('p1', 'characters', BLUE)).keywords).not.toContain('Blocker');
  });

  const koProbe = (by: 'opponent' | 'self'): Ability => ({
    id: 'k',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          ko: {
            from: 'characters',
            owner: by === 'opponent' ? 'opponent' : 'you',
            filter: { name: 'Gordon' },
            pick: { upTo: 1 },
          },
        },
      },
    ],
  });

  it('cannot be removed by an opponent effect: K.O. and bounce are stopped, the owner own effect works', () => {
    const base = () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [PURPLE] },
        { leader: PLAIN_BLUE, characters: [BLUE] },
      );
      g.state = withAbilities(g.state, PURPLE, [
        perm('r', [{ restrict: { target: self, what: 'cannotBeRemovedByOpponentEffects' } }]),
      ]);
      return g;
    };
    // The opponent's effect runs on the opponent's turn (p2 active).
    const g = base();
    const opp = game(
      { leader: PLAIN_PURPLE, characters: [PURPLE] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
      { activePlayer: 'p2', turn: 4 },
    );
    opp.state = withAbilities(opp.state, PURPLE, [
      perm('r', [{ restrict: { target: self, what: 'cannotBeRemovedByOpponentEffects' } }]),
    ]);
    opp.state = withAbilities(opp.state, BLUE, [
      { ...koProbe('opponent') },
      {
        id: 'b',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          {
            do: {
              move: {
                what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                to: { zone: 'hand' },
              },
            },
          },
        ],
      },
    ]);
    expect(dec(opp)?.player).toBe('p2');
    opp.act({ type: 'activate', card: opp.find('p2', 'characters', BLUE), ability: 'k' });
    pick(opp, [opp.find('p1', 'characters', PURPLE)]);
    expect(opp.zone('p1', 'characters').map((c) => c.card)).toEqual([PURPLE]);
    expect(opp.eventsOfType('KOPrevented')).toHaveLength(1);
    opp.act({ type: 'activate', card: opp.find('p2', 'characters', BLUE), ability: 'b' });
    pick(opp, [opp.find('p1', 'characters', PURPLE)]);
    expect(opp.zone('p1', 'characters').map((c) => c.card)).toEqual([PURPLE]);
    expect(opp.zone('p1', 'hand')).toHaveLength(0);

    // The owner's own effect K.O.s it as usual.
    g.state = withAbilities(g.state, PLAIN_PURPLE, [{ ...koProbe('self') }]);
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'k' });
    pick(g, [g.find('p1', 'characters', PURPLE)]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('a condition on the restriction (6 or fewer DON!! on the field) turns it off above that', () => {
    const koed = (don: number): number => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [PURPLE], costArea: { active: don, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [BLUE] },
        { activePlayer: 'p2', turn: 4 },
      );
      g.state = withAbilities(g.state, PURPLE, [
        perm(
          'r',
          [{ restrict: { target: self, what: 'cannotBeRemovedByOpponentEffects' } }],
          [{ cmp: [{ donOnField: 'you' }, '<=', 6] }],
        ),
      ]);
      g.state = withAbilities(g.state, BLUE, [koProbe('opponent')]);
      g.act({ type: 'activate', card: g.find('p2', 'characters', BLUE), ability: 'k' });
      pick(g, [g.find('p1', 'characters', PURPLE)]);
      return g.zone('p1', 'characters').length;
    };
    expect(koed(6)).toBe(1);
    expect(koed(7)).toBe(0);
  });
});

describe('rules: also named', () => {
  it('a card also named [X] is found by a name filter', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [PURPLE] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
    );
    g.state = withAlsoNamed(g.state, PURPLE, ['Trafalgar Law', 'Donquixote Rosinante']);
    g.state = withAbilities(g.state, PLAIN_PURPLE, [
      perm('n', [
        {
          power: {
            target: { from: 'characters', owner: 'you', filter: { name: 'Trafalgar Law' } },
            amount: 2000,
          },
        },
      ]),
    ]);
    expect(g.power(g.find('p1', 'characters', PURPLE))).toBe(5000);
    g.state = withAlsoNamed(g.state, PURPLE, []);
    expect(g.power(g.find('p1', 'characters', PURPLE))).toBe(3000);
  });
});

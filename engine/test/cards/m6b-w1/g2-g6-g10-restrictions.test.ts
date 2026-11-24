/**
 * M6b wave 1: card restrictions (audit m6b-runtime-audit §2).
 *  - G2 `cannotBeRested`: cannot attack, block, pay a rest cost or be rested by an effect
 *    (rules-digest 57); the "by your opponent's effects" form spares costs and your own effects.
 *  - G6 `cannotBeKOd` scoped by cause: effects / opponent's effects / battle (RL-14, RL-16).
 *  - G10 `cannotActivateBlocker` on the blocking card.
 * Planted on vanilla cards; each test fails with its gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, withKeywords, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  endCounter,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main, run } from './probe.ts';

const turn3 = { kind: 'thisTurn', turn: 3 } as const;
const turn4 = { kind: 'thisTurn', turn: 4 } as const;
const mod = (
  g: ReturnType<typeof game>,
  kind: 'cannotBeRested' | 'cannotBeKOd' | 'cannotBlock',
  target: string,
  scope?: 'effect' | 'opponentEffect' | 'battle',
  duration: typeof turn3 | typeof turn4 = turn3,
) => {
  g.state = applyOp(g.state, {
    op: 'modifier',
    mod: { kind, target, duration, controller: 'p2', ...(scope ? { scope } : {}) },
  }).state;
};
const attacks = (g: ReturnType<typeof game>, attacker: string) =>
  g.legal().some((a) => a.type === 'attack' && a.attacker === attacker);

/** An [Activate: Main] `b` on a Character that rests itself as its cost. */
const restSelfAbility: Ability = {
  id: 'b',
  kind: 'activate',
  when: 'activateMain',
  cost: [{ restSelf: true }],
  effect: [{ do: { draw: 1 } }],
};
const offersB = (g: ReturnType<typeof game>, id: string) =>
  g.legal().some((a) => a.type === 'activate' && a.ability === 'b' && a.card === id);

describe('G2 cannotBeRested', () => {
  it('cannot attack, cannot pay "rest this Character", and an effect does not rest it (rules-digest 57)', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1, V.c2] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withAbilities(g.state, V.c1, [restSelfAbility]);
    const c1 = g.find('p1', 'characters', V.c1);
    const c2 = g.find('p1', 'characters', V.c2);
    expect(attacks(g, c1)).toBe(true);
    expect(offersB(g, c1)).toBe(true);
    mod(g, 'cannotBeRested', c1);
    expect(attacks(g, c1)).toBe(false);
    expect(attacks(g, c2)).toBe(true);
    expect(offersB(g, c1)).toBe(false);
    // A rest effect, even your own, does not rest it either.
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'you',
              filter: { name: 'Blugori' },
              pick: { exactly: 1 },
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(g.card(c1).rested).toBe(false);
  });

  it('a Blocker that cannot be rested cannot block', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE, V.c3] },
    );
    g.state = withKeywords(withKeywords(g.state, PURPLE, ['Blocker']), V.c3, ['Blocker']);
    mod(g, 'cannotBeRested', g.find('p2', 'characters', PURPLE));
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c1), target: g.leader('p2') });
    const blocks = g.legal().filter((a) => a.type === 'block' && a.blocker !== null);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ blocker: g.find('p2', 'characters', V.c3) });
  });

  it('"by your opponent\'s effects" stops an opponent effect only: costs, attacks and your own effects pass', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c2] },
    );
    g.state = withAbilities(g.state, V.c1, [restSelfAbility]);
    const own = g.find('p1', 'characters', V.c1);
    const theirs = g.find('p2', 'characters', V.c2);
    mod(g, 'cannotBeRested', own, 'opponentEffect');
    mod(g, 'cannotBeRested', theirs, 'opponentEffect');
    // p1's own cost and own attack are fine.
    expect(offersB(g, own)).toBe(true);
    expect(attacks(g, own)).toBe(true);
    // p1's effect rests p1's own protected Character (not an opponent's effect) ...
    const restOne = (name: string, owner: 'you' | 'opponent') =>
      main([
        { do: { rest: { from: 'characters', owner, filter: { name }, pick: { exactly: 1 } } } },
      ]);
    g.state = withAbilities(g.state, BLUE, [restOne('Blugori', 'you')]);
    run(g);
    expect(g.card(own).rested).toBe(true);
    // ... but not the opponent's protected Character: p1's effect is its opponent's effect.
    const h = game(
      { leader: PLAIN_PURPLE, characters: [BLUE] },
      { leader: PLAIN_BLUE, characters: [V.c2] },
    );
    h.state = withAbilities(h.state, BLUE, [restOne('Dobon', 'opponent')]);
    mod(h, 'cannotBeRested', h.find('p2', 'characters', V.c2), 'opponentEffect');
    run(h);
    expect(h.card(h.find('p2', 'characters', V.c2)).rested).toBe(false);
  });

  it('timed and permanent forms: `restrict` creates the modifier, a permanent produces it while the source stays', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c1] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'you', filter: { name: 'Blugori' } },
              what: { cannotBeRested: { by: 'opponentEffect' } },
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    expect(g.eventsOfType('ModifierAdded').at(-1)).toMatchObject({
      kind: 'cannotBeRested',
      scope: 'opponentEffect',
    });
    const perm: Ability = {
      id: 'p',
      kind: 'permanent',
      apply: [{ restrict: { target: { from: 'self', owner: 'you' }, what: 'cannotBeRested' } }],
    };
    expectValid([perm]);
    const h = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
    const c1 = h.find('p1', 'characters', V.c1);
    expect(attacks(h, c1)).toBe(true);
    h.state = withAbilities(h.state, V.c1, [perm]);
    expect(attacks(h, c1)).toBe(false);
  });

  it('validation: only the opponent-effect scope exists', () => {
    const a = (what: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          do: {
            restrict: { target: { from: 'characters', owner: 'you' }, what, duration: 'thisTurn' },
          },
        },
      ],
    });
    expect(errorsOf(a('cannotBeRested'))).toEqual([]);
    expect(errorsOf(a({ cannotBeRested: { by: 'opponentEffect' } }))).toEqual([]);
    expect(errorsOf(a({ cannotBeRested: { by: 'effect' } })).length).toBeGreaterThan(0);
    expect(errorsOf(a({ cannotBeRested: {} })).length).toBeGreaterThan(0);
  });
});

describe('G6 cannotBeKOd scoped by cause', () => {
  const ko = (g: ReturnType<typeof game>, card: string, by: 'p1' | 'p2') => {
    const step = applyOp(g.state, { op: 'ko', card, by });
    g.state = step.state;
    g.events.push(...step.events);
  };
  const stays = (g: ReturnType<typeof game>, card: string) =>
    g.zone('p1', 'characters').some((c) => c.instance === card);

  it('"by effects" stops an effect K.O. of either player, not a battle K.O. (RL-14)', () => {
    for (const by of ['p1', 'p2'] as const) {
      const g = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
      const c1 = g.find('p1', 'characters', V.c1);
      mod(g, 'cannotBeKOd', c1, 'effect');
      ko(g, c1, by);
      expect(stays(g, c1)).toBe(true);
      expect(g.eventsOfType('KOPrevented')).toHaveLength(1);
    }
  });

  it('"by your opponent\'s effects" spares your own K.O. effects (OP04-079)', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [V.c1, V.c2] }, { leader: PLAIN_BLUE });
    const c1 = g.find('p1', 'characters', V.c1);
    const c2 = g.find('p1', 'characters', V.c2);
    mod(g, 'cannotBeKOd', c1, 'opponentEffect');
    mod(g, 'cannotBeKOd', c2, 'opponentEffect');
    ko(g, c1, 'p2');
    expect(stays(g, c1)).toBe(true);
    ko(g, c2, 'p1');
    expect(stays(g, c2)).toBe(false);
    expect(trash(g, 'p1')).toEqual([V.c2]);
  });

  it('"in battle" stops a battle K.O. but not an effect K.O.; "by effects" does not stop a battle K.O.', () => {
    const battle = (scope: 'effect' | 'battle') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [{ card: V.c1, rested: true }] },
        { leader: PLAIN_BLUE },
        { activePlayer: 'p2', turn: 4 },
      );
      const c1 = g.find('p1', 'characters', V.c1);
      mod(g, 'cannotBeKOd', c1, scope, turn4);
      g.act({ type: 'attack', attacker: g.leader('p2'), target: c1 });
      passBlock(g);
      endCounter(g);
      return { g, c1 };
    };
    const inBattle = battle('battle');
    expect(stays(inBattle.g, inBattle.c1)).toBe(true);
    const byEffects = battle('effect');
    expect(stays(byEffects.g, byEffects.c1)).toBe(false);
    // And an effect K.O. gets through "in battle".
    const g = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
    const c1 = g.find('p1', 'characters', V.c1);
    mod(g, 'cannotBeKOd', c1, 'battle');
    ko(g, c1, 'p2');
    expect(stays(g, c1)).toBe(false);
  });

  it('the unscoped form still stops every cause', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [V.c1] }, { leader: PLAIN_BLUE });
    const c1 = g.find('p1', 'characters', V.c1);
    mod(g, 'cannotBeKOd', c1);
    ko(g, c1, 'p1');
    ko(g, c1, 'p2');
    expect(stays(g, c1)).toBe(true);
  });

  it('timed `restrict` and permanent forms carry the scope', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [BLUE, V.c1] }, { leader: PLAIN_BLUE });
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'you', filter: { name: 'Blugori' } },
              what: { cannotBeKOd: { cause: 'opponentEffect' } },
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    const c1 = g.find('p1', 'characters', V.c1);
    ko(g, c1, 'p2');
    expect(stays(g, c1)).toBe(true);

    const perm: Ability = {
      id: 'p',
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeKOd: { cause: 'effect' } },
          },
        },
      ],
    };
    expectValid([perm]);
    const h = game({ leader: PLAIN_PURPLE, characters: [V.c2] }, { leader: PLAIN_BLUE });
    h.state = withAbilities(h.state, V.c2, [perm]);
    const c2 = h.find('p1', 'characters', V.c2);
    ko(h, c2, 'p2');
    expect(stays(h, c2)).toBe(true);
  });

  it('validation: the cause is one of effect, opponentEffect, battle', () => {
    const a = (what: unknown) => ({
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          do: {
            restrict: { target: { from: 'characters', owner: 'you' }, what, duration: 'thisTurn' },
          },
        },
      ],
    });
    expect(errorsOf(a({ cannotBeKOd: { cause: 'battle' } }))).toEqual([]);
    expect(errorsOf(a({ cannotBeKOd: { cause: 'rule' } })).length).toBeGreaterThan(0);
    expect(errorsOf(a({ cannotBeKOd: {} })).length).toBeGreaterThan(0);
  });
});

describe('G10 cannotActivateBlocker', () => {
  it('bars the chosen opponent Characters from blocking; their other Blockers still block', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE, V.c1] },
      { leader: PLAIN_BLUE, characters: [PURPLE, V.c3] },
    );
    g.state = withKeywords(withKeywords(g.state, PURPLE, ['Blocker']), V.c3, ['Blocker']);
    g.state = withAbilities(g.state, BLUE, [
      main([
        {
          do: {
            restrict: {
              target: { from: 'characters', owner: 'opponent', filter: { name: 'Gordon' } },
              what: 'cannotActivateBlocker',
              duration: 'thisTurn',
            },
          },
        },
      ]),
    ]);
    run(g);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c1), target: g.leader('p2') });
    const blocks = g.legal().filter((a) => a.type === 'block' && a.blocker !== null);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ blocker: g.find('p2', 'characters', V.c3) });
    // The card keeps its [Blocker] keyword: it is barred, not stripped of it.
    expect(g.card(g.find('p2', 'characters', PURPLE)).keywords).toContain('Blocker');
  });

  it('a permanent bars every matching Character while its source stays', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1, V.c2] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    g.state = withKeywords(g.state, PURPLE, ['Blocker']);
    const perm: Ability = {
      id: 'p',
      kind: 'permanent',
      apply: [
        {
          restrict: {
            target: { from: 'characters', owner: 'opponent', filter: { cost: { lte: 1 } } },
            what: 'cannotActivateBlocker',
          },
        },
      ],
    };
    expectValid([perm]);
    g.state = withAbilities(g.state, V.c2, [perm]);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c1), target: g.leader('p2') });
    expect(g.legal().filter((a) => a.type === 'block' && a.blocker !== null)).toHaveLength(0);
  });
});

/**
 * M6b wave 2, G11 and G14: the scope of a replacement.
 *  - G11 `ko` with a `cause`: by an opponent's effect, by any effect (a cost included), in battle.
 *  - G14 `leaveField` with `cause: 'any'`: every way off the field, a battle K.O. and your own
 *    effects included; one replacement applies once to one event.
 * Planted on vanilla cards. A mandatory replacement with an empty payload is the "prevent" form
 * (OP10-118, M6b-Q36).
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  endCounter,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid, main } from '../m6b-w1/probe.ts';

type Replaces = Extract<Ability, { kind: 'replacement' }>['replaces'];
const self = { from: 'characters', owner: 'you', filter: { isSelf: true } } as const;
const rep = (replaces: Replaces, extra: Partial<Ability> = {}, id = 'r'): Ability =>
  ({
    id,
    kind: 'replacement',
    replaces,
    optional: true,
    instead: [{ returnDon: 1 }],
    ...extra,
  }) as Ability;

/** p2 owns `V.c1` (the replacer, rested so it can be attacked); p1 has the 9000 attacker. */
function mk(abilities: Ability[]) {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c7, BLUE] },
    {
      leader: PLAIN_BLUE,
      characters: [{ card: V.c1, rested: true }],
      costArea: { active: 1, rested: 0 },
    },
  );
  g.state = withAbilities(g.state, V.c1, abilities);
  return g;
}
const target = (g: ReturnType<typeof mk>) => g.find('p2', 'characters', V.c1);
const asked = (g: ReturnType<typeof mk>) =>
  dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';
const byEffect = (g: ReturnType<typeof mk>, by: 'p1' | 'p2') =>
  (g.state = applyOp(g.state, { op: 'ko', card: target(g), by }).state);
const byBattle = (g: ReturnType<typeof mk>) => {
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c7), target: target(g) });
  passBlock(g);
  endCounter(g);
};
const gone = (g: ReturnType<typeof mk>) => g.zone('p2', 'characters').length === 0;

describe('G11 `ko` replacement with a cause', () => {
  it('validates the three causes, and refuses an unknown one', () => {
    for (const cause of ['opponentEffect', 'effect', 'battle'] as const)
      expectValid([rep({ ko: self, cause })]);
    expect(errorsOf(rep({ ko: self, cause: 'rule' } as never))).not.toEqual([]);
  });

  it('opponentEffect: an opponent effect is replaced; your own effect and a battle K.O. are not', () => {
    const a = mk([rep({ ko: self, cause: 'opponentEffect' })]);
    byEffect(a, 'p1');
    expect(asked(a)).toBe(true);
    const own = mk([rep({ ko: self, cause: 'opponentEffect' })]);
    byEffect(own, 'p2');
    expect(asked(own)).toBe(false);
    expect(gone(own)).toBe(true);
    const battle = mk([rep({ ko: self, cause: 'opponentEffect' })]);
    byBattle(battle);
    expect(asked(battle)).toBe(false);
    expect(gone(battle)).toBe(true);
  });

  it('effect: an effect of either player is replaced, a battle K.O. is not', () => {
    for (const by of ['p1', 'p2'] as const) {
      const g = mk([rep({ ko: self, cause: 'effect' })]);
      byEffect(g, by);
      expect(asked(g)).toBe(true);
    }
    const battle = mk([rep({ ko: self, cause: 'effect' })]);
    byBattle(battle);
    expect(asked(battle)).toBe(false);
    expect(gone(battle)).toBe(true);
  });

  it('effect: a K.O. cost (part of the effect, RL-16) is replaced; opponentEffect does not cover it', () => {
    const cost = (cause: 'effect' | 'opponentEffect') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, V.c1, [rep({ ko: self, cause })]);
      g.state = withAbilities(g.state, BLUE, [
        main(
          [{ do: { draw: 1 } }],
          [
            {
              ko: {
                from: 'characters',
                owner: 'you',
                filter: { not: { isSelf: true } },
                pick: { exactly: 1 },
              },
            },
          ],
        ),
      ]);
      g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
      return g;
    };
    expect(asked(cost('effect'))).toBe(true);
    expect(asked(cost('opponentEffect'))).toBe(false);
  });

  it('battle: a battle K.O. is replaced, an effect K.O. is not; accepting returns the DON!!', () => {
    const g = mk([rep({ ko: self, cause: 'battle' })]);
    byBattle(g);
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    expect(gone(g)).toBe(false);
    expect(don(g, 'p2').deck).toBe(10);
    const eff = mk([rep({ ko: self, cause: 'battle' })]);
    byEffect(eff, 'p1');
    expect(asked(eff)).toBe(false);
    expect(gone(eff)).toBe(true);
  });

  it('without a cause it still replaces every K.O. (unchanged)', () => {
    for (const how of ['p1', 'p2', 'battle'] as const) {
      const g = mk([rep({ ko: self })]);
      if (how === 'battle') byBattle(g);
      else byEffect(g, how);
      expect(asked(g)).toBe(true);
    }
  });

  it('OP10-118 shape: mandatory, once per turn, empty payload: prevents the K.O. and is then spent (M6b-Q36)', () => {
    const ab = rep(
      { ko: self, cause: 'opponentEffect' },
      { optional: false, instead: [], oncePerTurn: true },
    );
    const g = mk([ab]);
    byEffect(g, 'p1');
    expect(asked(g)).toBe(false);
    expect(gone(g)).toBe(false); // prevented with no decision
    expect(g.state && dec(g)?.kind).toBe('main');
    byEffect(g, 'p1');
    expect(gone(g)).toBe(true); // the second K.O. this turn is not replaced
  });
});

describe('G14 `leaveField` replacement with any cause', () => {
  it('validates; `opponentEffect` stays opponent-only', () => {
    expectValid([rep({ leaveField: self, cause: 'any' })]);
    const g = mk([rep({ leaveField: self, cause: 'opponentEffect' })]);
    byBattle(g);
    expect(asked(g)).toBe(false);
    expect(gone(g)).toBe(true);
  });

  it('any: a battle K.O., your own K.O. effect and an opponent effect are all replaced', () => {
    const ab = rep({ leaveField: self, cause: 'any' });
    const b = mk([ab]);
    byBattle(b);
    expect(asked(b)).toBe(true);
    const own = mk([ab]);
    byEffect(own, 'p2');
    expect(asked(own)).toBe(true);
    const opp = mk([ab]);
    byEffect(opp, 'p1');
    expect(asked(opp)).toBe(true);
  });

  it('any: a removal that is not a K.O. (your own effect bouncing it to hand) is replaced; opponentEffect does not cover it', () => {
    const bounce = (cause: 'any' | 'opponentEffect') => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [BLUE, V.c1], costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, V.c1, [rep({ leaveField: self, cause })]);
      g.state = withAbilities(g.state, BLUE, [
        main([
          {
            do: {
              move: {
                what: {
                  from: 'characters',
                  owner: 'you',
                  filter: { not: { isSelf: true } },
                  pick: { exactly: 1 },
                },
                to: { zone: 'hand' },
              },
            },
          },
        ]),
      ]);
      g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
      return g;
    };
    const yes = bounce('any');
    expect(asked(yes)).toBe(true);
    yes.act({ type: 'optional', accept: true });
    expect(yes.zone('p1', 'characters')).toHaveLength(2);
    const no = bounce('opponentEffect');
    expect(asked(no)).toBe(false);
    expect(no.zone('p1', 'characters')).toHaveLength(1);
  });

  it('a K.O. is replaced once: with `ko` and `leaveField any` both on the card, accepting one ends the event (CR 8-1-3-4-3)', () => {
    const g = mk([rep({ ko: self }, {}, 'k'), rep({ leaveField: self, cause: 'any' }, {}, 'l')]);
    byEffect(g, 'p1');
    expect(asked(g)).toBe(true);
    g.act({ type: 'optional', accept: true });
    expect(dec(g)?.kind).toBe('main'); // the other replacement is not offered for the same K.O.
    expect(gone(g)).toBe(false);
    expect(don(g, 'p2').deck).toBe(10);
  });
});

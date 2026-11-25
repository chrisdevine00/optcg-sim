/**
 * M6b wave 8a, G71: the condition `attackerIs` on the attacking card of an [On Your Opponent's
 * Attack] ability (OP11-088 Shu: "[Once Per Turn] This effect can be activated when your opponent's
 * Character attacks. If that Character has the <Slash> attribute, this Character gains +5000 power
 * during this battle"). Ability-level it narrows the trigger to a Character; effect-level (`if`) it
 * reads the same attacker. Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { applyOp, withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  endCounter,
  game,
  passBlock,
  takeDamage,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, expectValid } from '../m6b-w1/probe.ts';

const SLASH = V.c3; // 5000, <Slash>
const RANGED = V.c4; // 6000, <Ranged>

const plusFive = {
  do: {
    power: { target: { from: 'self', owner: 'you' }, amount: 5000, duration: 'battle' },
  },
};
/** "[Once Per Turn] when your opponent's Character attacks: if that Character has <Slash>, +5000". */
const shu = (over: object = {}): Ability =>
  ({
    id: 'shu',
    kind: 'auto',
    when: ['onOpponentAttack'],
    oncePerTurn: true,
    conditions: [{ attackerIs: { category: ['Character'] } }],
    effect: [{ if: { attackerIs: { attribute: 'Slash' } }, then: [plusFive] }],
    ...over,
  }) as unknown as Ability;

/** p2 (active) attacks p1's rested BLUE (the Shu probe, 3000) or p1's Leader. */
const mk = (ab: Ability = shu(), p2: object = {}) => {
  const g = game(
    { leader: PLAIN_BLUE, characters: [{ card: BLUE, rested: true }] },
    { leader: PLAIN_PURPLE, characters: [SLASH, RANGED], ...p2 },
    { activePlayer: 'p2', turn: 4 },
  );
  g.state = withAbilities(g.state, BLUE, [ab]);
  return g;
};
const attack = (g: ReturnType<typeof mk>, attacker: string | 'leader', target: string = 'leader') =>
  g.act({
    type: 'attack',
    attacker: attacker === 'leader' ? g.leader('p2') : g.find('p2', 'characters', attacker),
    target: target === 'leader' ? g.leader('p1') : g.find('p1', 'characters', target),
  });
const blue = (g: ReturnType<typeof mk>) => g.power(g.find('p1', 'characters', BLUE));
const endBattle = (g: ReturnType<typeof mk>) => {
  passBlock(g);
  endCounter(g);
  takeDamage(g);
};

describe('G71 the attacking card in an [On Your Opponent’s Attack]', () => {
  it('validates, and only where there is an attacker to read', () => {
    expectValid([shu()]);
    const bad = (over: object) => errorsOf(shu(over));
    expect(bad({ when: ['whenAttacking'] })).not.toEqual([]);
    expect(bad({ when: ['onPlay'] })).not.toEqual([]);
    expect(bad({ when: ['onOpponentAttack', 'onPlay'] })).not.toEqual([]); // one timing has no attacker
    expect(bad({ kind: 'permanent', when: undefined, apply: [], effect: undefined })).not.toEqual(
      [],
    );
    expect(
      errorsOf({
        id: 'a',
        kind: 'activate',
        when: 'activateMain',
        conditions: [{ attackerIs: { category: ['Character'] } }],
        effect: [{ do: { draw: 1 } }],
      }),
    ).not.toEqual([]);
    expect(bad({ conditions: [{ attackerIs: { attribute: 'Nope' } }] })).not.toEqual([]); // a real filter
    expect(bad({ conditions: [{ attackerIs: true }] })).not.toEqual([]);
  });

  it('a <Slash> Character attacks: +5000 power during the battle', () => {
    const g = mk();
    expect(blue(g)).toBe(3000);
    attack(g, SLASH);
    expect(blue(g)).toBe(8000);
    endBattle(g);
    expect(blue(g)).toBe(3000); // only during this battle
  });

  it('a Character that is not <Slash> adds nothing, but the Once Per Turn is spent', () => {
    const g = mk();
    attack(g, RANGED);
    expect(blue(g)).toBe(3000);
    endBattle(g);
    // The ability already resolved once this turn: the <Slash> attack finds it spent.
    attack(g, SLASH);
    expect(blue(g)).toBe(3000);
  });

  it('a Leader attack does not trigger it (and spends nothing)', () => {
    const g = mk();
    attack(g, 'leader', 'leader'); // the opponent's Leader attacks my Leader: Shu's trigger needs a Character
    expect(blue(g)).toBe(3000);
    endBattle(g);
    attack(g, SLASH);
    expect(blue(g)).toBe(8000); // still available: the Leader attack used nothing up
  });

  it('reads the attacker as it is now: a granted attribute counts', () => {
    const g = mk();
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'grantAttribute',
        attribute: 'Slash',
        amount: 0,
        target: g.find('p2', 'characters', RANGED),
        duration: { kind: 'thisTurn', turn: 4 },
        controller: 'p2',
        source: g.find('p2', 'characters', RANGED),
      },
    } as never).state;
    attack(g, RANGED);
    expect(blue(g)).toBe(8000);
  });

  it('the effect-level form alone (no ability condition) fires for a Leader attack and reads its attribute', () => {
    const g = mk(shu({ conditions: undefined }));
    attack(g, 'leader', 'leader'); // PLAIN_PURPLE is <Strike>: not Slash
    expect(blue(g)).toBe(3000);
    const h = mk(
      shu({
        conditions: undefined,
        effect: [{ if: { attackerIs: { category: ['Leader'] } }, then: [plusFive] }],
      }),
    );
    attack(h, 'leader', 'leader');
    expect(blue(h)).toBe(8000);
  });
});

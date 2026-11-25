/**
 * M6b wave 5, G47: the timed restriction "cannot attack your opponent's Characters with a base cost
 * of 7 or less during this turn" (OP12-020), as `cannotAttackTarget: Filter`. Planted on vanilla
 * cards (rested p2 Characters of cost 3 and 4 stand in for the cost line); each test fails with the
 * gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';
import { errorsOf, expectValid, main, run } from '../m6b-w1/probe.ts';

const self = { from: 'self', owner: 'you' } as const;
const barred = { all: [{ category: ['Character'] }, { baseCost: { lte: 3 } }] };
const restrict = (target: object, by: object = barred) => ({
  do: {
    restrict: {
      target,
      what: { cannotAttackTarget: by },
      duration: 'thisTurn',
    },
  },
});

/** p1's turn 3: p2 has rested Characters of cost 3 (V.c3) and 4 (V.c4); p1 has BLUE and a Leader. */
const mk = () =>
  game(
    { leader: PLAIN_PURPLE, characters: [BLUE] },
    {
      leader: PLAIN_BLUE,
      characters: [
        { card: V.c3, rested: true },
        { card: V.c4, rested: true },
      ],
    },
  );
/** The cards `attacker` can attack now, as p2's cards. */
const targets = (g: ReturnType<typeof mk>, attacker: string): string[] =>
  g
    .legal()
    .filter((a) => a.type === 'attack' && a.attacker === attacker)
    .map((a) => (a.type === 'attack' ? g.card(a.target).card : ''))
    .sort();

describe('G47 cannotAttackTarget', () => {
  it('validates, and refuses what a target filter cannot read or who cannot attack', () => {
    main([restrict({ from: 'leader', owner: 'you' })] as never);
    const bad = (e: unknown) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [e] });
    for (const by of [{ ref: 'x' }, { isSelf: true }, { donGiven: { gte: 1 } }, { color: 'Plaid' }])
      expect(bad(restrict({ from: 'leader', owner: 'you' }, by))).not.toEqual([]);
    // A Stage does not attack; a player is not an attacker.
    expect(bad(restrict({ from: 'stage', owner: 'you' }))).not.toEqual([]);
    expect(
      bad({
        do: {
          restrict: { target: 'you', what: { cannotAttackTarget: barred }, duration: 'thisTurn' },
        },
      }),
    ).not.toEqual([]);
    // Permanent form: on a Leader or Character of yours.
    expectValid([
      {
        id: 'p',
        kind: 'permanent',
        apply: [{ restrict: { target: self, what: { cannotAttackTarget: barred } } }],
      } as Ability,
    ]);
  });

  it('bars the attack on a matching Character for the turn, and no other attack', () => {
    const g = mk();
    const leader = g.leader('p1');
    expect(targets(g, leader)).toEqual([PLAIN_BLUE, V.c3, V.c4].sort());
    g.state = withAbilities(g.state, BLUE, [
      main([restrict({ from: 'leader', owner: 'you' })] as never),
    ]);
    run(g);
    // The cost 3 Character can no longer be attacked by the Leader; the cost 4 one and the Leader can.
    expect(targets(g, leader)).toEqual([PLAIN_BLUE, V.c4].sort());
    // Another attacker of yours is not restricted.
    expect(targets(g, g.find('p1', 'characters', BLUE))).toEqual([PLAIN_BLUE, V.c3, V.c4].sort());
  });

  it('is refused with a reason when attempted anyway', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([restrict({ from: 'leader', owner: 'you' })] as never),
    ]);
    run(g);
    expect(() =>
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.find('p2', 'characters', V.c3) }),
    ).toThrow(/Not a legal action/);
    // The allowed target works.
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.find('p2', 'characters', V.c4) });
    expect(g.eventsOfType('AttackDeclared')).toHaveLength(1);
  });

  it('the permanent form applies while the card is in play', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      {
        id: 'p',
        kind: 'permanent',
        apply: [{ restrict: { target: self, what: { cannotAttackTarget: barred } } }],
      } as Ability,
    ]);
    expect(targets(g, g.find('p1', 'characters', BLUE))).toEqual([PLAIN_BLUE, V.c4].sort());
    expect(targets(g, g.leader('p1'))).toEqual([PLAIN_BLUE, V.c3, V.c4].sort());
  });

  it('a target filter on keywords or state also works (rested Characters only)', () => {
    const g = mk();
    g.state = withAbilities(g.state, BLUE, [
      main([restrict({ from: 'leader', owner: 'you' }, { state: 'rested' })] as never),
    ]);
    run(g);
    expect(targets(g, g.leader('p1'))).toEqual([PLAIN_BLUE]);
  });
});

/** OP11-005 Smoker. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import {
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
  game,
  passBlock,
  endCounter,
  expectDecision,
} from './helpers.ts';
import { mine } from './helpers-w5c2.ts';

const ID = 'OP11-005';
/** V.c1 is a <Slash> vanilla, V.c2 <Strike>, V.c6 <Special> (cost 6). */
const SLASH = V.c1;
const STRIKE = V.c2;
const SPECIAL = V.c6;
/** A <Slash> Leader (unscripted): without the Character condition its effect would count. */
const SLASH_LEADER = 'OP01-001';

const koFrom = (owner: 'you' | 'opponent'): Ability =>
  ({
    id: 'k',
    kind: 'activate',
    when: 'activateMain',
    effect: [
      {
        do: {
          ko: { from: 'characters', owner, filter: { name: 'Smoker' }, pick: { exactly: 1 } },
        },
      },
    ],
  }) as Ability;

/** p2's turn: p2's `src` card (or its Leader) K.O.s p1's Smoker, which has `don` DON!! given. */
const byEffect = (src: string | 'leader', don = 1) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [{ card: ID, don }] },
    {
      leader: src === 'leader' ? SLASH_LEADER : PLAIN_BLUE,
      characters: src === 'leader' ? [] : [src],
    },
    { activePlayer: 'p2', turn: 4 },
  );
  if (src === 'leader') {
    g.state = withAbilities(g.state, SLASH_LEADER, [koFrom('opponent')]);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'k' });
  } else {
    g.state = withAbilities(g.state, src, [koFrom('opponent')]);
    g.act({ type: 'activate', card: g.find('p2', 'characters', src), ability: 'k' });
  }
  return g;
};
const survives = (g: ReturnType<typeof byEffect>) => g.zone('p1', 'characters').length === 1;

describe('OP11-005 Smoker', () => {
  it('[DON!! x1]: an effect of a Character without <Special> (Slash, Strike) cannot K.O. it', () => {
    expect(survives(byEffect(SLASH))).toBe(true);
    expect(survives(byEffect(STRIKE))).toBe(true);
    expect(byEffect(SLASH).eventsOfType('KOPrevented')).toHaveLength(1);
  });

  it('an effect of a <Special> Character still K.O.s it', () => {
    expect(survives(byEffect(SPECIAL))).toBe(false);
  });

  it('an effect of a Leader is not an effect of a Character: it K.O.s it', () => {
    expect(survives(byEffect('leader'))).toBe(false);
  });

  it('without a DON!! given the protection is off', () => {
    expect(survives(byEffect(SLASH, 0))).toBe(false);
  });

  it('"effects" includes your own Characters\' effects, and a battle K.O. is not an effect', () => {
    const own = (src: string) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1 }, src] },
        { leader: PLAIN_BLUE },
      );
      g.state = withAbilities(g.state, src, [koFrom('you')]);
      g.act({ type: 'activate', card: g.find('p1', 'characters', src), ability: 'k' });
      return g.zone('p1', 'characters').map((c) => c.card);
    };
    expect(own(SLASH)).toEqual([ID, SLASH]);
    expect(own(SPECIAL)).toEqual([SPECIAL]);

    // p2 attacks the rested Smoker with a bigger Character: the battle K.O. goes through.
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: ID, don: 1, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: mine(g, ID) });
    passBlock(g);
    endCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('[Blocker]: may be chosen to block an attack on the Leader', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c4] },
      { activePlayer: 'p2', turn: 4 },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(g.isLegal({ type: 'block', blocker: mine(g, ID), player: 'p1' })).toBe(true);
  });
});

/**
 * M6b wave 6, G58: "[On Your Opponent's Attack] You may trash any number of "Music" type cards from
 * your hand. Your Leader or 1 of your Characters gains +1000 power during this battle for every
 * card trashed" (ST16-002 Gordon).
 *
 * No engine change was needed: the audit read the trash as a cost, but the text has no colon, so it
 * is an effect, and the pick `any` with a bound name read back by `refCount` (OP15-002 Lucy, wave 4)
 * already does it. This file pins that the shape validates and plays as the card reads, on vanilla
 * cards; it cannot fail by reverting a change, because there is none.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  expectDecision,
  game,
  hand,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  trash,
  V,
} from '../helpers.ts';
import { expectValid } from '../m6b-w1/probe.ts';

/** ST16-002's text, on a vanilla card: trash any number from the hand, +1000 each to a Leader or Character. */
const gordon = {
  id: 'opp-attack',
  kind: 'auto',
  when: ['onOpponentAttack'],
  effect: [
    {
      do: {
        trashFromHand: {
          from: 'hand',
          owner: 'you',
          filter: { category: ['Character'] },
          pick: { any: true },
          bind: 'trashed',
        },
      },
    },
    {
      if: { cmp: [{ refCount: 'trashed' }, '>=', 1] },
      then: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: { exactly: 1 },
              },
              amount: { mul: [{ refCount: 'trashed' }, 1000] },
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
} as unknown as Ability;

/** p2's Leader attacks p1's Leader; p1 holds three Characters and the probe V.c1 is on the field. */
const mk = () => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c1, BLUE], hand: [V.c2, V.c3, V.c4] },
    { leader: PLAIN_BLUE },
    { activePlayer: 'p2', turn: 4 },
  );
  g.state = withAbilities(g.state, V.c1, [gordon]);
  g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  return g;
};

describe('G58 trash any number from the hand, a bonus per card trashed', () => {
  it('validates as a script', () => {
    expectValid([gordon]);
  });

  it('two cards trashed give +2000 to the chosen Character for the battle', () => {
    const g = mk();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
    expectDecision(g, 'choose', 'p1'); // the Leader or the Character
    const blue = g.find('p1', 'characters', BLUE);
    const before = g.power(blue)!;
    g.act({ type: 'pick', choice: blue });
    expect(g.power(blue)).toBe(before + 2000);
    expect(trash(g, 'p1')).toEqual(expect.arrayContaining([V.c2, V.c3]));
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });

  it('the Leader may take the bonus', () => {
    const g = mk();
    pick(g, [g.find('p1', 'hand', V.c4)]);
    const leader = g.leader('p1');
    const before = g.power(leader)!;
    g.act({ type: 'pick', choice: leader });
    expect(g.power(leader)).toBe(before + 1000);
  });

  it('choosing none is the decline: nothing is trashed and no target is asked', () => {
    const g = mk();
    none(g);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(dec(g)?.kind).toBe('block');
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('is asked of a hand with no matching card too, so the opponent learns nothing from the pause', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [V.c1], hand: [] },
      { leader: PLAIN_BLUE },
      { activePlayer: 'p2', turn: 4 },
    );
    g.state = withAbilities(g.state, V.c1, [gordon]);
    g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
    // The filter keeps the question asked, so a hand with a match and one without look the same.
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(dec(g)?.kind).toBe('block');
  });
});

/**
 * W57-R4 (waves 5-7 review): the `cardPlayed` qualifier `via: 'characterEffect'` is "a Character's
 * effect". A Character card's own [Trigger] ("[Trigger] Play this card") is not one: the official
 * OP12-081 Koala answer is "Playing a Character using a [Trigger] effect is not considered playing
 * it using a Character effect". Each test fails with `viaOf` reverted.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  endCounter,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from '../helpers.ts';

const draws = (via: 'effect' | 'characterEffect'): Ability =>
  ({
    id: 'w',
    kind: 'auto',
    when: [{ event: 'cardPlayed', by: 'you', via }],
    effect: [{ do: { draw: 1 } }],
  }) as unknown as Ability;
const playThis = {
  id: 't',
  kind: 'trigger',
  effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
} as unknown as Ability;

/** p2 attacks p1; p1's top Life card is PURPLE, a Character whose [Trigger] plays itself. */
function triggered(via: 'effect' | 'characterEffect') {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [V.c1], life: [PURPLE, BLUE, BLUE] },
    { leader: PLAIN_BLUE },
    { activePlayer: 'p2', turn: 4 },
  );
  g.state = withAbilities(g.state, PURPLE, [playThis]);
  g.state = withAbilities(g.state, V.c1, [draws(via)]);
  g.act({ type: 'attack', attacker: g.leader('p2'), target: g.leader('p1') });
  passBlock(g);
  endCounter(g);
  expect(dec(g)?.kind).toBe('trigger');
  const before = hand(g, 'p1').length;
  g.act({ type: 'trigger', activate: true });
  return hand(g, 'p1').length - before;
}

describe('W57-R4 a Character [Trigger] play is an effect, not a Character effect', () => {
  it('via "characterEffect" does not see a Character card [Trigger] play this card', () => {
    // The Trigger card itself leaves the hand to be played (-1 in hand count is not drawn).
    expect(triggered('characterEffect')).toBe(0);
  });

  it('via "effect" does see it: any effect, a [Trigger] included', () => {
    expect(triggered('effect')).toBe(1);
  });
});

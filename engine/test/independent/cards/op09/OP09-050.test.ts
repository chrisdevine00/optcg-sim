/**
 * OP09-050 Nami (Character, Blue, cost 1, 1000, Counter +1000, {East Blue}).
 *
 * Card text: "[When Attacking] Look at 5 cards from the top of your deck; reveal up to 1 blue Event and
 * add it to your hand. Then, place the rest at the bottom of your deck in any order."
 *
 * Rules: CR 10-2-5 ([When Attacking]), CR 8-4-4 ("up to"), CR 11-2-1 (reveal). The filter is the
 * card category Event AND the colour blue: a blue Character and a red Event both fail it.
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence } from '../../helpers.ts';
import {
  at,
  atMain,
  deckTop,
  describeLookBottom,
  E9,
  hand,
  L9,
  mine,
  need,
  offeredIds,
  playId,
  theirs,
  V9,
} from './kit-op09b.ts';

const NAMI = 'OP09-050';
const SPADA = 'OP01-088';

describeLookBottom({
  id: NAMI,
  n: 5,
  after: 'block',
  start: (top) => {
    const g = mine(L9.neutral, { characters: [NAMI], deck: top });
    attack(g, at(g, 'p1', 'characters', NAMI), g.leader('p2'));
    return g;
  },
  match: [E9.blueEvent, SPADA],
  miss: V9.c4,
});

describe('OP09-050 Nami: the filter is "blue Event"', () => {
  const swing = (top: string[]) => {
    const g = mine(L9.neutral, { characters: [NAMI], deck: deckTop(top) });
    attack(g, at(g, 'p1', 'characters', NAMI), g.leader('p2'));
    return g;
  };

  it('a red Event and a blue Character are not offered; the blue Event is', () => {
    const g = swing([E9.redEvent, V9.mr1, SPADA, V9.c4, V9.c5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SPADA]);
  });

  it('with only non-blue Events and blue Characters in the top 5 nothing qualifies (the pick is still asked, max 0)', () => {
    const g = swing([E9.redEvent, V9.mr1, V9.richie, V9.c4, V9.c5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
  });

  it('must not fire when Nami is played: [When Attacking] only', () => {
    const g = mine(L9.neutral, { hand: [NAMI], deck: deckTop([E9.blueEvent]) });
    playId(g, NAMI);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('must not fire when the opponent attacks (Nami is not involved)', () => {
    const g = theirs(
      L9.neutral,
      { characters: [NAMI], deck: deckTop([E9.blueEvent]) },
      {
        characters: [V9.c1],
      },
    );
    attack(g, at(g, 'p2', 'characters', V9.c1), g.leader('p1'));
    need(g, 'block', 'p1');
    noDefence(g);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(E9.blueEvent);
  });
});

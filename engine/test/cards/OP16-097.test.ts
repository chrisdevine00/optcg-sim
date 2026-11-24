/** OP16-097 Yamato (cost 8, [On Play]). */
import { describe, expect, it } from 'vitest';
import { game, hand, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { BLACK_8000, names, RED_1, WANO_GREEN_1, YAMATO_5 } from './helpers-op16g4.ts';

const ID = 'OP16-097';
const EVENT = 'OP16-099'; // a {Land of Wano} Event

const start = (trash: string[], h: string[] = []) =>
  game(
    { leader: PLAIN_BLUE, hand: [ID, ...h], trash, costArea: { active: 8, rested: 0 } },
    { leader: PLAIN_BLUE },
  );

describe('OP16-097 Yamato', () => {
  it('[On Play] adds a {Land of Wano} Character (cost 6 or less) from trash to hand, then plays a cost 2 or less Character from hand', () => {
    const g = start([WANO_GREEN_1, V.c1], [RED_1]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', WANO_GREEN_1)]);
    // Now play from hand: the card just added (cost 1) and Doma (cost 1) are both eligible.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'hand', RED_1)]);
    expect(names(g, 'p1', 'characters').sort()).toEqual([ID, RED_1].sort());
    expect(hand(g, 'p1')).toEqual([WANO_GREEN_1]);
  });

  it('the card just added can itself be the one played', () => {
    const g = start([WANO_GREEN_1]);
    play(g, ID);
    pick(g, [g.find('p1', 'trash', WANO_GREEN_1)]);
    pick(g, [g.find('p1', 'hand', WANO_GREEN_1)]);
    expect(names(g, 'p1', 'characters').sort()).toEqual([ID, WANO_GREEN_1].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('must not add an Event or a non-Wano Character; "Then" still lets the hand play happen', () => {
    // An Event and a non-Wano Character in the trash: neither can be added.
    const g = start([EVENT, BLACK_8000], [RED_1]);
    play(g, ID);
    expect(
      g.legal().some((a) => a.type === 'pick' && g.card(a.choice as string).zone === 'trash'),
    ).toBe(false);
    // Nothing added, but the hand play step still runs.
    pick(g, [g.find('p1', 'hand', RED_1)]);
    expect(names(g, 'p1', 'characters').sort()).toEqual([ID, RED_1].sort());
  });

  it('the play step only takes cost 2 or less: a cost 5 Character in hand is not offered', () => {
    const g = start([], [YAMATO_5]);
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toEqual([YAMATO_5]);
  });
});

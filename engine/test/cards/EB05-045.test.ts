/** EB05-045 Ms. Monday: [On Play] K.O. up to 1 of your {Baroque Works} Characters. [On K.O.] Look at 3; reveal up to 1 {Baroque Works} card and add it to your hand; trash the rest. */
import { describe, expect, it } from 'vitest';
import { game, hand, none, pick, play, PLAIN_PURPLE, times, trash, V } from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';
import { ids } from './helpers-robin.ts';

const MONDAY = 'EB05-045';
/** OP14-095 Mr.9: a vanilla Baroque Works Character. */
const BW = 'OP14-095';

describe('EB05-045 Ms. Monday', () => {
  const setup = (chars: string[], deck: string[] = times(10, V.c1)) =>
    game(
      {
        leader: PLAIN_PURPLE,
        hand: [MONDAY],
        characters: chars,
        deck,
        costArea: { active: 2, rested: 0 },
      },
      { leader: PLAIN_PURPLE, characters: [V.c7] },
    );

  it('[On Play] K.O.s the chosen {Baroque Works} Character of yours', () => {
    const g = setup([BW, V.c1]);
    play(g, MONDAY);
    // Candidates: Mr.9 and Ms. Monday herself, not the other type.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', BW)]);
    expect(ids(g, 'p1', 'trash')).toEqual([BW]);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([MONDAY, V.c1].sort());
  });

  it('[On Play] "up to 1": may K.O. nothing', () => {
    const g = setup([BW]);
    play(g, MONDAY);
    none(g);
    expect(ids(g, 'p1', 'characters').sort()).toEqual([BW, MONDAY].sort());
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });

  it('[On Play] with no other Baroque Works Character she may K.O. herself, which fires [On K.O.]', () => {
    const g = setup([V.c1], [BW, V.c2, V.c3, ...times(7, V.c1)]);
    play(g, MONDAY);
    pick(g, [g.find('p1', 'characters', MONDAY)]);
    // [On K.O.]: look at 3, take the Baroque Works card, trash the rest.
    pick(g, [g.find('p1', 'deck', BW)]);
    expect(hand(g, 'p1')).toEqual([BW]);
    expect(trash(g, 'p1').sort()).toEqual([MONDAY, V.c2, V.c3].sort());
  });

  it('[On K.O.] by battle: with no Baroque Works card among the 3, all 3 are trashed', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [{ card: MONDAY, rested: true }], deck: times(10, V.c1) },
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', MONDAY));
    // Nothing to take: the look is still shown, and confirming it trashes all 3.
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });

  it('[On K.O.] "up to 1": may take nothing, and the rest are still trashed', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [{ card: MONDAY, rested: true }],
        deck: [BW, V.c1, V.c1, V.c1],
      },
      { leader: PLAIN_PURPLE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', MONDAY));
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });
});

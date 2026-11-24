/** OP16-091 Nami. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, play, PLAIN_BLUE, PURPLE, trash } from './helpers.ts';
import { NOT_NAVY, WANO_1, WANO_LEADER } from './helpers-op16g3.ts';

const ID = 'OP16-091';
const deck = [ID, PURPLE, WANO_1, BLUE, BLUE, BLUE];
const start = (leader: string) =>
  game({ leader, hand: [ID], deck, costArea: { active: 1, rested: 0 } }, { leader: PLAIN_BLUE });

describe('OP16-091 Nami', () => {
  it('[On Play] with a {Land of Wano} Leader: looks at 4, adds a {Land of Wano} card other than [Nami], trashes the rest', () => {
    const g = start(WANO_LEADER);
    play(g, ID);
    // The second [Nami] is {Land of Wano} but excluded by name: only Komachiyo is offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'deck', WANO_1)]);
    expect(hand(g, 'p1')).toEqual([WANO_1]);
    expect(trash(g, 'p1').sort()).toEqual([ID, PURPLE, BLUE].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(2);
  });

  it('only 4 cards are looked at: a match in 5th place is not reachable and stays in the deck', () => {
    const g = game(
      {
        leader: WANO_LEADER,
        hand: [ID],
        deck: [PURPLE, BLUE, BLUE, BLUE, WANO_1],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(trash(g, 'p1')).toHaveLength(4);
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([WANO_1]);
  });

  it('"up to 1": taking nothing trashes all 4', () => {
    const g = start(WANO_LEADER);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });

  it('with another Leader type nothing is looked at', () => {
    const g = start(NOT_NAVY);
    play(g, ID);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });
});

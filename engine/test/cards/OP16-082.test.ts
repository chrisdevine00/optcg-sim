/** OP16-082 Kin'emon. */
import { describe, expect, it } from 'vitest';
import { BLUE, game, hand, none, pick, play, PLAIN_BLUE, PURPLE, trash, V } from './helpers.ts';
import { NOT_NAVY, WANO_1, WANO_5, WANO_LEADER } from './helpers-op16g3.ts';

const ID = 'OP16-082';
const deck = [PURPLE, WANO_1, V.c1, WANO_5, BLUE, BLUE, BLUE, BLUE];
const start = (leader: string) =>
  game({ leader, hand: [ID], deck, costArea: { active: 4, rested: 0 } }, { leader: PLAIN_BLUE });

describe("OP16-082 Kin'emon", () => {
  it('this Character gains +3 cost on the field (printed 4, now 7)', () => {
    const g = start(NOT_NAVY);
    expect(g.card(g.find('p1', 'hand', ID)).cost).toBe(4);
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(7);
  });

  it('[On Play] with a {Land of Wano} Leader: looks at 5, adds a {Land of Wano} card, trashes the rest', () => {
    const g = start(WANO_LEADER);
    play(g, ID);
    // Only the two {Land of Wano} cards are offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', WANO_5)]);
    expect(hand(g, 'p1')).toEqual([WANO_5]);
    expect(trash(g, 'p1').sort()).toEqual([PURPLE, WANO_1, V.c1, BLUE].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('"up to 1": taking nothing trashes all 5 looked-at cards', () => {
    const g = start(WANO_LEADER);
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toHaveLength(5);
  });

  it('with another Leader type nothing is looked at or trashed', () => {
    const g = start(NOT_NAVY);
    play(g, ID);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });
});

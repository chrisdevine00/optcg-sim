/** OP13-089 St. Topman Warcury. */
import { describe, expect, it } from 'vitest';
import { PLAIN_PURPLE } from './helpers.ts';
import {
  canBlockWith,
  koByBattle,
  mine,
  names,
  plant,
  plantOpponentEffect,
  rep,
  theirs,
  V,
} from './helpers-op13g4.ts';

const ID = 'OP13-089';
const koMine = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };

describe('OP13-089 St. Topman Warcury', () => {
  it('with 7 cards in trash: an opponent effect cannot K.O. it', () => {
    const g = theirs({ leader: PLAIN_PURPLE, characters: [ID], trash: rep(7, V.c1) });
    plantOpponentEffect(g, koMine);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toHaveLength(7);
  });

  it("with 6 cards in trash it is K.O.'d by an opponent effect (threshold is exactly 7)", () => {
    const g = theirs({ leader: PLAIN_PURPLE, characters: [ID], trash: rep(6, V.c1) });
    plantOpponentEffect(g, koMine);
    expect(names(g, 'p1', 'characters')).toEqual([]);
  });

  it('with 7 cards in trash it still falls to your own effect and to battle', () => {
    const g = mine({ leader: PLAIN_PURPLE, characters: [ID], trash: rep(7, V.c1) });
    plant(g, 'p1', { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    expect(names(g, 'p1', 'characters')).toEqual([]);
    const b = koByBattle({ leader: PLAIN_PURPLE, trash: rep(7, V.c1) }, ID);
    expect(names(b, 'p1', 'characters')).toEqual([]);
  });

  it('gains [Blocker] with 7 cards in trash, not with 6', () => {
    for (const [n, can] of [
      [7, true],
      [6, false],
    ] as const) {
      const g = theirs(
        { leader: PLAIN_PURPLE, characters: [ID], trash: rep(n, V.c1) },
        { characters: [V.c7] },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(can);
    }
  });

  it('[On K.O.] draws 1 card (battle K.O., trash under 7)', () => {
    const g = koByBattle({ leader: PLAIN_PURPLE, trash: rep(2, V.c1) }, ID);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
  });
});

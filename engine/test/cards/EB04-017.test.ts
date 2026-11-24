/** EB04-017 Mystoms. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play } from './helpers.ts';
import {
  at,
  canPick,
  MINK1,
  MINK3,
  MINK5,
  MINK6,
  MINKS_LEADER,
  mk,
  oppTurn,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-017';
const cost = (g: ReturnType<typeof mk>, p: 'p1' | 'p2', card: string) =>
  g.card(at(g, p, 'characters', card)).cost;

describe('EB04-017 Mystoms', () => {
  it("[Your Turn] with 3 {Minks} Characters (itself included): all of your opponent's Characters get -1 cost", () => {
    const g = mk(
      { leader: RED_LEADER, characters: [ID, MINK1, MINK3] },
      { characters: [V.c5, V.c1] },
    );
    expect(cost(g, 'p2', V.c5)).toBe(4);
    expect(cost(g, 'p2', V.c1)).toBe(0);
    expect(cost(g, 'p1', MINK1)).toBe(1); // your own Characters are not affected
  });

  it('with only 2 {Minks} Characters there is no change (boundary)', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, MINK1] }, { characters: [V.c5] });
    expect(cost(g, 'p2', V.c5)).toBe(5);
  });

  it("only on your turn: on the opponent's turn the cost is unchanged", () => {
    const g = mk(
      { leader: RED_LEADER, characters: [ID, MINK1, MINK3] },
      { characters: [V.c5] },
      oppTurn,
    );
    expect(cost(g, 'p2', V.c5)).toBe(5);
  });

  it('a non-{Minks} Character does not count toward the 3', () => {
    const g = mk({ leader: RED_LEADER, characters: [ID, MINK1, V.c1] }, { characters: [V.c5] });
    expect(cost(g, 'p2', V.c5)).toBe(5);
  });

  it('[On Play] with a {Minks} Leader: plays a {Minks} Character of cost 5 or less from your hand (6 and non-{Minks} are out)', () => {
    const g = mk({ leader: MINKS_LEADER, hand: [ID, MINK5, MINK6, V.c2] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', MINK5))).toBe(true); // cost 5: boundary
    expect(canPick(g, g.find('p1', 'hand', MINK6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'hand', V.c2))).toBe(false); // not {Minks}
    pick(g, [g.find('p1', 'hand', MINK5)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, MINK5]);
  });

  it('with a Leader that is not {Minks} nothing is played', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID, MINK5] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('"up to 1": the play may be skipped', () => {
    const g = mk({ leader: MINKS_LEADER, hand: [ID, MINK5] });
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});

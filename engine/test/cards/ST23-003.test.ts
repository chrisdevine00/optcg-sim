/** ST23-003 Benn.Beckman. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { accept, decline, dec, expectDecision, hand, none, pick, play, trash } from './helpers.ts';
import { buff } from './helpers-prbst.ts';
import { choices, mk, OTHER_LEADER, RHP_LEADER, V } from './helpers-lfb.ts';

const ID = 'ST23-003';

describe('ST23-003 Benn.Beckman', () => {
  const start = (
    leader: string = RHP_LEADER,
    theirs: NonNullable<PlayerSpec['characters']> = [V.c1, V.c2, V.c3],
  ) => mk({ leader, hand: [ID, V.c4] as never }, { characters: theirs });

  it('[On Play]: you may trash 1 card: with a "Red-Haired Pirates" Leader, K.O. up to 1 opposing Character with 4000 base power or less', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    // 3000 and 4000 base power qualify; 5000 does not.
    expectDecision(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(
      g
        .zone('p2', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([V.c1, V.c3].sort());
    expect(trash(g, 'p1')).toEqual([V.c4]);
  });

  it("the cost can be declined: nothing is trashed or K.O.'d", () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });

  it('"up to 1": may K.O. nothing, the card is still trashed', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expect(trash(g, 'p1')).toEqual([V.c4]);
  });

  it("reads base power: a 4000-base Character buffed to 6000 can still be K.O.'d, a 5000-base one reduced to 3000 cannot", () => {
    const g = start(RHP_LEADER, [V.c2, V.c3]);
    buff(g, g.find('p2', 'characters', V.c2), 2000);
    buff(g, g.find('p2', 'characters', V.c3), -2000);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c2))).toBe(6000);
    expect(choices(g)).toEqual([g.find('p2', 'characters', V.c2)]);
  });

  it('must not fire: with another Leader the card is trashed (the "If" follows the colon) and nothing is K.O.\'d', () => {
    const g = start(OTHER_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c4)]);
    expect(trash(g, 'p1')).toEqual([V.c4]);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    if (dec(g)?.kind === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(3);
  });
});

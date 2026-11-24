/** OP16-013 McGuy. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { idsIn, offers, RED_LEADER } from './helpers-op16g1.ts';

const ID = 'OP16-013';

describe('OP16-013 McGuy', () => {
  /** McGuy (8000, rested) is K.O.d in battle by p2's 9000 Character; p2 also has 8000, 9000 and a 7000 base Character with 2 DON!!. */
  const koed = () => {
    const g = game(
      { leader: RED_LEADER, characters: [{ card: ID, rested: true }] },
      {
        leader: PLAIN_BLUE,
        characters: [V.c7, V.c6, { card: V.c5, don: 2 }],
      },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', ID),
    });
    passBlock(g);
    endCounter(g);
    return g;
  };

  it("[On K.O.]: K.O. up to 1 of your opponent's Characters with 8000 base power or less", () => {
    const g = koed();
    expect(idsIn(g, 'p1', 'trash')).toEqual([ID]);
    // 8000 is inclusive; 9000 is not.
    expect(offers(g, g.find('p2', 'characters', V.c6))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', V.c7))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(idsIn(g, 'p2', 'trash')).toEqual([V.c6]);
  });

  it('reads BASE power: a 7000 base Character that is 9000 power now is a legal target', () => {
    const g = koed();
    const boosted = g.find('p2', 'characters', V.c5);
    expect(g.power(boosted)).toBe(9000);
    expect(offers(g, boosted)).toBe(true);
    pick(g, [boosted]);
    expect(idsIn(g, 'p2', 'trash')).toEqual([V.c5]);
  });

  it('"up to 1": it may K.O. nothing', () => {
    const g = koed();
    none(g);
    expect(idsIn(g, 'p2', 'characters')).toHaveLength(3);
    expectDecision(g, 'main', 'p2');
  });

  it('is not an [On Play]: playing from hand does nothing', () => {
    const g = game(
      { leader: RED_LEADER, hand: [ID], costArea: { active: 6, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c6] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(idsIn(g, 'p2', 'characters')).toEqual([V.c6]);
  });
});

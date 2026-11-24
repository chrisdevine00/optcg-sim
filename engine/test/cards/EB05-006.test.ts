/** EB05-006 Miss Buckingham Stussy. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  option,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';

const ID = 'EB05-006';

const start = (p1: Partial<PlayerSpec> = {}) =>
  game(
    { leader: PLAIN_PURPLE, characters: [ID, V.c2], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c6] },
  );
const use = (g: ReturnType<typeof start>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'power-swing' });

describe('EB05-006 Miss Buckingham Stussy', () => {
  it('mode 1: add the top Life card to your hand: give up to 1 Character +3000 power during this turn', () => {
    const g = start();
    use(g);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    option(g, '0');
    // Any Character on the field, yours or your opponent's, but not a Leader.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    const mine = g.find('p1', 'characters', V.c2);
    pick(g, [mine]);
    expect(g.power(mine)).toBe(7000);
    g.act({ type: 'endTurn' });
    expect(g.power(mine)).toBe(4000);
  });

  it("mode 2: give up to 1 Character -4000 power during this turn (an opponent's Character)", () => {
    const g = start();
    use(g);
    option(g, '1');
    const theirs = g.find('p2', 'characters', V.c6);
    pick(g, [theirs]);
    expect(g.power(theirs)).toBe(4000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
  });

  it('"up to": a mode may be chosen with no target picked, and the Life card is still taken', () => {
    const g = start();
    use(g);
    option(g, '0');
    none(g);
    expect(g.life('p1')).toBe(2);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
  });

  it('is Once Per Turn', () => {
    const g = start();
    use(g);
    option(g, '0');
    none(g);
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', ID),
        ability: 'power-swing',
        player: 'p1',
      }),
    ).toBe(false);
  });

  it('is not offered with no Life cards', () => {
    const g = start({ life: [] });
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', ID),
        ability: 'power-swing',
        player: 'p1',
      }),
    ).toBe(false);
    expectDecision(g, 'main', 'p1');
  });
});

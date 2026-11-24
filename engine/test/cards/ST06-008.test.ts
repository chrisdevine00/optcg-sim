/** ST06-008 Hina. */
import { describe, expect, it } from 'vitest';
import { none, pick, play, V } from './helpers.ts';
import { canPick, mk } from './helpers-st29old.ts';

const ID = 'ST06-008';

describe('ST06-008 Hina', () => {
  it("[On Play]: gives up to 1 of your opponent's Characters -4 cost during this turn", () => {
    const g = mk({ hand: [ID] }, { characters: [V.c6, V.c5] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).cost).toBe(2);
    expect(g.card(g.find('p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('must not change power, nor target your own Characters or a Leader', () => {
    const g = mk({ hand: [ID], characters: [V.c3] }, { characters: [V.c6] });
    play(g, ID);
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });

  it('"up to 1": may give it to nothing', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c6] });
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).cost).toBe(6);
  });

  it('the reduced cost is the current cost: 4 - 4 leaves 0', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(0);
  });

  it('with no opposing Character nothing is asked', () => {
    const g = mk({ hand: [ID] });
    play(g, ID);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });
});

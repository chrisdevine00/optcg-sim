/** OP17-046 Gloriosa: [Blocker]; [On Play] place up to 1 Character with a cost of 5 or less at the bottom of its owner's deck. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_PURPLE, PURPLE, ROCKS, V } from './helpers.ts';

describe('OP17-046 Gloriosa', () => {
  it("bottom-decks an opponent's cost-5 Character; cost 6 is not offered", () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-046'], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c5, V.c6], deck: [PURPLE, PURPLE] },
    );
    play(g, 'OP17-046');
    const five = g.find('p2', 'characters', V.c5);
    expect(
      g.isLegal({ type: 'pick', choice: g.find('p2', 'characters', V.c6), player: 'p1' }),
    ).toBe(false);
    pick(g, [five]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c6]);
    expect(g.zone('p2', 'deck').map((c) => c.card)).toEqual([PURPLE, PURPLE, V.c5]);
    expect(g.card(g.find('p1', 'characters', 'OP17-046')).keywords).toContain('Blocker');
  });

  it('"up to": choosing none moves nothing', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-046'], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c3] },
    );
    play(g, 'OP17-046');
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});

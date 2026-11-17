/** OP06-058 Gravity Blade Raging Tiger. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { damageGame, HANCOCK } from './helpers-hancock-rosi.ts';

describe('OP06-058 Gravity Blade Raging Tiger', () => {
  const start = () => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP06-058'],
        characters: [V.c5],
        costArea: { active: 7, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c6, V.c7, V.c1] },
    );
    play(g, 'OP06-058');
    return g;
  };

  it('[Main] places up to 2 Characters with a cost of 6 or less (either side) at the bottom of their owners decks', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    // Yours (5), and the opponent's 6 and 1: three candidates; the 7-cost one is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    const mine = g.find('p1', 'characters', V.c5);
    const theirs = g.find('p2', 'characters', V.c6);
    pick(g, [mine, theirs]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7, V.c1]);
    // Each went to the bottom of its owner's deck (not to the player who used the card).
    expect(g.zone('p1', 'deck').at(-1)!.card).toBe(V.c5);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(V.c6);
    expect(g.zone('p2', 'deck')).toHaveLength(11);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
  });

  it('may choose fewer, or none', () => {
    const g = start();
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    const h = start();
    none(h);
    expect(h.zone('p2', 'characters')).toHaveLength(3);
  });

  it('[Trigger] places up to 1 Character with a cost of 5 or less at the bottom of the owner deck', () => {
    const g = damageGame(
      'OP06-058',
      { leader: HANCOCK, life: ['OP06-058', PURPLE] },
      { characters: [V.c5, V.c6] },
    );
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // Only the 5-cost Character: the 6- and 7-cost ones are too expensive.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(V.c5);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7, V.c6]);
  });
});

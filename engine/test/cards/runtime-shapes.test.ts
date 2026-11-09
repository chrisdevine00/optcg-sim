/** The runtime honours each implemented `move` destination (M4a-07). */
import { describe, expect, it } from 'vitest';
import type { Ability } from '../../src/testing.ts';
import { withAbilities } from '../../src/testing.ts';
import { BLUE, game, pick, PLAIN_PURPLE, ROCKS } from './helpers.ts';

const moveTo = (position: 'top' | 'bottom'): Ability => ({
  id: 'probe',
  kind: 'activate',
  when: 'activateMain',
  effect: [
    {
      do: {
        move: {
          what: { from: 'trash', owner: 'you', pick: { upTo: 1 } },
          to: { zone: 'deck', position },
        },
      },
    },
  ],
});

describe('move from the trash to the deck', () => {
  it.each(['top', 'bottom'] as const)('honours position %s', (position) => {
    const g = game(
      { leader: ROCKS, characters: [BLUE], trash: ['OP17-045'], deck: [BLUE, BLUE, BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.state = withAbilities(g.state, BLUE, [moveTo(position)]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'probe' });
    pick(g, [g.find('p1', 'trash', 'OP17-045')]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(position === 'top' ? deck[0] : deck.at(-1)).toBe('OP17-045');
    expect(g.eventsOfType('Anomaly')).toEqual([]);
  });
});

describe('the runtime refuses a deck-top move it does not implement (M4a-07)', () => {
  const fromDeckTop = (to: { zone: 'trash' | 'life'; position?: 'top' }): Ability => ({
    id: 'probe',
    kind: 'activate',
    when: 'activateMain',
    effect: [{ do: { move: { what: { from: 'deckTop', owner: 'you' }, to } } }],
  });

  it('"trash the top card" does not add a Life card; it is an Anomaly and changes nothing', () => {
    const g = game(
      { leader: ROCKS, characters: [BLUE], deck: [BLUE, BLUE, BLUE], life: [BLUE, BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.state = withAbilities(g.state, BLUE, [fromDeckTop({ zone: 'trash' })]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'probe' });
    expect(g.eventsOfType('Anomaly')).toHaveLength(1);
    expect(g.zone('p1', 'life')).toHaveLength(2);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('a deck-top to Life move still works', () => {
    const g = game(
      { leader: ROCKS, characters: [BLUE], deck: [BLUE, BLUE, BLUE], life: [BLUE, BLUE] },
      { leader: PLAIN_PURPLE },
    );
    g.state = withAbilities(g.state, BLUE, [fromDeckTop({ zone: 'life', position: 'top' })]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'probe' });
    g.act({ type: 'optional', accept: true });
    expect(g.eventsOfType('Anomaly')).toEqual([]);
    expect(g.zone('p1', 'life')).toHaveLength(3);
  });
});

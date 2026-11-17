/**
 * M4b wave 1: hidden information stays hidden under the new shapes (ARCHITECTURE §2.7, CR 3-1-4,
 * 11-3). A card that moves between secret areas (deck, hand, Life) is not named in the opponent's
 * events; a card that becomes public (turned face-up, trashed, revealed) is.
 */
import { describe, expect, it } from 'vitest';
import { project, projectEvents, type GameEvent } from '@optcg/engine';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { BLUE, game, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';

const names = (events: GameEvent[]): string => JSON.stringify(events);

describe('projection of the new shapes', () => {
  it('look at 3, one to Life, trash the rest: the card put in Life is not named, the trashed ones are', () => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [BLUE], deck: [V.c1, V.c2, V.c3, V.c4], life: [V.c6] },
      { leader: PLAIN_BLUE },
    );
    const ab: Ability = {
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      effect: [
        {
          do: {
            lookAtTop: { n: 3, take: [{ pick: { upTo: 1 }, to: 'lifeTop' }], rest: 'trash' },
          },
        },
      ],
    };
    g.state = withAbilities(g.state, BLUE, [ab]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
    pick(g, [g.find('p1', 'deck', V.c2)]);
    const seen = names(projectEvents(g.events, 'p2'));
    expect(seen).not.toContain(V.c2);
    expect(seen).toContain(V.c1);
    expect(seen).toContain(V.c3);
    expect(names(projectEvents(g.events, 'p1'))).not.toContain(V.c2);
    // The opponent's view of the board never names the Life card either.
    expect(JSON.stringify(project(g.state, 'p2').zones.p1.life)).not.toContain(V.c2);
  });

  it('Life to hand and hand to Life are private moves; trash to Life face-up is public', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        characters: [BLUE],
        hand: [V.c5],
        trash: [V.c7],
        life: [V.c4, V.c3],
      },
      { leader: PLAIN_BLUE },
    );
    const ab: Ability = {
      id: 'a',
      kind: 'activate',
      when: 'activateMain',
      cost: [{ lifeToHand: { from: 'top', n: 1 } }],
      effect: [
        {
          do: {
            move: {
              what: { from: 'hand', owner: 'you', filter: { name: 'Babanuki' }, pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
        {
          do: {
            move: {
              what: { from: 'trash', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top', faceUp: true },
            },
          },
        },
      ],
    };
    g.state = withAbilities(g.state, BLUE, [ab]);
    g.act({ type: 'activate', card: g.find('p1', 'characters', BLUE), ability: 'a' });
    pick(g, [g.find('p1', 'hand', V.c5)]);
    pick(g, [g.find('p1', 'trash', V.c7)]);
    const seen = names(projectEvents(g.events, 'p2'));
    expect(seen).not.toContain(V.c4); // the Life card taken into the hand
    expect(seen).not.toContain(V.c5); // the hand card put into Life
    expect(seen).toContain(V.c7); // turned up on purpose
    const life = project(g.state, 'p2').zones.p1.life.map((c) => c.card);
    // Top: the card turned up. Then the hand card (face-down) and the one Life card left (face-down).
    expect(life).toEqual([V.c7, null, null]);
  });
});

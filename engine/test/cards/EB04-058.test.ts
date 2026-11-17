/** EB04-058 Borsalino: [Blocker]; [On Play] with 2 or less Life, add 1 card from your deck to your Life. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  PLAIN_BLUE,
  play,
  PURPLE,
  ROCKS,
} from './helpers.ts';
import { ENEL, ids } from './helpers-robin.ts';

describe('EB04-058 Borsalino', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: ENEL, characters: ['EB04-058'] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', 'EB04-058')).keywords).toContain('Blocker');
  });

  it('[On Play] with 2 Life: the top card of the deck goes on top of the Life', () => {
    const g = game(
      {
        leader: ENEL,
        hand: ['EB04-058'],
        life: [BLUE, BLUE],
        deck: [PURPLE, BLUE, BLUE],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-058');
    accept(g); // "up to 1": add the top card
    expect(ids(g, 'p1', 'life')).toEqual([PURPLE, BLUE, BLUE]);
    expect(ids(g, 'p1', 'deck')).toEqual([BLUE, BLUE]);
  });

  it('[On Play] with 3 Life: nothing is added', () => {
    const g = game(
      { leader: ENEL, hand: ['EB04-058'], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-058');
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
    expectDecision(g, 'main', 'p1');
  });

  it('[On Play] with 0 Life: adds a card (0 is 2 or less)', () => {
    const g = game(
      { leader: ROCKS, hand: ['EB04-058'], life: [], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-058');
    accept(g);
    expect(g.life('p1')).toBe(1);
  });

  it('[On Play] "up to 1" may add nothing', () => {
    const g = game(
      { leader: ENEL, hand: ['EB04-058'], life: [BLUE], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-058');
    decline(g);
    expect(g.life('p1')).toBe(1);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });
});

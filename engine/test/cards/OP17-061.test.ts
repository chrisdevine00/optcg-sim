/** OP17-061 Lead Performers. */
import { describe, expect, it } from 'vitest';
import { accept, don, game, KAIDO, payDon, pick, play, PLAIN_BLUE, PURPLE } from './helpers.ts';

describe('OP17-061 Lead Performers', () => {
  it('[On Play] DON!! −1: add the top card of the deck to the top of Life', () => {
    const g = game(
      {
        leader: KAIDO,
        hand: ['OP17-061'],
        deck: ['EB04-031', PURPLE],
        costArea: { active: 10, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-061');
    accept(g);
    payDon(g);
    accept(g); // "up to 1": yes
    expect(g.zone('p1', 'life').map((c) => c.card)[0]).toBe('EB04-031');
    expect(g.zone('p1', 'life')).toHaveLength(4);
    expect(don(g, 'p1').deck).toBe(1);
  });

  it('[Activate: Main] trash this Character: play [King], [Queen] or [Jack] from hand without paying', () => {
    const g = game(
      { leader: KAIDO, characters: ['OP17-061'], hand: ['EB04-031', PURPLE] },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'OP17-061'), ability: 'swap' });
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', 'EB04-031')]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['EB04-031']);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP17-061']);
  });
});

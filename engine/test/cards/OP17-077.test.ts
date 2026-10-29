/** OP17-077 Kundali Dragon Swarm. */
import { describe, expect, it } from 'vitest';
import { don, game, KAIDO, passBlock, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';

describe('OP17-077 Kundali Dragon Swarm', () => {
  it('[Main] rest 3 DON!! and trash 2: add 3 rested DON!!', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-077', PURPLE, V.c1], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP17-077');
    pick(g, [g.find('p1', 'hand', PURPLE), g.find('p1', 'hand', V.c1)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 7, deck: 3 });
  });

  it('[Main] is not playable with only 1 other card in hand', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-077', PURPLE], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    const ev = g.find('p1', 'hand', 'OP17-077');
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === ev)).toBe(false);
  });

  it('[Counter] DON!! −1: Leader +4000', () => {
    const g = game(
      { leader: KAIDO, hand: ['OP17-077'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'optional', accept: false });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-077'), ability: 'counter' });
    if (g.legal().some((a) => a.type === 'pick')) g.act(g.legal().find((a) => a.type === 'pick')!);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });
});

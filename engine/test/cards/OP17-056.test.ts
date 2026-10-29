/** OP17-056 Rocks Pirates (Event). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  expectDecision,
  game,
  hand,
  passBlock,
  pick,
  play,
  PLAIN_PURPLE,
  ROCKS,
  V,
} from './helpers.ts';

describe('OP17-056 Rocks Pirates', () => {
  it("[Main] rest 5 DON!!: return a cost 6 or less Character to its owner's hand", () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-056'], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c6, V.c7] },
    );
    play(g, 'OP17-056');
    accept(g); // the "you may" activation cost (CR 8-3-1-4)
    expect(
      g.isLegal({ type: 'pick', choice: g.find('p2', 'characters', V.c7), player: 'p1' }),
    ).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(hand(g, 'p2')).toEqual([V.c6]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP17-056']);
  });

  it('CR 8-3-1-4 (B-1): with fewer than 5 active DON!! it may still be played, for no effect', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-056'], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
    );
    play(g, 'OP17-056');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    g.act({ type: 'optional', accept: false });
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP17-056']);
  });

  it('[Counter]: +2000 to a "Rocks Pirates" Character during this battle', () => {
    const g = game(
      { leader: ROCKS, hand: ['OP17-056'], characters: [{ card: 'OP17-045', rested: true }] },
      { leader: PLAIN_PURPLE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    const kyo = g.find('p1', 'characters', 'OP17-045');
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: kyo });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP17-056'), ability: 'counter' });
    pick(g, [kyo]);
    expect(g.power(kyo)).toBe(6000);
    expectDecision(g, 'counter');
  });
});

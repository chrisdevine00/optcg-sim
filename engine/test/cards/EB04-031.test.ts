/** EB04-031 King. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  don,
  endCounter,
  expectDecision,
  game,
  KAIDO,
  passBlock,
  PLAIN_BLUE,
  V,
} from './helpers.ts';

describe('EB04-031 King', () => {
  it('[Activate: Main] adds 1 active and 1 rested DON!!, once per turn', () => {
    const g = game({ leader: KAIDO, characters: ['EB04-031'] }, { leader: PLAIN_BLUE });
    const king = g.find('p1', 'characters', 'EB04-031');
    g.act({ type: 'activate', card: king, ability: 'ramp' });
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, deck: 8 });
    expect(g.isLegal({ type: 'activate', card: king, ability: 'ramp', player: 'p1' })).toBe(false);
  });

  it('with another [King] Character nothing is added', () => {
    const g = game({ leader: KAIDO, characters: ['EB04-031', 'EB04-031'] }, { leader: PLAIN_BLUE });
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'EB04-031'), ability: 'ramp' });
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it("a battle K.O. can be replaced by returning 1 DON!!; declining lets it be K.O.'d", () => {
    const setup = () =>
      game(
        {
          leader: KAIDO,
          characters: [{ card: 'EB04-031', rested: true }],
          costArea: { active: 0, rested: 1 },
        },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
    for (const yes of [true, false]) {
      const g = setup();
      const king = g.find('p1', 'characters', 'EB04-031');
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: king });
      g.act({ type: 'optional', accept: false }); // the Leader's ability
      passBlock(g);
      endCounter(g);
      expectDecision(g, 'optional', 'p1');
      if (yes) accept(g);
      else g.act({ type: 'optional', accept: false });
      expect(g.zone('p1', 'characters')).toHaveLength(yes ? 1 : 0);
      expect(don(g, 'p1').deck).toBe(yes ? 10 : 9);
    }
  });
});

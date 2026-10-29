/** EB04-032 Queen. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  don,
  expectDecision,
  game,
  hand,
  KAIDO,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';

describe('EB04-032 Queen', () => {
  it('[On Play] trash 1 {Animal Kingdom Pirates} card: draw 2', () => {
    const g = game(
      {
        leader: KAIDO,
        hand: ['EB04-032', V.c6, PURPLE],
        deck: [PURPLE, PURPLE, PURPLE],
        costArea: { active: 1, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-032');
    accept(g);
    // Only the AKP card (OP01-110) can pay.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', V.c6)]);
    expect(hand(g, 'p1')).toEqual([PURPLE, PURPLE, PURPLE]);
  });

  it('[Activate: Main] rest 2 DON!!: add 1 rested DON!!', () => {
    const g = game(
      { leader: KAIDO, characters: ['EB04-032'], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'activate', card: g.find('p1', 'characters', 'EB04-032'), ability: 'ramp' });
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3, deck: 7 });
  });

  it('a hand with no {Animal Kingdom Pirates} card cannot pay the [On Play] cost', () => {
    const g = game(
      { leader: KAIDO, hand: ['EB04-032', PURPLE], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'EB04-032');
    expectDecision(g, 'optional');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });
});

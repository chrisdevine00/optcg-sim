/** OP08-109 Mont Blanc Noland: with a {Shandian Warrior} Leader and a [Kalgara] Character, deck top to Life. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  game,
  PLAIN_PURPLE,
  play,
  PLAIN_BLUE,
  V,
  expectDecision,
} from './helpers.ts';
import { ids, KAL, KALGARA_V, NOLAND } from './helpers-kalgara.ts';

describe('OP08-109 Mont Blanc Noland', () => {
  it('[On Play] adds the top card of the deck to the top of Life', () => {
    const g = game(
      {
        leader: KAL,
        hand: [NOLAND],
        characters: [KALGARA_V],
        deck: [V.c4, BLUE],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, NOLAND);
    accept(g); // "up to 1"
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c4);
    expect(ids(g.zone('p1', 'deck'))).toEqual([BLUE]);
  });

  it('"up to 1": may decline', () => {
    const g = game(
      {
        leader: KAL,
        hand: [NOLAND],
        characters: [KALGARA_V],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, NOLAND);
    expectDecision(g, 'optional', 'p1');
    g.act({ type: 'optional', accept: false });
    expect(g.life('p1')).toBe(3);
  });

  it('does nothing without a [Kalgara] Character', () => {
    const g = game(
      { leader: KAL, hand: [NOLAND], characters: [V.c1], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, NOLAND);
    expect(g.life('p1')).toBe(3);
    expectDecision(g, 'main', 'p1');
  });

  it('does nothing when the Leader is not a {Shandian Warrior}', () => {
    const g = game(
      {
        leader: PLAIN_PURPLE,
        hand: [NOLAND],
        characters: [KALGARA_V],
        costArea: { active: 5, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
    play(g, NOLAND);
    expect(g.life('p1')).toBe(3);
    expectDecision(g, 'main', 'p1');
  });

  it('Noland itself is not a [Kalgara]', () => {
    const g = game(
      { leader: KAL, hand: [NOLAND], costArea: { active: 5, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, NOLAND);
    expect(g.life('p1')).toBe(3);
  });
});

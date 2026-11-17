/** OP16-077 "Buddha" Sengoku. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { NAVY1, NAVY4, orderAll, ROSI } from './helpers-hancock-rosi.ts';

describe('OP16-077 "Buddha" Sengoku', () => {
  const deck = [NAVY1, V.c1, NAVY4, PURPLE, BLUE, BLUE, BLUE];
  const start = () => {
    const g = game(
      { leader: ROSI, hand: ['OP16-077', BLUE], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP16-077');
    return g;
  };

  it('[Main] reveals up to 2 {Navy} cards to hand, the rest to the bottom, then trashes 1', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', NAVY1), g.find('p1', 'deck', NAVY4)]);
    orderAll(g);
    // Hand: BLUE (kept from before) + 2 Navy cards; 1 trashed of the player's choosing.
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1').sort()).toEqual([NAVY1, NAVY4].sort());
    expect(trash(g, 'p1')).toEqual([BLUE, 'OP16-077']);
    expect(
      g
        .eventsOfType('CardRevealed')
        .map((e) => e.card)
        .filter((c) => c === NAVY1 || c === NAVY4),
    ).toHaveLength(2);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('may take 1, or none, and the trash still happens', () => {
    const g = start();
    pick(g, [g.find('p1', 'deck', NAVY4)]);
    orderAll(g);
    pick(g, [g.find('p1', 'hand', NAVY4)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    const h = start();
    none(h);
    orderAll(h);
    pick(h, [h.find('p1', 'hand', BLUE)]);
    expect(hand(h, 'p1')).toEqual([]);
  });
});

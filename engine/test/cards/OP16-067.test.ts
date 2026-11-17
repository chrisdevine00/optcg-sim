/** OP16-067 Tsuru. */
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

describe('OP16-067 Tsuru', () => {
  const deck = [V.c1, NAVY1, NAVY4, PURPLE, BLUE, BLUE, BLUE];
  const start = (handCards: string[] = []) => {
    const g = game(
      { leader: ROSI, hand: ['OP16-067', ...handCards], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP16-067');
    return g;
  };

  it('[On Play] takes a {Navy} card, bottoms the rest, then trashes 1 card from hand', () => {
    const g = start();
    pick(g, [g.find('p1', 'deck', NAVY1)]);
    orderAll(g);
    // The added card is the only card in hand, so it is the one trashed (exactly 1).
    pick(g, [g.find('p1', 'hand', NAVY1)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([NAVY1]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });

  it('chooses which card to trash when the hand has several', () => {
    const g = start([PURPLE]);
    pick(g, [g.find('p1', 'deck', NAVY4)]);
    orderAll(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([NAVY4]);
    expect(trash(g, 'p1')).toEqual([PURPLE]);
  });

  it('with nothing taken the trash still happens ("Then", CR 4-10-2)', () => {
    const g = start([PURPLE]);
    none(g);
    orderAll(g);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(hand(g, 'p1')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([PURPLE]);
  });
});

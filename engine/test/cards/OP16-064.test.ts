/** OP16-064 Koby. */
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
  V,
} from './helpers.ts';
import { NAVY1, NAVY4, orderAll, ROSI } from './helpers-hancock-rosi.ts';

describe('OP16-064 Koby', () => {
  const deck = [V.c1, NAVY1, 'OP16-064', NAVY4, PURPLE, BLUE, BLUE];
  const start = () => {
    const g = game(
      { leader: ROSI, hand: ['OP16-064'], deck, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, 'OP16-064');
    return g;
  };

  it('[On Play] looks at 5, reveals a {Navy} card other than [Koby] to hand, the rest to the bottom', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    // Only Komille and Komei are offered: not the vanilla, not the second Koby.
    const offered = g.legal().filter((a) => a.type === 'pick');
    expect(offered).toHaveLength(2);
    const koby = g.find('p1', 'deck', 'OP16-064');
    expect(offered.some((a) => a.type === 'pick' && a.choice === koby)).toBe(false);
    pick(g, [g.find('p1', 'deck', NAVY4)]);
    expect(hand(g, 'p1')).toEqual([NAVY4]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(NAVY4);
    orderAll(g);
    expectDecision(g, 'main', 'p1');
    const left = g.zone('p1', 'deck').map((c) => c.card);
    expect(left.slice(0, 2)).toEqual([BLUE, BLUE]);
    expect(left.slice(2).sort()).toEqual([V.c1, NAVY1, 'OP16-064', PURPLE].sort());
  });

  it('may take nothing even with a match (CR 8-4-4-2); all five go to the bottom', () => {
    const g = start();
    none(g);
    orderAll(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(
      g
        .zone('p1', 'deck')
        .slice(0, 2)
        .map((c) => c.card),
    ).toEqual([BLUE, BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
  });
});

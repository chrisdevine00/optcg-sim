/** ST22-001 Ace & Newgate (Leader). */
import { describe, expect, it } from 'vitest';
import { dec, hand, pick } from './helpers.ts';
import {
  activateAb,
  ALLY1,
  canActivate,
  choices,
  deckOf,
  FORMER3,
  mk,
  V,
  WB4,
  WB5,
} from './helpers-lfb.ts';

const ID = 'ST22-001';

describe('ST22-001 Ace & Newgate', () => {
  const start = (handCards: string[] = [WB4, V.c1]) =>
    mk({ leader: ID, hand: handCards as never, deck: [V.c2, V.c3, V.c4] });
  const leader = (g: ReturnType<typeof start>) => g.leader('p1');

  it('[Activate: Main] [Once Per Turn]: reveal a {Whitebeard Pirates} card, draw 1 and place the revealed card on top of the deck', () => {
    const g = start();
    activateAb(g, leader(g), 'swap');
    // Only the {Whitebeard Pirates} card can be revealed.
    expect(choices(g)).toEqual([g.find('p1', 'hand', WB4)]);
    pick(g, [g.find('p1', 'hand', WB4)]);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: WB4, player: 'p1' });
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(deckOf(g, 'p1')).toEqual([WB4, V.c3, V.c4]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('places the card that was revealed, not another {Whitebeard Pirates} card in hand', () => {
    const g = start([WB4, WB5, V.c1]);
    activateAb(g, leader(g), 'swap');
    pick(g, [g.find('p1', 'hand', WB5)]);
    expect(deckOf(g, 'p1')[0]).toBe(WB5);
    expect(hand(g, 'p1')).toEqual([WB4, V.c1, V.c2]);
  });

  it('is Once Per Turn', () => {
    const g = start([WB4, WB5, V.c1]);
    activateAb(g, leader(g), 'swap');
    pick(g, [g.find('p1', 'hand', WB4)]);
    expect(canActivate(g, leader(g), 'swap')).toBe(false);
  });

  it('a type that merely includes "Whitebeard Pirates" pays (Allies, Former); other cards do not', () => {
    const g = start([ALLY1, FORMER3, V.c1]);
    activateAb(g, leader(g), 'swap');
    expect(choices(g).sort()).toEqual(
      [g.find('p1', 'hand', ALLY1), g.find('p1', 'hand', FORMER3)].sort(),
    );
  });

  it('must not fire: not offered with no {Whitebeard Pirates} card in hand', () => {
    const g = start([V.c1, V.c2]);
    expect(canActivate(g, leader(g), 'swap')).toBe(false);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });
});

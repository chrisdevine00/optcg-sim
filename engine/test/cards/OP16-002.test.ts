/** OP16-002 Izo. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, hand, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAccept, offers, RED_LEADER, WB7, WB8, WB9 } from './helpers-op16g1.ts';

const ID = 'OP16-002';

describe('OP16-002 Izo', () => {
  const start = (extra: string[]) =>
    game(
      { leader: RED_LEADER, hand: [ID, ...extra], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: reveal a Character card with 8000 power from your hand: draw 1 card', () => {
    const g = start([WB8, V.c1]);
    play(g, ID);
    accept(g);
    const eight = g.find('p1', 'hand', WB8);
    expect(offers(g, eight)).toBe(true);
    expect(offers(g, g.find('p1', 'hand', V.c1))).toBe(false);
    pick(g, [eight]);
    // The revealed card stays in hand; one card drawn.
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(hand(g, 'p1')).toContain(WB8);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(WB8);
  });

  it('the power must be exactly 8000: 7000 and 9000 Characters cannot be revealed', () => {
    const g = start([WB7, WB9]);
    play(g, ID);
    expect(canAccept(g)).toBe(false);
    expect(hand(g, 'p1')).toHaveLength(2);
  });

  it('declining draws nothing', () => {
    const g = start([WB8]);
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([WB8]);
  });
});

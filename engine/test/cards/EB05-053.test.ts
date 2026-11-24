/** EB05-053 Charlotte Praline: [When Attacking] [Once Per Turn] If your opponent has 9 or more cards in their hand, add up to 1 card from your hand to the top of your Life cards. [Trigger] You may trash 1 card from your hand: If you have 2 or less Life cards, play this card. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  endCounter,
  expectDecision,
  game,
  hand,
  none,
  passBlock,
  PLAIN_PURPLE,
  pick,
  times,
  PURPLE,
} from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';

const PRALINE = 'EB05-053';

describe('EB05-053 Charlotte Praline', () => {
  const attack = (oppHand: number) => {
    const g = game(
      { leader: PLAIN_PURPLE, characters: [PRALINE], hand: [BLUE, PURPLE] },
      { leader: PLAIN_PURPLE, hand: times(oppHand, BLUE) },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', PRALINE),
      target: g.leader('p2'),
    });
    return g;
  };

  it('[When Attacking] with 9 cards in the opponent hand: adds a chosen hand card to the top of your Life', () => {
    const g = attack(9);
    pick(g, [g.find('p1', 'hand', PURPLE)]);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(PURPLE);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    passBlock(g);
    endCounter(g);
  });

  it('[When Attacking] "up to 1": may add nothing', () => {
    const g = attack(10);
    none(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE]);
  });

  it('[When Attacking] does nothing with 8 cards in the opponent hand', () => {
    const g = attack(8);
    expectDecision(g, 'block', 'p2');
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([BLUE, PURPLE]);
  });

  describe('[Trigger]', () => {
    it('trash 1 card from hand: with 2 or less Life cards after the damage, plays this card', () => {
      const g = triggerHit(PRALINE, { hand: [BLUE] });
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PRALINE]);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([BLUE]);
    });

    it('with 3 Life cards left the cost is paid but the card is not played', () => {
      const g = triggerHit(PRALINE, { hand: [BLUE], life: [PRALINE, BLUE, BLUE, BLUE] });
      g.act({ type: 'trigger', activate: true });
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(BLUE);
    });

    it('not activating it adds the card to hand: nothing is trashed or played', () => {
      const g = triggerHit(PRALINE, { hand: [BLUE] });
      g.act({ type: 'trigger', activate: false });
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(hand(g, 'p1')).toEqual([BLUE, PRALINE]);
    });
  });
});

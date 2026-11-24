/** OP16-020 If You're Coming with Me... Kiss Your Lives Goodbye!! */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  hand,
  pick,
  play,
  PLAIN_BLUE,
  trash,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { canAccept, offers, RED_LEADER, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-020';

describe("OP16-020 If You're Coming with Me... Kiss Your Lives Goodbye!!", () => {
  describe('[Main]', () => {
    const start = (handCards: string[], active = 1) =>
      game(
        { leader: RED_LEADER, hand: [ID, ...handCards], costArea: { active, rested: 0 } },
        { leader: PLAIN_BLUE },
      );

    it('you may rest 1 DON!! and reveal a Character card with 8000 power from your hand: draw 1 card', () => {
      const g = start([WB8, V.c1]);
      play(g, ID);
      accept(g);
      expect(offers(g, g.find('p1', 'hand', WB8))).toBe(true);
      expect(offers(g, g.find('p1', 'hand', V.c1))).toBe(false);
      pick(g, [g.find('p1', 'hand', WB8)]);
      // The Event is trashed after its effect; the revealed card stays; 1 card drawn.
      expect(hand(g, 'p1')).toHaveLength(3);
      expect(hand(g, 'p1')).toContain(WB8);
      expect(don(g, 'p1').rested).toBe(1);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(WB8);
    });

    it('declining the cost draws nothing and rests nothing (the Event is still played)', () => {
      const g = start([WB8]);
      play(g, ID);
      decline(g);
      expect(hand(g, 'p1')).toEqual([WB8]);
      expect(don(g, 'p1').rested).toBe(0);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('cannot be paid with a 7000 power Character, nor with no active DON!!', () => {
      const g = start([WB7]);
      play(g, ID);
      expect(canAccept(g)).toBe(false);
      const g2 = start([WB8], 0);
      play(g2, ID);
      expect(canAccept(g2)).toBe(false);
    });
  });

  describe('[Counter]', () => {
    it('you may trash 1 card from your hand: up to 1 of your Leader or Character cards gains +3000 power during this battle', () => {
      const g = counterStep({ leader: RED_LEADER, hand: [ID, V.c1], characters: [V.c3] }, {}, V.c5);
      useCounter(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      // Leader or Character are offered as the target.
      expect(offers(g, g.leader('p1'))).toBe(true);
      expect(offers(g, g.find('p1', 'characters', V.c3))).toBe(true);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
      expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
      endCounter(g);
      expect(g.life('p1')).toBe(3); // 8000 beats the 7000 attacker
      expect(g.power(g.leader('p1'))).toBe(5000); // only during this battle
      expect(trash(g, 'p1').sort()).toEqual([ID, V.c1].sort());
    });

    it('declining the cost gives no power', () => {
      const g = counterStep({ leader: RED_LEADER, hand: [ID, V.c1] }, {}, V.c5);
      useCounter(g, ID);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expectDecision(g, 'counter', 'p1');
    });
  });
});

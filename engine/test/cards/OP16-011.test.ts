/** OP16-011 Vista. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import {
  canAccept,
  idsIn,
  offers,
  P2000_A,
  P2000_B,
  RED_LEADER,
  WB7,
  WB8,
} from './helpers-op16g1.ts';

const ID = 'OP16-011';

describe('OP16-011 Vista', () => {
  describe('[On Play]', () => {
    const start = (handCards: string[]) =>
      game(
        { leader: RED_LEADER, hand: [ID, ...handCards], costArea: { active: 6, rested: 0 } },
        { leader: PLAIN_BLUE },
      );

    it('reveal a Character card with 8000 power from your hand: draw 1 card', () => {
      const g = start([WB8]);
      play(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', WB8)]);
      expect(hand(g, 'p1')).toHaveLength(2);
      expect(hand(g, 'p1')).toContain(WB8);
    });

    it('cannot be paid with a 7000 power Character, and may be declined', () => {
      const g = start([WB7]);
      play(g, ID);
      expect(canAccept(g)).toBe(false);
      const g2 = start([WB8]);
      play(g2, ID);
      decline(g2);
      expect(hand(g2, 'p1')).toEqual([WB8]);
    });
  });

  describe('[DON!! x1] [When Attacking]', () => {
    const start = (don: number) =>
      game(
        { leader: RED_LEADER, characters: [{ card: ID, don }], costArea: { active: 1, rested: 0 } },
        // Two 2000 base power Characters and a 3000 one.
        { leader: PLAIN_BLUE, characters: [P2000_A, P2000_B, V.c1] },
      );
    const attack = (g: ReturnType<typeof start>) =>
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

    it("K.O. up to 2 of your opponent's Characters with 2000 base power or less", () => {
      const g = start(1);
      attack(g);
      expect(offers(g, g.find('p2', 'characters', V.c1))).toBe(false);
      pick(g, [g.find('p2', 'characters', P2000_A), g.find('p2', 'characters', P2000_B)]);
      expect(idsIn(g, 'p2', 'characters')).toEqual([V.c1]);
      expect(idsIn(g, 'p2', 'trash').sort()).toEqual([P2000_A, P2000_B].sort());
    });

    it('"up to 2": one or none may be chosen', () => {
      const g = start(1);
      attack(g);
      pick(g, [g.find('p2', 'characters', P2000_A)]);
      expect(idsIn(g, 'p2', 'characters')).toHaveLength(2);
      const g2 = start(1);
      attack(g2);
      none(g2);
      expect(idsIn(g2, 'p2', 'characters')).toHaveLength(3);
    });

    it('without a DON!! given the attack has no K.O.', () => {
      const g = start(0);
      attack(g);
      expectDecision(g, 'block', 'p2');
      expect(idsIn(g, 'p2', 'characters')).toHaveLength(3);
    });
  });
});

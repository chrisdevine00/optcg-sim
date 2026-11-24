/** EB05-046 Yamato: if your opponent has a Character with 8000 base power or more, gains [Blocker] and +3000 power. [On Your Opponent's Attack] You may trash 1 card from your hand: If you have 10 or more cards in your trash, your Leader's base power becomes 7000 during this turn. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  times,
  V,
} from './helpers.ts';

const YAMATO = 'EB05-046';

describe('EB05-046 Yamato', () => {
  describe('static: [Blocker] and +3000 power against an 8000 base power Character', () => {
    const board = (opp: string[]) => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [YAMATO] },
        { leader: PLAIN_BLUE, characters: opp },
      );
      return g.card(g.find('p1', 'characters', YAMATO));
    };

    it('applies when the opponent has a Character with 8000 base power or more', () => {
      const y = board([V.c6]);
      expect(y.keywords).toContain('Blocker');
      expect(y.power).toBe(8000);
    });

    it('does not apply with only 7000 base power Characters', () => {
      const y = board([V.c5]);
      expect(y.keywords).not.toContain('Blocker');
      expect(y.power).toBe(5000);
    });

    it('does not apply with no opposing Characters', () => {
      const y = board([]);
      expect(y.keywords).not.toContain('Blocker');
      expect(y.power).toBe(5000);
    });
  });

  describe("[On Your Opponent's Attack]", () => {
    /** p2's 7000 Character attacks p1's Leader; p1 has `trashSize` cards in the trash and BLUE in hand. */
    const attacked = (trashSize: number) => {
      const g = game(
        {
          leader: PLAIN_PURPLE,
          characters: [YAMATO],
          hand: [BLUE],
          trash: times(trashSize, V.c1),
        },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      return g;
    };

    it('with 10 or more cards in the trash after paying: the Leader base power becomes 7000 this turn', () => {
      const g = attacked(9);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      // 9 + the trashed card = 10.
      expect(g.zone('p1', 'trash')).toHaveLength(10);
      expect(g.power(g.leader('p1'))).toBe(7000);
    });

    it('with 9 cards in the trash after paying: the cost is paid but the power does not change', () => {
      const g = attacked(8);
      accept(g);
      pick(g, [g.find('p1', 'hand', BLUE)]);
      expect(g.zone('p1', 'trash')).toHaveLength(9);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('may be declined: nothing is trashed', () => {
      const g = attacked(12);
      decline(g);
      expect(hand(g, 'p1')).toEqual([BLUE]);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('cannot be paid with an empty hand', () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [YAMATO], trash: times(12, V.c1) },
        { leader: PLAIN_BLUE, characters: [V.c7] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });
});

/** OP14-041 Boa Hancock (Leader). RL-47, QA-OP14 OP14-041 (two rows), QA-GR. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  hand,
  play,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { battle, damageGame, HANCOCK, KUJA, LILY, MONET, WARLORD } from './helpers-hancock-rosi.ts';

describe('OP14-041 Boa Hancock', () => {
  describe("[Opponent's Turn] When you play a Character, draw 1 card", () => {
    it("draws 1 when a Character is played during your opponent's turn (a [Trigger] play), and the draw is mandatory", () => {
      const g = damageGame('OP14-105', { leader: HANCOCK, deck: [BLUE, BLUE] });
      expect(hand(g, 'p1')).toEqual([]);
      g.act({ type: 'trigger', activate: true });
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP14-105']);
      expect(hand(g, 'p1')).toEqual([BLUE]);
      expectDecision(g, 'main', 'p2');
    });

    it('draws nothing on your own turn', () => {
      const g = game(
        { leader: HANCOCK, hand: [V.c1], deck: [BLUE, BLUE], costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      play(g, V.c1);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('does not draw when the opponent plays a Character', () => {
      const g = game(
        { leader: HANCOCK, deck: [BLUE, BLUE] },
        { leader: PLAIN_BLUE, hand: [V.c1], costArea: { active: 1, rested: 0 } },
        { turn: 4, activePlayer: 'p2' },
      );
      play(g, V.c1);
      // The opponent playing on their own turn is not "you" playing.
      expect(hand(g, 'p1')).toEqual([]);
    });
  });

  describe('[DON!! x1] [Once Per Turn] a K.O. of your Kuja/Amazon Lily Character with 5000 base power or more', () => {
    /** p2 attacks `target` (rested) with the 9000 Character; p2 has 3 Life, the top one with a [Trigger]. */
    const ko = (target: string, don = 1, extra: { rested: boolean; card: string }[] = []) => {
      const g = game(
        {
          leader: { card: HANCOCK, don },
          characters: [{ card: target, rested: true }, ...extra],
          costArea: { active: 0, rested: 0 },
        },
        {
          leader: PLAIN_BLUE,
          characters: [V.c7, V.c7],
          life: [MONET, PURPLE, PURPLE],
        },
        { turn: 4, activePlayer: 'p2' },
      );
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', target));
      return g;
    };

    it("adds up to 1 card from the top of your opponent's Life cards to its owner's hand; no [Trigger]", () => {
      const g = ko(KUJA);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.life('p2')).toBe(2);
      expect(hand(g, 'p2')).toEqual([MONET]);
      expectDecision(g, 'main', 'p2');
    });

    it('also applies to an {Amazon Lily} Character', () => {
      const g = ko(LILY);
      expectDecision(g, 'optional', 'p1');
    });

    it('a {Amazon Lily} Character with 4000 base power (below 5000) does not trigger it', () => {
      const g = ko('OP08-041');
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.life('p2')).toBe(3);
    });

    it('is "up to 1": it can be declined', () => {
      const g = ko(KUJA);
      decline(g);
      expect(g.life('p2')).toBe(3);
      expect(hand(g, 'p2')).toEqual([]);
    });

    it('needs 1 DON!! given to the Leader', () => {
      const g = ko(KUJA, 0);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.life('p2')).toBe(3);
    });

    it('does not apply to other types, even with 5000 base power or more', () => {
      const g = ko(WARLORD);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.life('p2')).toBe(3);
    });

    it('is once per turn: a second K.O. the same turn does nothing', () => {
      const g = ko(KUJA, 1, [{ card: LILY, rested: true }]);
      accept(g);
      expect(g.life('p2')).toBe(2);
      battle(g, g.find('p2', 'characters', V.c7, 1), g.find('p1', 'characters', LILY));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
      expect(g.life('p2')).toBe(2);
    });
  });
});

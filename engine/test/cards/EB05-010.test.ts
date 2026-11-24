/** EB05-010 Nico Robin (Leader). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  decline,
  expectDecision,
  game,
  none,
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { battle } from './helpers-hancock-rosi.ts';

const ROBIN = 'EB05-010';
/** Wisdom vanillas: Genzo 4000, Merry 3000, Thatch 8000; Wisdom with [Blocker]: Gloriosa 1000. */
const GENZO = 'OP03-046';
const MERRY = 'OP03-052';
const THATCH = 'OP02-007';
const GLORIOSA = 'OP17-046';

describe('EB05-010 Nico Robin', () => {
  describe("[Once Per Turn] When one of your Wisdom Characters without [Blocker] is K.O.'d", () => {
    /** p2's 9000 Character attacks p1's rested `target`; p2's attacker count can be raised. */
    const ko = (chars: (string | { card: string; rested: boolean })[], attackers = 1) => {
      const g = game(
        {
          leader: ROBIN,
          characters: chars,
          deck: [V.c1, V.c2, V.c3, V.c4],
          life: [BLUE, BLUE, BLUE, BLUE],
        },
        { leader: PLAIN_BLUE, characters: Array.from({ length: attackers }, () => V.c7) },
        { turn: 4, activePlayer: 'p2' },
      );
      return g;
    };
    const rested = (c: string) => ({ card: c, rested: true });

    it('adds up to 1 card from the top of your deck to the top of your Life cards', () => {
      const g = ko([rested(GENZO)]);
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', GENZO));
      accept(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.life('p1')).toBe(5);
      expect(g.zone('p1', 'deck')).toHaveLength(3);
      // The deck's top card (V.c1) went on top of Life.
      expect(g.zone('p1', 'life')[0]!.card).toBe(V.c1);
    });

    it('"up to 1": the card may be declined', () => {
      const g = ko([rested(GENZO)]);
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', GENZO));
      decline(g);
      expect(g.life('p1')).toBe(4);
      expect(g.zone('p1', 'deck')).toHaveLength(4);
      expectDecision(g, 'main', 'p2');
    });

    it('does not fire for a Wisdom Character with [Blocker]', () => {
      const g = ko([rested(GLORIOSA)]);
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', GLORIOSA));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.life('p1')).toBe(4);
      expect(g.zone('p1', 'deck')).toHaveLength(4);
    });

    it('does not fire for a Character without the Wisdom attribute', () => {
      const g = ko([rested(V.c2)]);
      battle(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', V.c2));
      expect(g.life('p1')).toBe(4);
      expect(g.zone('p1', 'deck')).toHaveLength(4);
    });

    it('is Once Per Turn: a second Wisdom K.O. in the same turn adds nothing', () => {
      const g = ko([rested(GENZO), rested(MERRY)], 2);
      battle(g, g.find('p2', 'characters', V.c7, 0), g.find('p1', 'characters', GENZO));
      accept(g);
      expect(g.life('p1')).toBe(5);
      battle(g, g.find('p2', 'characters', V.c7, 1), g.find('p1', 'characters', MERRY));
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.life('p1')).toBe(5);
    });

    it("does not fire when the opponent's Wisdom Character is K.O.'d", () => {
      const g = game(
        { leader: PLAIN_BLUE, characters: [V.c7], life: [BLUE, BLUE, BLUE, BLUE] },
        { leader: ROBIN, characters: [rested(GENZO)], deck: [V.c1, V.c2] },
      );
      battle(g, g.find('p1', 'characters', V.c7), g.find('p2', 'characters', GENZO));
      expect(g.life('p2')).toBe(3);
      expect(g.zone('p2', 'deck')).toHaveLength(2);
    });
  });

  describe('[Activate: Main] [Once Per Turn] Set up to 1 Wisdom Character with 6000 power or less as active', () => {
    const start = (chars: (string | { card: string; rested: boolean })[]) =>
      game({ leader: ROBIN, characters: chars }, { leader: PLAIN_BLUE });
    const activate = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.leader('p1'), ability: 'untap' });

    it('sets a rested Wisdom Character with 6000 power or less active', () => {
      const g = start([{ card: GENZO, rested: true }]);
      activate(g);
      pick(g, [g.find('p1', 'characters', GENZO)]);
      expect(g.card(g.find('p1', 'characters', GENZO)).rested).toBe(false);
    });

    it('a Wisdom Character with 8000 power and a non-Wisdom Character are not candidates', () => {
      const g = start([
        { card: THATCH, rested: true },
        { card: V.c2, rested: true },
        { card: MERRY, rested: true },
      ]);
      activate(g);
      const choices = g
        .legal()
        .filter((a) => a.type === 'pick')
        .map((a) => (a.type === 'pick' ? a.choice : null));
      expect(choices).toEqual([g.find('p1', 'characters', MERRY)]);
      none(g);
      expect(g.card(g.find('p1', 'characters', THATCH)).rested).toBe(true);
    });

    it('is Once Per Turn', () => {
      const g = start([{ card: GENZO, rested: true }]);
      activate(g);
      none(g);
      expect(
        g.isLegal({ type: 'activate', card: g.leader('p1'), ability: 'untap', player: 'p1' }),
      ).toBe(false);
    });
  });
});

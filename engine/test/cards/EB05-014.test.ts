/** EB05-014 Shirahoshi. */
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
  PLAIN_PURPLE,
  trash,
  V,
} from './helpers.ts';

const ID = 'EB05-014';
/** {Neptunian}: cost 6 / 8000, cost 4 / 6000 (Bulge-Eyed), cost 6 / 7000 (Bird). [Megalo] cost 3 / 2000. */
const NEPT_8000 = 'OP11-026';
const NEPT_6000 = 'OP11-027';
const NEPT_7000 = 'OP11-033';
const MEGALO = 'OP11-112';

describe('EB05-014 Shirahoshi', () => {
  describe('[On Play]', () => {
    const start = (top: string[]) =>
      game(
        {
          leader: PLAIN_PURPLE,
          hand: [ID],
          deck: [...top, BLUE, BLUE, BLUE],
          costArea: { active: 1, rested: 0 },
        },
        { leader: PLAIN_BLUE },
      );

    it('looks at 5, adds up to a total of 2 [Megalo] or {Neptunian} cards to your hand and trashes the rest', () => {
      const g = start([NEPT_8000, V.c1, MEGALO, V.c2, V.c3]);
      play(g, ID);
      pick(g, [g.find('p1', 'deck', NEPT_8000), g.find('p1', 'deck', MEGALO)]);
      expect(hand(g, 'p1').sort()).toEqual([MEGALO, NEPT_8000].sort());
      // The 3 other looked-at cards are trashed, not put back.
      expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2, V.c3].sort());
      expect(g.zone('p1', 'deck')).toHaveLength(3);
      expectDecision(g, 'main', 'p1');
    });

    it('a total of 2: with 3 matching cards among the 5 only 2 may be taken, the third is trashed', () => {
      const g = start([NEPT_8000, NEPT_7000, NEPT_6000, V.c1, V.c2]);
      play(g, ID);
      pick(g, [g.find('p1', 'deck', NEPT_8000), g.find('p1', 'deck', NEPT_7000)]);
      expect(hand(g, 'p1')).toHaveLength(2);
      expect(trash(g, 'p1')).toContain(NEPT_6000);
    });

    it('"up to": may take nothing, and then all 5 are trashed', () => {
      const g = start([NEPT_8000, V.c1, V.c2, V.c3, V.c4]);
      play(g, ID);
      none(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(trash(g, 'p1')).toHaveLength(5);
    });

    it('cards that are neither [Megalo] nor {Neptunian} are not candidates', () => {
      const g = start([V.c1, V.c2, MEGALO, V.c3, V.c4]);
      play(g, ID);
      const choices = g
        .legal()
        .filter((a) => a.type === 'pick')
        .map((a) => (a.type === 'pick' ? a.choice : null));
      expect(choices).toEqual([g.find('p1', 'deck', MEGALO)]);
      none(g);
    });
  });

  describe('[Activate: Main] You may rest this Character: a {Neptunian} Character with 6000 power or less gains [Rush]', () => {
    const start = (chars: (string | { card: string; rested: boolean })[], rested = false) =>
      game(
        { leader: PLAIN_PURPLE, characters: [{ card: ID, rested }, ...chars] },
        { leader: PLAIN_BLUE },
      );
    const activate = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'rush' });

    it('rests this Character and gives [Rush] to the chosen {Neptunian} Character during this turn', () => {
      const g = start([NEPT_6000, NEPT_7000, V.c2]);
      activate(g);
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
      // Only the 6000 power {Neptunian} is a candidate (7000 is too strong, c2 has the wrong type).
      const nept = g.find('p1', 'characters', NEPT_6000);
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      pick(g, [nept]);
      expect(g.card(nept).keywords).toContain('Rush');
      expect(g.card(g.find('p1', 'characters', NEPT_7000)).keywords).not.toContain('Rush');
      g.act({ type: 'endTurn' });
      expect(g.card(nept).keywords).not.toContain('Rush');
    });

    it('is not offered when this Character is already rested (the cost cannot be paid)', () => {
      const g = start([NEPT_6000], true);
      expect(
        g.isLegal({
          type: 'activate',
          card: g.find('p1', 'characters', ID),
          ability: 'rush',
          player: 'p1',
        }),
      ).toBe(false);
    });

    it('"up to": may choose nothing, and the Character is still rested', () => {
      const g = start([NEPT_6000]);
      activate(g);
      none(g);
      expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
      expect(g.card(g.find('p1', 'characters', NEPT_6000)).keywords).not.toContain('Rush');
    });
  });
});

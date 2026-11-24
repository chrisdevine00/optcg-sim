/** OP16-094 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, hand, none, pick, trash, V } from './helpers.ts';
import { koByBattle, names, OTHER_LEADER, YAMATO_LEADER } from './helpers-op16g4.ts';

const ID = 'OP16-094';

describe('OP16-094 Portgas.D.Ace', () => {
  describe('[On K.O.]', () => {
    it('your opponent trashes 2 cards from their hand (they choose which)', () => {
      const g = koByBattle({ leader: OTHER_LEADER }, ID, { hand: [V.c1, V.c2, V.c3] });
      expectDecision(g, 'choose', 'p2');
      pick(g, [g.find('p2', 'hand', V.c3), g.find('p2', 'hand', V.c1)]);
      expect(names(g, 'p2', 'trash').sort()).toEqual([V.c1, V.c3].sort());
      expect(hand(g, 'p2')).toEqual([V.c2]);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('with only 1 card in their hand they trash just that card', () => {
      const g = koByBattle({ leader: OTHER_LEADER }, ID, { hand: [V.c1] });
      if (g.legal().some((a) => a.type === 'pick')) pick(g, [g.find('p2', 'hand', V.c1)]);
      expect(hand(g, 'p2')).toEqual([]);
      expect(names(g, 'p2', 'trash')).toEqual([V.c1]);
    });

    it('must not fire when Ace leaves the field without being K.O.d: nothing is trashed', () => {
      // Control: an empty opposing hand makes the effect a no-op rather than an error.
      const g = koByBattle({ leader: OTHER_LEADER }, ID, { hand: [] });
      expect(hand(g, 'p2')).toEqual([]);
      expect(expectDecision(g, 'main', 'p2')).toBeTruthy();
    });
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const start = () =>
      game(
        {
          leader: YAMATO_LEADER,
          characters: [ID, V.c1],
          costArea: { active: 0, rested: 2 },
        },
        { leader: OTHER_LEADER },
      );
    const act = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'give-don' });

    it('gives a rested DON!! to a {Land of Wano} Leader or Character only', () => {
      const g = start();
      act(g);
      // Candidates: the Wano Leader and Ace; the non-Wano vanilla is not offered.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
    });

    it('can give to Ace himself', () => {
      const g = start();
      act(g);
      pick(g, [g.find('p1', 'characters', ID)]);
      expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
    });

    it('once per turn: a second activation is illegal; "up to 1" may give nothing', () => {
      const g = start();
      act(g);
      pick(g, [g.leader('p1')]);
      expect(
        g.isLegal({
          type: 'activate',
          card: g.find('p1', 'characters', ID),
          ability: 'give-don',
          player: 'p1',
        }),
      ).toBe(false);
      const g2 = start();
      act(g2);
      none(g2);
      expect(g2.card(g2.leader('p1')).don).toBe(0);
    });
  });
});

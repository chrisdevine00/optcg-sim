/** OP15-026 Jango. */
import { describe, expect, it } from 'vitest';
import {
  dec,
  don,
  expectDecision,
  game,
  hand,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  trash,
  V,
} from './helpers.ts';
import { activate, canPick, EAST_BLUE_1, offeredAb, orderAll } from './helpers-w3s.ts';

const ID = 'OP15-026';

describe('OP15-026 Jango', () => {
  describe('[On Play] look at 3, add up to 1 {East Blue} card, the rest to the bottom', () => {
    const start = (deck: string[]) =>
      game(
        { leader: PLAIN_PURPLE, hand: [ID], deck, costArea: { active: 3, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
    const finish = orderAll;

    it('reveals 1 {East Blue} card to the hand; the other 2 go to the bottom; the 4th card stays on top', () => {
      const g = start([V.c1, EAST_BLUE_1, V.c2, V.c3, V.c4]);
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      // Only the {East Blue} card among the 3 is a candidate.
      expect(canPick(g, g.find('p1', 'deck', EAST_BLUE_1))).toBe(true);
      expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
      pick(g, [g.find('p1', 'deck', EAST_BLUE_1)]);
      finish(g);
      expect(hand(g, 'p1')).toEqual([EAST_BLUE_1]);
      const deck = g.zone('p1', 'deck').map((c) => c.card);
      expect(deck[0]).toBe(V.c3);
      expect(deck[1]).toBe(V.c4);
      expect(deck.slice(2).sort()).toEqual([V.c1, V.c2].sort());
      expect(deck).toHaveLength(4);
    });

    it('"up to 1": none may be taken, all 3 go to the bottom', () => {
      const g = start([EAST_BLUE_1, V.c1, V.c2, V.c3]);
      play(g, ID);
      none(g);
      finish(g);
      expect(hand(g, 'p1')).toEqual([]);
      const deck = g.zone('p1', 'deck').map((c) => c.card);
      expect(deck[0]).toBe(V.c3);
      expect(deck.slice(1).sort()).toEqual([EAST_BLUE_1, V.c1, V.c2].sort());
    });

    it('an {East Blue} card below the 3rd is not looked at', () => {
      const g = start([V.c1, V.c2, V.c3, EAST_BLUE_1]);
      play(g, ID);
      // No candidate among the 3 cards: nothing to pick (up to 1).
      expect(g.zone('p1', 'hand')).toHaveLength(0);
      if (dec(g)?.kind === 'choose') {
        expect(canPick(g, g.find('p1', 'deck', EAST_BLUE_1))).toBe(false);
        none(g);
      }
      finish(g);
      expect(hand(g, 'p1')).toEqual([]);
      expect(g.zone('p1', 'deck').map((c) => c.card)[0]).toBe(EAST_BLUE_1);
    });
  });

  describe('[Activate: Main] trash this Character: give an opposing rested DON!! to a Character', () => {
    const start = (rested: number, chars: string[] = [PURPLE]) =>
      game(
        { leader: PLAIN_PURPLE, characters: [ID] },
        { leader: PLAIN_BLUE, characters: chars, costArea: { active: 1, rested } },
      );

    it('trashes Jango and gives the DON!! to the opponent’s Character (not their Leader)', () => {
      const g = start(2, [PURPLE, V.c1]);
      activate(g, g.find('p1', 'characters', ID), 'give-don');
      expect(trash(g, 'p1')).toEqual([ID]);
      expectDecision(g, 'choose', 'p1');
      expect(canPick(g, g.leader('p2'))).toBe(false);
      pick(g, [g.find('p2', 'characters', V.c1)]);
      expect(g.card(g.find('p2', 'characters', V.c1)).don).toBe(1);
      expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, given: 1 });
    });

    it('"up to 1": may give nothing, but Jango is still trashed (it was the cost)', () => {
      const g = start(2, [PURPLE, V.c1]);
      activate(g, g.find('p1', 'characters', ID), 'give-don');
      none(g);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 0 });
    });

    it('is offered with no rested DON!! or no Character of the opponent’s (the cost is only trashing it)', () => {
      const g = start(0);
      expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(true);
    });

    it('not [Once Per Turn]: a second Jango can do it too', () => {
      const g = game(
        { leader: PLAIN_PURPLE, characters: [ID, ID] },
        { leader: PLAIN_BLUE, characters: [PURPLE], costArea: { active: 0, rested: 3 } },
      );
      activate(g, g.find('p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p2', 'characters', PURPLE)]);
      expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(true);
    });
  });
});

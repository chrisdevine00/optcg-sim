/** OP09-022 Lim (Leader). */
import { describe, expect, it } from 'vitest';
import { addMost, don, none, option, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { activate, game, inert, offeredAb, pickableCards } from './helpers-w6c1.ts';

const ID = 'OP09-022';
const ODY4 = 'OP09-038'; // Rob Lucci {ODYSSEY}, cost 4, vanilla
const ODY5 = 'OP09-027'; // Sabo {ODYSSEY}, cost 5
const ODY6 = 'OP09-026'; // Sakazuki {ODYSSEY}, cost 6
const STAGE = 'OP04-096'; // a Stage

describe('OP09-022 Lim', () => {
  const mk = (handCards: string[], active = 6, characters: string[] = []) => {
    const g = game(
      { leader: ID, hand: handCards, characters, costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    inert(g, ODY5, ODY6, STAGE);
    return g;
  };
  const go = (g: ReturnType<typeof mk>) => activate(g, g.leader('p1'), 'activate');

  describe('your Character cards are played rested', () => {
    it('a Character played from your hand enters rested', () => {
      const g = mk([V.c2]);
      play(g, V.c2);
      expect(g.card(g.find('p1', 'characters', V.c2)).rested).toBe(true);
    });

    it('a Stage is not a Character card: it is not played rested', () => {
      const g = mk([STAGE]);
      play(g, STAGE);
      expect(g.card(g.find('p1', 'stage', STAGE)).rested).toBe(false);
    });
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    it('rests 3 DON!!, adds 1 DON!! from the DON!! deck rested, and plays an {ODYSSEY} Character of cost 5 or less from your hand (rested)', () => {
      const g = mk([ODY5, ODY6, V.c3, ODY4]);
      const before = don(g, 'p1');
      go(g);
      addMost(g);
      // Boundary: cost 5 and 4 are offered; cost 6 and a non-{ODYSSEY} Character are not.
      expect(pickableCards(g).sort()).toEqual([ODY4, ODY5].sort());
      pick(g, [g.find('p1', 'hand', ODY5)]);
      expect(g.card(g.find('p1', 'characters', ODY5)).rested).toBe(true);
      const after = don(g, 'p1');
      // 3 active DON!! rested as the cost, 1 added rested: active 6 -> 3, rested 0 -> 4.
      expect(after.active).toBe(before.active - 3);
      expect(after.rested).toBe(before.rested + 4);
    });

    it('"up to 1" DON!!: adding none still plays the Character (the play is not conditional on the DON!!)', () => {
      const g = mk([ODY4]);
      const before = don(g, 'p1');
      go(g);
      option(g, '0');
      pick(g, [g.find('p1', 'hand', ODY4)]);
      expect(don(g, 'p1').rested).toBe(before.rested + 3);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ODY4]);
    });

    it('"up to 1" Character: may be declined, the DON!! stays added; asked even with no {ODYSSEY} card in hand', () => {
      const g = mk([V.c3]);
      go(g);
      addMost(g);
      expect(pickableCards(g)).toEqual([]);
      none(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(don(g, 'p1').rested).toBe(4);
    });

    it('once per turn: not offered a second time even with DON!! to pay', () => {
      const g = mk([ODY4, ODY5], 9);
      expect(offeredAb(g, g.leader('p1'), 'activate')).toBe(true);
      go(g);
      addMost(g);
      pick(g, [g.find('p1', 'hand', ODY4)]);
      expect(offeredAb(g, g.leader('p1'), 'activate')).toBe(false);
    });

    it('must not be offered with fewer than 3 active DON!!', () => {
      const g = mk([ODY4], 2);
      expect(offeredAb(g, g.leader('p1'), 'activate')).toBe(false);
      const h = mk([ODY4], 3);
      expect(offeredAb(h, h.leader('p1'), 'activate')).toBe(true);
    });
  });
});

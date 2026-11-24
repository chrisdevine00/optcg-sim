/** OP12-046 Zephyr(Navy). */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import { activate, canActivate, ids, mine, offered } from './helpers-op12g2.ts';

const ID = 'OP12-046';

describe('OP12-046 Zephyr(Navy)', () => {
  describe('[On Play] Trash 2 cards from your hand', () => {
    it('trashes the 2 cards you choose', () => {
      const g = mine({ hand: [ID, V.c1, V.c2, V.c3] });
      play(g, ID);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c1), g.find('p1', 'hand', V.c3)]);
      expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c3].sort());
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('it is not optional and not "up to": with only 1 card in hand that card is trashed', () => {
      const g = mine({ hand: [ID, V.c1] });
      play(g, ID);
      if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('with an empty hand nothing happens', () => {
      const g = mine({ hand: [ID] });
      play(g, ID);
      expect(dec(g)?.kind).toBe('main');
      expect(trash(g, 'p1')).toEqual([]);
    });
  });

  describe("[Activate: Main] You may trash this Character: return up to 1 Character with a cost of 5 or less to the owner's hand", () => {
    const start = () => mine({ characters: [ID, V.c5, V.c6] }, { characters: [V.c3, V.c7] });

    it('trashes itself, then returns an opposing Character of cost 5 or less to its owner', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'bounce');
      expect(trash(g, 'p1')).toEqual([ID]);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(ids(g, 'p2', 'characters')).toEqual([V.c7]);
      expect(ids(g, 'p2', 'hand')).toEqual([V.c3]);
    });

    it('may return your own Character; cost 5 is the limit and Zephyr himself is gone', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'bounce');
      const cands = offered(g);
      expect(cands).toContain(g.find('p1', 'characters', V.c5));
      expect(cands).toContain(g.find('p2', 'characters', V.c3));
      expect(cands).not.toContain(g.find('p1', 'characters', V.c6));
      expect(cands).not.toContain(g.find('p2', 'characters', V.c7));
      expect(cands).toHaveLength(2);
      pick(g, [g.find('p1', 'characters', V.c5)]);
      expect(ids(g, 'p1', 'hand')).toEqual([V.c5]);
      expect(ids(g, 'p1', 'characters')).toEqual([V.c6]);
    });

    it('"up to 1": Zephyr is trashed even when nothing is returned', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'bounce');
      none(g);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c7]);
    });

    it('can be activated again with a second Zephyr (no Once Per Turn)', () => {
      const g = mine({ characters: [ID, ID] });
      const z = g.find('p1', 'characters', ID, 0);
      activate(g, z, 'bounce');
      none(g);
      expect(canActivate(g, g.find('p1', 'characters', ID), 'bounce')).toBe(true);
    });
  });
});

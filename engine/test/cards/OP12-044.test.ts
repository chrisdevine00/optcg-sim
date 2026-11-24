/** OP12-044 Sakazuki. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { activate, canActivate, NAVY_LEADER, OTHER_LEADER, mine } from './helpers-op12g2.ts';

const ID = 'OP12-044';

describe('OP12-044 Sakazuki', () => {
  describe('[On Play] If your Leader has the {Navy} type, draw 2 cards', () => {
    it('draws 2 with a {Navy} Leader', () => {
      const g = mine({ hand: [ID], costArea: { active: 7, rested: 0 } });
      play(g, ID);
      expect(hand(g, 'p1')).toHaveLength(2);
      expect(g.zone('p1', 'deck')).toHaveLength(8);
    });

    it('draws nothing with another Leader type', () => {
      const g = mine({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 7, rested: 0 } });
      play(g, ID);
      expect(hand(g, 'p1')).toHaveLength(0);
      expect(g.zone('p1', 'deck')).toHaveLength(10);
    });
  });

  describe('[Activate: Main] [Once Per Turn] You may trash 1 card from your hand: give up to 1 rested DON!!', () => {
    const start = (handCards: string[] = [V.c1], active = 2, rested = 2) =>
      mine({ leader: NAVY_LEADER, characters: [ID], hand: handCards }, {}, {}, active, rested);

    it('trashes 1 card, then gives a rested DON!! to the Leader', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    });

    it('may give it to a Character instead (and choose which card to trash)', () => {
      const g = start([V.c1, V.c2]);
      const sak = g.find('p1', 'characters', ID);
      activate(g, sak, 'give-don');
      pick(g, [g.find('p1', 'hand', V.c2)]);
      pick(g, [sak]);
      expect(trash(g, 'p1')).toEqual([V.c2]);
      expect(g.card(sak).don).toBe(1);
      expect(g.card(g.leader('p1')).don).toBe(0);
    });

    it('"up to 1": the DON!! can be declined once the cost is paid', () => {
      const g = start();
      activate(g, g.find('p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      g.act({ type: 'done' });
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(g.card(g.leader('p1')).don).toBe(0);
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 2 });
    });

    it('only a rested DON!! is given: with none rested the cost is paid and nothing is given', () => {
      const g = start([V.c1], 4, 0);
      activate(g, g.find('p1', 'characters', ID), 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(dec(g)?.kind).toBe('main');
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(g.card(g.leader('p1')).don).toBe(0);
    });

    it('once per turn, and not offered with an empty hand', () => {
      const g = start([V.c1, V.c2]);
      const sak = g.find('p1', 'characters', ID);
      expect(canActivate(g, sak, 'give-don')).toBe(true);
      activate(g, sak, 'give-don');
      pick(g, [g.find('p1', 'hand', V.c1)]);
      pick(g, [g.leader('p1')]);
      expect(canActivate(g, sak, 'give-don')).toBe(false);
      const h = start([]);
      expect(canActivate(h, h.find('p1', 'characters', ID), 'give-don')).toBe(false);
    });
  });
});

/** OP10-072 Donquixote Rosinante. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  option,
  pick,
  play,
  setMost,
  trash,
  V,
} from './helpers.ts';
import { EVENT, mk } from './helpers-a10g2.ts';

const ID = 'OP10-072';

describe('OP10-072 Donquixote Rosinante', () => {
  describe('[On Play] You may trash 1 Event from your hand: Draw 2 cards', () => {
    const start = (handCards = [EVENT, V.c1]) => mk({ hand: [ID, ...handCards] });

    it('trashes the Event and draws 2', () => {
      const g = start();
      play(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', EVENT)]);
      expect(trash(g, 'p1')).toEqual([EVENT]);
      expect(hand(g, 'p1')).toHaveLength(3);
      expect(g.zone('p1', 'deck')).toHaveLength(8);
      expectDecision(g, 'main', 'p1');
    });

    it('"You may": declining trashes and draws nothing', () => {
      const g = start();
      play(g, ID);
      decline(g);
      expect(trash(g, 'p1')).toEqual([]);
      expect(hand(g, 'p1')).toEqual([EVENT, V.c1]);
    });

    it('with no Event in hand the cost cannot be paid: accepting is not legal', () => {
      const g = start([V.c1, V.c2]);
      play(g, ID);
      expectDecision(g, 'optional', 'p1');
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
      expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    });

    it('only an Event pays the cost: a Character is not a candidate', () => {
      const g = start([EVENT, V.c1]);
      play(g, ID);
      accept(g);
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    });
  });

  describe('[End of Your Turn] If you have 7 or more DON!! cards on your field, set up to 2 of your DON!! cards as active', () => {
    const endTurn = (g: ReturnType<typeof mk>) => {
      g.act({ type: 'endTurn' });
      if (dec(g)?.kind === 'choose') setMost(g);
    };

    it('with 7 DON!! on your field sets up to 2 of them active', () => {
      const g = mk({ characters: [ID], costArea: { active: 2, rested: 5 } });
      endTurn(g);
      expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 3 });
    });

    it('boundary: 6 DON!! is not enough', () => {
      const g = mk({ characters: [ID], costArea: { active: 2, rested: 4 } });
      endTurn(g);
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 4 });
    });

    it('DON!! given to your cards count towards the 7', () => {
      const g = mk({
        characters: [ID, { card: V.c1, don: 2 }],
        costArea: { active: 1, rested: 4 },
      });
      endTurn(g);
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 2 });
    });

    it('"up to 2": may set 1 or none', () => {
      const g = mk({ characters: [ID], costArea: { active: 2, rested: 5 } });
      g.act({ type: 'endTurn' });
      option(g, '1');
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 4 });
      const h = mk({ characters: [ID], costArea: { active: 2, rested: 5 } });
      h.act({ type: 'endTurn' });
      option(h, '0');
      expect(don(h, 'p1')).toMatchObject({ active: 2, rested: 5 });
    });

    it('with 7 DON!! that are all active there is nothing to set and nothing is asked', () => {
      const g = mk({ characters: [ID], costArea: { active: 7, rested: 0 } });
      g.act({ type: 'endTurn' });
      expect(dec(g)?.kind).not.toBe('choose');
      expect(don(g, 'p1').active).toBe(7);
    });
  });
});

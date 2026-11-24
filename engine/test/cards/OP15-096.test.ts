/** OP15-096 Swallow Bond en Avant. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import {
  canAccept,
  counterStep,
  donArea,
  fill,
  mine,
  names,
  OTHER_LEADER,
  SHC_LEADER,
  useCounter,
} from './helpers-op15g3.ts';

const ID = 'OP15-096';

describe('OP15-096 Swallow Bond en Avant', () => {
  describe('[Main]', () => {
    const start = (leader: string, deck = fill(10, V.c1)) =>
      mine({ leader, hand: [ID], deck, ...donArea(1) });

    it('rest 1 DON!!: with a {Straw Hat Crew} Leader trash exactly 5 cards from the top of the deck', () => {
      const g = start(SHC_LEADER, [V.c1, V.c2, V.c3, V.c4, V.c5, V.c6, V.c7]);
      play(g, ID);
      accept(g);
      expect(don(g, 'p1').rested).toBe(1);
      expect(names(g, 'p1', 'deck')).toEqual([V.c6, V.c7]);
      expect(names(g, 'p1', 'trash')).toHaveLength(6); // 5 milled and the Event
    });

    it('with a Leader that is not {Straw Hat Crew} nothing is trashed (the DON!! is still rested)', () => {
      const g = start(OTHER_LEADER);
      play(g, ID);
      accept(g);
      expect(don(g, 'p1').rested).toBe(1);
      expect(names(g, 'p1', 'deck')).toHaveLength(10);
    });

    it('declining the optional cost trashes nothing', () => {
      const g = start(SHC_LEADER);
      play(g, ID);
      decline(g);
      expect(don(g, 'p1').rested).toBe(0);
      expect(names(g, 'p1', 'deck')).toHaveLength(10);
    });

    it('a deck of exactly 5 cards is milled empty and loses at once (RL-26)', () => {
      const g = start(SHC_LEADER, fill(5, V.c1));
      play(g, ID);
      accept(g);
      expect(names(g, 'p1', 'deck')).toHaveLength(0);
      expect(dec(g)).toBeNull();
    });
  });

  describe('[Counter]', () => {
    const start = (handCards: string[]) =>
      counterStep({ leader: OTHER_LEADER, hand: [ID, ...handCards], ...donArea(0) }, {});

    it('trash 1 card from your hand: a Leader or Character gains +3000 power during this battle', () => {
      const g = start([V.c2, V.c3]);
      useCounter(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c3)]);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(8000);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('the cost is optional: declining gives no power', () => {
      const g = start([V.c2]);
      useCounter(g, ID);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(hand(g, 'p1')).toEqual([V.c2]);
    });

    it('"up to 1": after paying the cost the target may be none', () => {
      const g = start([V.c2]);
      useCounter(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c2)]);
      expectDecision(g, 'choose', 'p1');
      none(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('the cost cannot be paid with no other card in hand (the Event itself is already trashed)', () => {
      const g = start([]);
      useCounter(g, ID);
      expectDecision(g, 'optional', 'p1');
      expect(canAccept(g)).toBe(false);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });
});

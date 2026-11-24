/** OP12-059 Concasser. */
import { describe, expect, it } from 'vitest';
import { dec, hand, play, V } from './helpers.ts';
import {
  counterGame,
  EVENT,
  EVENT2,
  mine,
  rep,
  SANJI_LEADER,
  SANJI_MULTI,
  OTHER_LEADER,
} from './helpers-op12g2.ts';

const ID = 'OP12-059';

describe('OP12-059 Concasser', () => {
  describe('[Main] If your Leader is [Sanji], draw 1 card', () => {
    it('draws 1 with a [Sanji] Leader (either Sanji Leader)', () => {
      for (const leader of [SANJI_LEADER, SANJI_MULTI]) {
        const g = mine({ leader, hand: [ID] });
        play(g, ID);
        expect(hand(g, 'p1')).toHaveLength(1);
        expect(g.zone('p1', 'deck')).toHaveLength(9);
      }
    });

    it('draws nothing with another Leader', () => {
      const g = mine({ leader: OTHER_LEADER, hand: [ID] });
      play(g, ID);
      expect(dec(g)?.kind).toBe('main');
      expect(hand(g, 'p1')).toHaveLength(0);
      expect(g.zone('p1', 'deck')).toHaveLength(10);
    });
  });

  describe('[Counter] If you have 4 or more Events in your trash, your Leader gains +4000 power during this battle', () => {
    it('with 3 other Events in the trash (this Event makes 4) the Leader gets +4000', () => {
      const g = counterGame(ID, {
        leader: SANJI_LEADER,
        hand: [ID],
        trash: [EVENT, EVENT2, EVENT],
        characters: [V.c3],
      });
      expect(g.power(g.leader('p1'))).toBe(9000);
      expect(g.power(g.find('p1', 'characters', V.c3))).toBe(5000);
    });

    it('boundary: 2 other Events (3 with this one) give nothing', () => {
      const g = counterGame(ID, {
        leader: SANJI_LEADER,
        hand: [ID],
        trash: [EVENT, EVENT2, V.c1, V.c2],
      });
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('only Events count: 3 Events and many Characters give nothing; 4 Events with no other cards do', () => {
      const a = counterGame(ID, {
        leader: SANJI_LEADER,
        hand: [ID],
        trash: [EVENT, EVENT, EVENT, ...rep(5, V.c1)],
      });
      // 3 in the trash plus Concasser itself is 4.
      expect(a.power(a.leader('p1'))).toBe(9000);
      const b = counterGame(ID, {
        leader: SANJI_LEADER,
        hand: [ID],
        trash: [EVENT, EVENT, ...rep(5, V.c1)],
      });
      expect(b.power(b.leader('p1'))).toBe(5000);
    });
  });
});

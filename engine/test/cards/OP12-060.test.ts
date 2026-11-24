/** OP12-060 Boeuf Burst. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, option, pick, play, V } from './helpers.ts';
import { ids, mine, MONO_LEADER, offered, rep, SANJI_MULTI } from './helpers-op12g2.ts';

const ID = 'OP12-060';

describe('OP12-060 Boeuf Burst', () => {
  /** Play the Event with a multicolored Leader and answer the mode choice (0: return, 1: draw). */
  const choose = (mode: 0 | 1, handCards: string[], p2chars: string[] = [V.c3, V.c4, V.c5]) => {
    const g = mine({ leader: SANJI_MULTI, hand: [ID, ...handCards] }, { characters: p2chars });
    play(g, ID);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options![mode]!.id);
    return g;
  };

  describe("mode 1: return up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    it("returns the chosen Character to its owner's hand", () => {
      const g = choose(0, []);
      pick(g, [g.find('p2', 'characters', V.c4)]);
      expect(ids(g, 'p2', 'characters')).toEqual([V.c3, V.c5]);
      expect(ids(g, 'p2', 'hand')).toEqual([V.c4]);
    });

    it('cost 4 is the limit: a cost 5 Character is not a candidate', () => {
      const g = choose(0, []);
      const cands = offered(g);
      expect(cands).toContain(g.find('p2', 'characters', V.c3));
      expect(cands).toContain(g.find('p2', 'characters', V.c4));
      expect(cands).not.toContain(g.find('p2', 'characters', V.c5));
      none(g);
      expect(ids(g, 'p2', 'characters')).toHaveLength(3);
    });
  });

  describe('mode 2: if you have 6 or less cards in your hand, draw 2 cards', () => {
    it('draws 2 with 6 cards in hand (the Event has left the hand)', () => {
      const g = choose(1, rep(6, V.c1));
      expect(hand(g, 'p1')).toHaveLength(8);
      expect(g.zone('p1', 'deck')).toHaveLength(8);
    });

    it('draws nothing with 7 cards in hand', () => {
      const g = choose(1, rep(7, V.c1));
      expect(hand(g, 'p1')).toHaveLength(7);
      expect(g.zone('p1', 'deck')).toHaveLength(10);
    });
  });

  it('must not do anything without a multicolored Leader: no choice is offered', () => {
    const g = mine({ leader: MONO_LEADER, hand: [ID] }, { characters: [V.c3] });
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(ids(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(hand(g, 'p1')).toHaveLength(0);
  });
});

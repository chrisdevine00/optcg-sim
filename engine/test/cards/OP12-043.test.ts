/** OP12-043 Kuzan. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  expectDecision,
  hand,
  none,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { canAccept, canAttack, mine, rep } from './helpers-op12g2.ts';

const ID = 'OP12-043';

describe('OP12-043 Kuzan', () => {
  const cost = (handCards: string[]) => {
    const g = mine({ characters: [ID], hand: handCards });
    return g.card(g.find('p1', 'characters', ID)).cost;
  };

  it('with 5 or more cards in hand he gains +1 cost (6 becomes 7); with 4 he does not', () => {
    expect(cost(rep(5, V.c1))).toBe(7);
    expect(cost(rep(6, V.c1))).toBe(7);
    expect(cost(rep(4, V.c1))).toBe(6);
    expect(cost([])).toBe(6);
  });

  describe('[On Play] You may trash 1 card from your hand: cannot attack until the end of the next End Phase', () => {
    const played = () => {
      const g = mine(
        { hand: [ID, V.c1, V.c2], costArea: { active: 6, rested: 0 } },
        { characters: [V.c3, V.c4] },
      );
      play(g, ID);
      return g;
    };

    it("trash 1 card, then up to 1 opponent's Character cannot attack during the opponent's next turn only", () => {
      const g = played();
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      g.act({ type: 'endTurn' });
      expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(false);
      expect(canAttack(g, g.find('p2', 'characters', V.c4), g.leader('p1'))).toBe(true);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(true);
    });

    it('declining the cost trashes nothing and restricts nothing', () => {
      const g = played();
      decline(g);
      expect(dec(g)?.kind).toBe('main');
      expect(trash(g, 'p1')).toEqual([]);
      g.act({ type: 'endTurn' });
      expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(true);
    });

    it('"up to 1": the cost is paid and the target may be none', () => {
      const g = played();
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c2)]);
      none(g);
      expect(trash(g, 'p1')).toEqual([V.c2]);
      g.act({ type: 'endTurn' });
      expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(true);
    });

    it('with an empty hand the cost cannot be paid: nothing is asked', () => {
      const g = mine({ hand: [ID], costArea: { active: 6, rested: 0 } }, { characters: [V.c3] });
      play(g, ID);
      expectDecision(g, 'optional', 'p1');
      expect(canAccept(g)).toBe(false);
      decline(g);
      expect(hand(g, 'p1')).toEqual([]);
      g.act({ type: 'endTurn' });
      expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(true);
    });
  });
});

/** OP12-053 Borsalino. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { accept, decline, dec, expectDecision, hand, pick, trash, V } from './helpers.ts';
import {
  canAccept,
  ids,
  mine,
  NAVY_LEADER,
  opp,
  OTHER_LEADER,
  plantOpponentEffect,
} from './helpers-op12g2.ts';

const ID = 'OP12-053';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('OP12-053 Borsalino', () => {
  /** p2's turn; p2's effect K.O.s Borsalino (or `target`). */
  const byOpponent = (target = ID) => {
    const g = mine({ characters: [ID, V.c2], hand: [V.c1, V.c3] }, {}, opp);
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', target)]);
    return g;
  };

  describe("[Once Per Turn] if removed from the field by your opponent's effect, you may trash 1 card from your hand instead", () => {
    it('trashing 1 card keeps Borsalino on the field', () => {
      const g = byOpponent();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(ids(g, 'p1', 'characters')).toContain(ID);
      expect(trash(g, 'p1')).toEqual([V.c1]);
      expect(hand(g, 'p1')).toEqual([V.c3]);
    });

    it('declining lets the K.O. happen', () => {
      const g = byOpponent();
      decline(g);
      expect(ids(g, 'p1', 'characters')).not.toContain(ID);
      expect(trash(g, 'p1')).toEqual([ID]);
    });

    it('once per turn: a second removal in the same turn is not replaced', () => {
      const g = byOpponent();
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expectDecision(g, 'main', 'p2');
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', ID)]);
      expect(dec(g)?.kind).not.toBe('optional');
      expect(ids(g, 'p1', 'characters')).not.toContain(ID);
    });

    it('must not protect another Character, and does not apply to your own effects', () => {
      const g = byOpponent(V.c2);
      expectDecision(g, 'main', 'p2');
      expect(ids(g, 'p1', 'characters')).not.toContain(V.c2);
      const own = mine({ characters: [ID], hand: [V.c1] }, {}, opp);
      own.state = applyOp(own.state, {
        op: 'ko',
        card: own.find('p1', 'characters', ID),
        by: 'p1',
      }).state;
      expect(ids(own, 'p1', 'characters')).not.toContain(ID);
    });

    it('with an empty hand the replacement is not offered', () => {
      const g = mine({ characters: [ID], hand: [] }, {}, opp);
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', ID)]);
      // The replacement is shown but cannot be accepted (the trash cannot be paid).
      expectDecision(g, 'optional', 'p1');
      expect(canAccept(g)).toBe(false);
      decline(g);
      expect(ids(g, 'p1', 'characters')).not.toContain(ID);
    });
  });

  describe("[Opponent's Turn] if your Leader has {Navy}, gains [Blocker] and +1000 power", () => {
    const at = (leader: string, extra: Parameters<typeof mine>[2]) =>
      mine({ leader, characters: [ID] }, {}, extra);

    it("on the opponent's turn with a {Navy} Leader: [Blocker] and 6000 power", () => {
      const g = at(NAVY_LEADER, opp);
      const b = g.card(g.find('p1', 'characters', ID));
      expect(b.keywords).toContain('Blocker');
      expect(b.power).toBe(6000);
    });

    it('on your own turn: no [Blocker], 5000 power', () => {
      const g = at(NAVY_LEADER, {});
      const b = g.card(g.find('p1', 'characters', ID));
      expect(b.keywords).not.toContain('Blocker');
      expect(b.power).toBe(5000);
    });

    it("with a Leader that is not {Navy}, the opponent's turn gives nothing", () => {
      const g = at(OTHER_LEADER, opp);
      const b = g.card(g.find('p1', 'characters', ID));
      expect(b.keywords).not.toContain('Blocker');
      expect(b.power).toBe(5000);
    });
  });
});

/** OP16-015 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { accept, decline, endCounter, game, passBlock, pick, PLAIN_BLUE, V } from './helpers.ts';
import { oppAttack } from './helpers-op17g1.ts';
import { ACE_LEADER, canAccept, RED_LEADER, WB7, WB8 } from './helpers-op16g1.ts';

const ID = 'OP16-015';
/** ST22-001 Ace & Newgate: a Leader whose name includes "Ace" without being [Portgas.D.Ace]. */
const ACE_NEWGATE = 'ST22-001';

describe('OP16-015 Monkey.D.Luffy', () => {
  describe('in hand', () => {
    const costWith = (
      leader: string,
      active: number,
      chars: Parameters<typeof game>[0]['characters'] = [],
    ) => {
      const g = game(
        { leader, hand: [ID], characters: chars, costArea: { active, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      return g.card(g.find('p1', 'hand', ID)).cost;
    };

    it('-2 cost if your Leader name includes "Ace" and you have 6 or more DON!! on your field', () => {
      expect(costWith(ACE_LEADER, 6)).toBe(2);
      expect(costWith(ACE_NEWGATE, 6)).toBe(2);
    });

    it('threshold: 5 DON!! is not enough; DON!! given to a Character count toward the 6', () => {
      expect(costWith(ACE_LEADER, 5)).toBe(4);
      expect(costWith(ACE_LEADER, 4, [{ card: V.c1, don: 2 }])).toBe(2);
    });

    it('a Leader whose name does not include "Ace" gets no discount', () => {
      expect(costWith(RED_LEADER, 10)).toBe(4);
    });
  });

  describe("[On Your Opponent's Attack]", () => {
    const start = (handCards: string[]) =>
      oppAttack({ leader: ACE_LEADER, hand: handCards, characters: [ID] });

    it("trash a Character card with 8000 power from your hand: your Leader and this Character's base power becomes 7000 this turn", () => {
      const g = start([WB8, V.c1]);
      accept(g);
      pick(g, [g.find('p1', 'hand', WB8)]);
      expect(g.power(g.leader('p1'))).toBe(7000);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
    });

    it('the Leader is raised from 5000 and Luffy from 6000; both last until the end of the turn', () => {
      const g = game(
        { leader: ACE_LEADER, hand: [WB8], characters: [ID] },
        { leader: PLAIN_BLUE, characters: [V.c4] },
        { turn: 4, activePlayer: 'p2' },
      );
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c4),
        target: g.leader('p1'),
      });
      accept(g);
      pick(g, [g.find('p1', 'hand', WB8)]);
      expect(g.power(g.leader('p1'))).toBe(7000);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(7000);
      passBlock(g);
      endCounter(g);
      // The 6000 attacker did not get through; the base power holds until the end of the turn.
      expect(g.life('p1')).toBe(3);
      expect(g.power(g.leader('p1'))).toBe(7000);
      g.act({ type: 'endTurn' });
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });

    it('cannot be paid with a 7000 power Character', () => {
      const g = start([WB7]);
      expect(canAccept(g)).toBe(false);
    });

    it('declining changes nothing', () => {
      const g = start([WB8]);
      decline(g);
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });
  });
});

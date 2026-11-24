/** OP16-003 Edward.Newgate. */
import { describe, expect, it } from 'vitest';
import { accept, decline, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAccept, WB_LEADER, WB7, WB8, WB8B } from './helpers-op16g1.ts';

const ID = 'OP16-003';

describe('OP16-003 Edward.Newgate', () => {
  describe('[Your Turn]', () => {
    const start = () => game({ leader: WB_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });

    it('on your turn your Leader gains [Double Attack] and +2000 power', () => {
      const g = start();
      const leader = g.leader('p1');
      expect(g.card(leader).keywords).toContain('Double Attack');
      expect(g.power(leader)).toBe(8000);
    });

    it("on your opponent's turn it does not apply", () => {
      const g = start();
      g.act({ type: 'endTurn' });
      const leader = g.leader('p1');
      expect(g.card(leader).keywords).not.toContain('Double Attack');
      expect(g.power(leader)).toBe(6000);
    });
  });

  describe('[On Play]', () => {
    const start = (handCards: string[]) =>
      game(
        {
          leader: WB_LEADER,
          hand: [ID, ...handCards],
          costArea: { active: 8, rested: 0 },
        },
        { leader: PLAIN_BLUE, characters: [V.c7, V.c3] },
      );

    it("reveal 2 Character cards with 8000 power: up to 1 of your opponent's Characters gets -6000 power this turn", () => {
      const g = start([WB8, WB8B, V.c1]);
      play(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', WB8), g.find('p1', 'hand', WB8B)]);
      const target = g.find('p2', 'characters', V.c7);
      pick(g, [target]);
      expect(g.power(target)).toBe(3000);
      expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
      expect(g.eventsOfType('CardRevealed').map((e) => e.card)).toEqual(
        expect.arrayContaining([WB8, WB8B]),
      );
      g.act({ type: 'endTurn' });
      expect(g.power(target)).toBe(9000);
    });

    it('cannot be paid with only 1 Character card with 8000 power (7000 does not count)', () => {
      const g = start([WB8, WB7]);
      play(g, ID);
      expect(canAccept(g)).toBe(false);
    });

    it('declining leaves the opponent untouched', () => {
      const g = start([WB8, WB8B]);
      play(g, ID);
      decline(g);
      expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    });
  });
});

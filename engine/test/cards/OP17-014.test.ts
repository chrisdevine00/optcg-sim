/** OP17-014 Whitey Bay. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  takeDamage,
  trash,
  V,
} from './helpers.ts';
import { oppAttack, P2000_A, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-014';

describe('OP17-014 Whitey Bay', () => {
  describe('[On Play]', () => {
    const start = (opp: Parameters<typeof game>[1]['characters']) =>
      game(
        { leader: RED_LEADER, hand: [ID], costArea: { active: 1, rested: 0 } },
        { leader: PLAIN_BLUE, characters: opp },
      );

    it("K.O. up to 1 of your opponent's Characters with 2000 base power or less", () => {
      const g = start([P2000_A, V.c1]);
      play(g, ID);
      pick(g, [g.find('p2', 'characters', P2000_A)]);
      expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c1]);
    });

    it('a 3000 base power Character is not a candidate, and "up to 1" may be left empty', () => {
      const g = start([V.c1]);
      play(g, ID);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      const g2 = start([P2000_A]);
      play(g2, ID);
      none(g2);
      expect(g2.zone('p2', 'characters')).toHaveLength(1);
    });
  });

  describe("[On Your Opponent's Attack]", () => {
    /** p2's 5000 Character attacks p1's 5000 Leader; Whitey Bay is on the field. */
    const attack = () => oppAttack({ leader: RED_LEADER, characters: [ID] }, {}, V.c3);

    it('you may trash this Character: your Leader gains +1000 power during this battle', () => {
      const g = attack();
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g, 'p1')).toEqual([ID]);
      expect(g.power(g.leader('p1'))).toBe(6000);
      passBlock(g);
      endCounter(g);
      expect(g.life('p1')).toBe(3); // 6000 stops the 5000 attacker
      expect(g.power(g.leader('p1'))).toBe(5000);
    });

    it('declining keeps the Character on the field and the Leader takes the hit (5000 vs 5000)', () => {
      const g = attack();
      decline(g);
      expect(g.zone('p1', 'characters')).toHaveLength(1);
      expect(g.power(g.leader('p1'))).toBe(5000);
      passBlock(g);
      endCounter(g);
      takeDamage(g);
      expect(g.life('p1')).toBe(2);
    });

    it('boosts the Leader only: there is no target choice and a Character is never boosted', () => {
      const g = oppAttack({ leader: RED_LEADER, characters: [ID, V.c1] }, {}, V.c3);
      accept(g);
      expectDecision(g, 'block', 'p1');
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
    });
  });
});

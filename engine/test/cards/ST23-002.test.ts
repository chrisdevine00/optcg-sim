/** ST23-002 Shanks. */
import { describe, expect, it } from 'vitest';
import { dec, play } from './helpers.ts';
import { buff } from './helpers-prbst.ts';
import { mk, OTHER_LEADER, RHP_LEADER, UTA_LEADER, V } from './helpers-lfb.ts';

const ID = 'ST23-002';

describe('ST23-002 Shanks', () => {
  const start = (mine: Parameters<typeof mk>[0] = {}, theirs: Parameters<typeof mk>[1] = {}) =>
    mk({ hand: [ID], costArea: { active: 6, rested: 0 }, ...mine }, theirs);
  const cost = (g: ReturnType<typeof start>) => g.card(g.find('p1', 'hand', ID)).cost;

  describe('hand discount', () => {
    it('in the hand it costs 3 less while your opponent has a Character with 8000 base power or more', () => {
      const g = start({}, { characters: [V.c6] });
      expect(cost(g)).toBe(6);
      expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', ID), player: 'p1' })).toBe(
        true,
      );
    });

    it('boundary: 7000 base power is not enough', () => {
      const g = start({}, { characters: [V.c5] });
      expect(cost(g)).toBe(9);
    });

    it('it reads base power: a 7000 Character buffed to 8000 does not count, an 8000 one reduced to 6000 does', () => {
      const g = start({}, { characters: [V.c5] });
      buff(g, g.find('p2', 'characters', V.c5), 1000);
      expect(g.power(g.find('p2', 'characters', V.c5))).toBe(8000);
      expect(cost(g)).toBe(9);
      const h = start({}, { characters: [V.c6] });
      buff(h, h.find('p2', 'characters', V.c6), -2000);
      expect(cost(h)).toBe(6);
    });

    it('your own 8000-base Character does not count', () => {
      const g = start({ characters: [V.c6] });
      expect(cost(g)).toBe(9);
    });

    it('applies only in the hand', () => {
      const g = start({ characters: [ID] }, { characters: [V.c6] });
      expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(9);
    });
  });

  describe('[On Play]', () => {
    const played = (leader: string) => {
      const g = start({ leader, costArea: { active: 10, rested: 0 } });
      play(g, ID);
      return g;
    };

    it('with a "Red-Haired Pirates" Leader: your Leader gains +2000 power', () => {
      const g = played(RHP_LEADER);
      expect(dec(g)?.kind).toBe('main');
      expect(g.power(g.leader('p1'))).toBe(7000);
    });

    it('with the [Uta] Leader: your Leader gains +2000 power', () => {
      const g = played(UTA_LEADER);
      expect(g.power(g.leader('p1'))).toBe(7000);
    });

    it('must not fire: any other Leader', () => {
      const g = played(OTHER_LEADER);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });
});

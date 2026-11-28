/** OP18-081 Oars. */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  endCounter,
  expectDecision,
  game,
  passBlock,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  takeDamage,
  V,
} from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { KUMACY, LOLA, MORIA, mine, theirs } from './helpers-op18-g3.ts';

const ID = 'OP18-081';
const COST8 = 'OP14-101'; // {Giant, Thriller Bark Pirates} cost 8

describe('OP18-081 Oars', () => {
  describe('if you have a [Gecko Moria] Character: [Double Attack] and [Blocker]', () => {
    const attack = (chars: string[]) => {
      const g = mine({ characters: chars }, {});
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
      passBlock(g);
      endCounter(g);
      takeDamage(g);
      return g.life('p2');
    };
    const canBlock = (chars: string[]) => {
      const g = theirs({ characters: chars }, { characters: [V.c5] });
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
      return g
        .legal()
        .some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID));
    };

    it('with a [Gecko Moria] Character it deals 2 damage and can block', () => {
      expect(attack([ID, MORIA])).toBe(1);
      expect(canBlock([ID, MORIA])).toBe(true);
    });

    it('without one it deals 1 damage and cannot block', () => {
      expect(attack([ID, V.c3])).toBe(2);
      expect(canBlock([ID, V.c3])).toBe(false);
    });

    it('a [Gecko Moria] Leader does not count (it must be a Character)', () => {
      const g = game(
        { leader: 'OP06-080', characters: [ID] },
        { leader: PLAIN_BLUE, characters: [V.c5] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
      expect(
        g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
      ).toBe(false);
    });
  });

  describe('[Trigger] play up to 1 {Thriller Bark Pirates} Character with a cost of 4 or less from your trash rested', () => {
    const start = () =>
      game(
        { leader: PLAIN_PURPLE, life: [ID, BLUE, BLUE], trash: [LOLA, KUMACY, COST8, V.c2] },
        { leader: PLAIN_BLUE, characters: [V.c5] },
        { turn: 4, activePlayer: 'p2' },
      );
    const trigger = (g: ReturnType<typeof start>) => {
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c5), target: g.leader('p1') });
      passBlock(g);
      endCounter(g);
      expectDecision(g, 'trigger', 'p1');
      g.act({ type: 'trigger', activate: true });
    };

    it('plays the chosen card rested', () => {
      const g = start();
      trigger(g);
      expect(candidates(g).sort()).toEqual(
        [g.find('p1', 'trash', LOLA), g.find('p1', 'trash', KUMACY)].sort(),
      );
      pick(g, [g.find('p1', 'trash', LOLA)]);
      expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([LOLA]);
      expect(g.card(g.find('p1', 'characters', LOLA)).rested).toBe(true);
    });

    it('a cost of 8 or a card of another type is not a candidate; "up to 1" allows none', () => {
      const g = start();
      trigger(g);
      expect(candidates(g)).not.toContain(g.find('p1', 'trash', COST8));
      expect(candidates(g)).not.toContain(g.find('p1', 'trash', V.c2));
      g.act({ type: 'done' });
      expect(g.zone('p1', 'characters')).toHaveLength(0);
    });
  });
});

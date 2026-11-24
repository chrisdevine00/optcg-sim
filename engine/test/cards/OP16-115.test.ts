/** OP16-115 Black Vortex. */
import { describe, expect, it } from 'vitest';
import { game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { BB_LEADER, TRIG_EVENT, trig, OTHER_LEADER } from './helpers-op16g4.ts';

const ID = 'OP16-115';

const start = (leader: string, trash: string[]) =>
  game({ leader, hand: [ID], trash, costArea: { active: 1, rested: 0 } }, { leader: PLAIN_BLUE });

describe('OP16-115 Black Vortex', () => {
  describe('[Main]', () => {
    it('with a {Blackbeard Pirates} Leader: adds a card with a [Trigger] from your trash to your hand', () => {
      const g = start(BB_LEADER, [TRIG_EVENT, V.c1]);
      play(g, ID);
      // Only the card with a [Trigger] is a candidate.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
      pick(g, [g.find('p1', 'trash', TRIG_EVENT)]);
      expect(hand(g, 'p1')).toEqual([TRIG_EVENT]);
    });

    it('must not take another [Black Vortex] (or itself, in the trash after being played)', () => {
      const g = start(BB_LEADER, [ID]);
      play(g, ID, 0);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('must not fire without a {Blackbeard Pirates} Leader', () => {
      const g = start(OTHER_LEADER, [TRIG_EVENT]);
      play(g, ID);
      expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
      expect(hand(g, 'p1')).toEqual([]);
    });

    it('"up to 1": may add nothing', () => {
      const g = start(BB_LEADER, [TRIG_EVENT]);
      play(g, ID);
      none(g);
      expect(hand(g, 'p1')).toEqual([]);
    });
  });

  describe('[Trigger]', () => {
    it("negates the effect of up to 1 of your opponent's Leader or Characters during this turn", () => {
      const g = trig(ID, { leader: OTHER_LEADER }, [V.c3]);
      g.act({ type: 'trigger', activate: true });
      // Candidates: the opposing Leader and both Characters.
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
      pick(g, [g.find('p2', 'characters', V.c3)]);
      expect(g.card(g.find('p2', 'characters', V.c3)).negated).toBe(true);
      expect(g.card(g.leader('p2')).negated).toBeFalsy();
    });
  });
});

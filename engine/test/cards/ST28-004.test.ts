/** ST28-004 Kouzuki Momonosuke (Character, cost 6, 7000). */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'ST28-004';

/** p1: the Leader holds `leader` DON!!, the Momonosuke `self`, a vanilla Character `other`. */
const mk = (leader: number, self: number, other = 0, over: object = {}, life = 3) =>
  game(
    {
      leader: { card: PLAIN_BLUE, don: leader },
      characters: [
        { card: ID, don: self, ...over },
        { card: V.c1, don: other },
      ],
      costArea: { active: 1, rested: 1 },
      life: Array.from({ length: life }, () => V.c6),
    },
    { leader: PLAIN_PURPLE },
  );
const pw = (g: ReturnType<typeof mk>, id: string): number => g.power(id) ?? 0;
const me = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);
const act = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'activate', card: me(g), ability: 'activate-main', player: 'p1' });
const offered = (g: ReturnType<typeof mk>) =>
  g.isLegal({ type: 'activate', card: me(g), ability: 'activate-main', player: 'p1' });
const given = (g: ReturnType<typeof mk>) => ({
  leader: g.card(g.leader('p1')).don,
  me: g.card(me(g)).don,
  other: g.card(g.find('p1', 'characters', V.c1)).don,
});

describe('ST28-004 Kouzuki Momonosuke', () => {
  describe('[Your Turn] Leader +1000 power with 2 or less Life', () => {
    it('2 Life: +1000 on your turn (boundary), 3 Life: none', () => {
      const two = mk(0, 0, 0, {}, 2);
      const three = mk(0, 0, 0, {}, 3);
      expect(pw(two, two.leader('p1'))).toBe(pw(three, three.leader('p1')) + 1000);
    });

    it('0 Life still counts, and it is [Your Turn] only', () => {
      const none = mk(0, 0, 0, {}, 0);
      const base = mk(0, 0, 0, {}, 3);
      expect(pw(none, none.leader('p1'))).toBe(pw(base, base.leader('p1')) + 1000);
      const theirs = game(
        { leader: PLAIN_BLUE, characters: [ID], life: [V.c6, V.c6] },
        { leader: PLAIN_PURPLE },
        { activePlayer: 'p2', turn: 4 },
      );
      expect(theirs.power(theirs.leader('p1'))).toBe(pw(base, base.leader('p1')));
    });
  });

  describe('[Activate: Main] return 2 given DON!! to the cost area rested', () => {
    it('is not offered with fewer than 2 given DON!! (active and rested DON!! in the cost area do not count)', () => {
      expect(offered(mk(0, 0))).toBe(false);
      expect(offered(mk(1, 0))).toBe(false);
      expect(offered(mk(0, 1))).toBe(false); // its own DON!! alone is one
      expect(offered(mk(1, 1))).toBe(true);
    });

    it('two DON!! given to different cards: both return rested, and it gains [Rush] and +1000', () => {
      const g = mk(1, 1, 0, { playedThisTurn: true });
      const before = don(g, 'p1');
      const power = pw(g, me(g));
      expect(g.legal().some((a) => a.type === 'attack' && a.attacker === me(g))).toBe(false);
      act(g);
      expect(given(g)).toEqual({ leader: 0, me: 0, other: 0 });
      expect(don(g, 'p1')).toMatchObject({
        active: before.active,
        rested: before.rested + 2,
        deck: before.deck, // not returned to the DON!! deck
      });
      expect(g.card(me(g)).keywords).toContain('Rush');
      // Its own 1 given DON!! (+1000) is gone, and the ability gives +1000: 7000 + 1000.
      expect(g.power(me(g))).toBe(power - 1000 + 1000);
      expect(g.legal().some((a) => a.type === 'attack' && a.attacker === me(g))).toBe(true);
    });

    it('with more given than needed it asks which, any split; both from one card is allowed', () => {
      const g = mk(2, 0, 1);
      act(g);
      const d = expectDecision(g, 'choose', 'p1');
      expect([d.min, d.max]).toEqual([2, 2]);
      for (const card of [g.leader('p1'), g.leader('p1')].sort())
        g.act({ type: 'pick', choice: { from: 'given', card } as never });
      expect(given(g)).toEqual({ leader: 0, me: 0, other: 1 });
      expect(g.card(me(g)).keywords).toContain('Rush');
    });

    it('Once Per Turn: not offered again after use, even with more given DON!!', () => {
      const g = mk(4, 0);
      act(g);
      // One card holds them all: nothing to choose.
      expect(given(g).leader).toBe(2);
      expect(offered(g)).toBe(false);
    });

    it('the boost and Rush last for this turn only', () => {
      const g = mk(1, 1);
      act(g);
      expect(g.card(me(g)).keywords).toContain('Rush');
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      expect(g.card(me(g)).keywords).not.toContain('Rush');
    });
  });
});

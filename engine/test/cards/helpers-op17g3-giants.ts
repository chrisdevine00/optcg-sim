/** Shared body of the OP17-085 Dorry and OP17-092 Brogy tests (they are mirror images). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, none, pick, play, PLAIN_BLUE } from './helpers.ts';
import { ELBAPH_LEADER } from './helpers-op17g3.ts';

/** `self` is the card under test, `other` the one it fetches. */
export function giantTests(self: string, other: string, name: string): void {
  const start = (opts: { leader?: string; hand?: string[]; trash?: string[] } = {}) =>
    game(
      {
        leader: opts.leader ?? ELBAPH_LEADER,
        hand: opts.hand ?? [self, other, BLUE],
        trash: opts.trash,
        costArea: { active: 6, rested: 0 },
      },
      { leader: PLAIN_BLUE },
    );
  const chars = (g: ReturnType<typeof start>) =>
    g
      .zone('p1', 'characters')
      .map((c) => c.card)
      .sort();

  describe(`${self} ${name}`, () => {
    it('has +12 cost on the field and its printed cost elsewhere', () => {
      const g = start({ leader: PLAIN_BLUE });
      expect(g.card(g.find('p1', 'hand', self)).cost).toBe(5);
      play(g, self);
      expect(g.card(g.find('p1', 'characters', self)).cost).toBe(17);
    });

    it(`[On Play] with an {Elbaph} Leader: plays up to 1 [${other}] from your hand`, () => {
      const g = start();
      play(g, self);
      pick(g, [g.find('p1', 'hand', other)]);
      expect(chars(g)).toEqual([self, other].sort());
    });

    it(`[On Play] can play the [${other}] from your trash instead`, () => {
      const g = start({ hand: [self, BLUE], trash: [other] });
      play(g, self);
      pick(g, [g.find('p1', 'trash', other)]);
      expect(chars(g)).toEqual([self, other].sort());
    });

    it('"up to 1": may play nothing, and the Character lock still applies', () => {
      const g = start();
      play(g, self);
      none(g);
      expect(chars(g)).toEqual([self]);
      expectDecision(g, 'main', 'p1');
      const blue = g.find('p1', 'hand', BLUE);
      expect(g.legal().some((a) => a.type === 'playCard' && a.card === blue)).toBe(false);
    });

    it('then you cannot play Character cards during this turn', () => {
      const g = start();
      play(g, self);
      pick(g, [g.find('p1', 'hand', other)]);
      // The fetched card's own [On Play] has nothing to play (the first one is on the field).
      none(g);
      expectDecision(g, 'main', 'p1');
      const blue = g.find('p1', 'hand', BLUE);
      expect(g.legal().some((a) => a.type === 'playCard' && a.card === blue)).toBe(false);
    });

    it('without an {Elbaph} Leader nothing is played and Characters can still be played', () => {
      const g = start({ leader: PLAIN_BLUE });
      play(g, self);
      expectDecision(g, 'main', 'p1');
      expect(chars(g)).toEqual([self]);
      const blue = g.find('p1', 'hand', BLUE);
      expect(g.legal().some((a) => a.type === 'playCard' && a.card === blue)).toBe(true);
    });
  });
}

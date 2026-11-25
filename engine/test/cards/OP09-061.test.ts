/** OP09-061 Monkey.D.Luffy (Leader). */
import { describe, expect, it } from 'vitest';
import { addMost, BLUE, dec, don, expectDecision, game, payDon, PLAIN_BLUE, V } from './helpers.ts';
import { plantRun, returnNow } from './helpers-w5c1.ts';

const ID = 'OP09-061';
const turn = (given = 0, active = 4) =>
  game(
    {
      leader: { card: ID, don: given },
      characters: [BLUE, V.c3],
      costArea: { active, rested: 0 },
    },
    { leader: PLAIN_BLUE, characters: [V.c3] },
  );
const cost = (g: ReturnType<typeof turn>, p: 'p1' | 'p2', c: string) =>
  g.card(g.find(p, 'characters', c)).cost;

describe('OP09-061 Monkey.D.Luffy', () => {
  describe('[DON!! x1] all of your Characters gain +1 cost', () => {
    it("with a DON!! given to the Leader: +1 cost for each of your Characters, not the opponent's", () => {
      const g = turn(1);
      expect(cost(g, 'p1', BLUE)).toBe(2);
      expect(cost(g, 'p1', V.c3)).toBe(4);
      expect(cost(g, 'p2', V.c3)).toBe(3);
    });

    it('without a DON!! given: no change', () => {
      const g = turn(0);
      expect(cost(g, 'p1', BLUE)).toBe(1);
      expect(cost(g, 'p1', V.c3)).toBe(3);
    });

    it('2 DON!! given is still +1 (it is not per DON!!)', () => {
      const g = turn(2);
      expect(cost(g, 'p1', V.c3)).toBe(4);
    });

    it('a DON!! given to a Character instead of the Leader does not turn it on', () => {
      const g = game(
        { leader: ID, characters: [{ card: BLUE, don: 1 }], costArea: { active: 4, rested: 0 } },
        { leader: PLAIN_BLUE },
      );
      expect(cost(g, 'p1', BLUE)).toBe(1);
    });
  });

  describe('[Your Turn] [Once Per Turn] when 2 or more DON!! are returned', () => {
    it('adds 1 DON!! as active and 1 additional DON!! rested', () => {
      const g = turn();
      returnNow(g, BLUE, 2);
      addMost(g, 2);
      // 4 on the field - 2 returned + 2 added: 1 active added, 1 rested added.
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, deck: 6 });
      expect(dec(g)?.kind).toBe('main');
    });

    it('"up to 1" each: the second may be declined while the first is taken', () => {
      const g = turn();
      returnNow(g, BLUE, 2);
      const first = expectDecision(g, 'choose', 'p1');
      g.act({ type: 'pick', choice: { option: first.options![0]!.id } });
      const second = expectDecision(g, 'choose', 'p1');
      expect(second.options?.map((o) => o.id)).toContain('0');
      g.act({ type: 'pick', choice: { option: '0' } });
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
    });

    it('1 returned does not fire it', () => {
      const g = turn();
      returnNow(g, BLUE, 1);
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0, deck: 7 });
    });

    it('once per turn', () => {
      const g = turn();
      returnNow(g, BLUE, 2);
      addMost(g, 2);
      returnNow(g, BLUE, 2);
      payDon(g); // which DON!! go back (active and rested are both on the field)
      expect(dec(g)?.kind).toBe('main');
      expect(don(g, 'p1').deck).toBe(8);
      expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(2);
    });

    it("not on the opponent's turn", () => {
      const g = game(
        { leader: ID, characters: [BLUE], costArea: { active: 4, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [V.c3] },
        { turn: 4, activePlayer: 'p2' },
      );
      plantRun(g, 'p2', V.c3, [{ do: { returnDon: { n: 2, player: 'opponent' } } }]);
      while (dec(g)?.kind === 'choose') g.act(g.legal().find((a) => a.type === 'pick')!);
      expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0, deck: 8 });
    });
  });
});

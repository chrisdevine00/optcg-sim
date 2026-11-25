/** ST22-005 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { dec, don, endCounter, expectDecision, hand, passBlock, pick, trash } from './helpers.ts';
import { activateAb, at, canActivate, choices, isRested, mk, V, WB4, WB5 } from './helpers-lfb.ts';

const ID = 'ST22-005';

describe('ST22-005 Kouzuki Oden', () => {
  describe('replacement', () => {
    /** p2 owns Oden; p1's effects hit it. */
    const start = (p2Hand: string[] = [WB4, WB5, V.c1]) =>
      mk(
        { characters: [V.c7] },
        { characters: [{ card: ID, rested: true }], hand: p2Hand as never },
      );
    type G = ReturnType<typeof start>;
    const oden = (g: G) => g.find('p2', 'characters', ID);
    const asked = (g: G) => dec(g)?.kind === 'optional' && dec(g)?.purpose === 'replacement';
    const alive = (g: G) => g.zone('p2', 'characters').some((c) => c.card === ID);
    const koEffect = (g: G, by: 'p1' | 'p2' = 'p1') =>
      (g.state = applyOp(g.state, { op: 'ko', card: oden(g), by }).state);

    it("removed by the opponent's effect (a K.O.): you may trash 2 cards from your hand instead", () => {
      const g = start();
      koEffect(g);
      expect(asked(g)).toBe(true);
      g.act({ type: 'optional', accept: true });
      pick(g, [g.find('p2', 'hand', WB4), g.find('p2', 'hand', V.c1)]);
      expect(alive(g)).toBe(true);
      expect(trash(g, 'p2')).toHaveLength(2);
      expect(hand(g, 'p2')).toEqual([WB5]);
    });

    it('declining lets it be removed and costs nothing', () => {
      const g = start();
      koEffect(g);
      g.act({ type: 'optional', accept: false });
      expect(alive(g)).toBe(false);
      expect(hand(g, 'p2')).toHaveLength(3);
    });

    it('with fewer than 2 cards in hand only declining is legal', () => {
      const g = start([V.c1]);
      koEffect(g);
      expect(asked(g)).toBe(true);
      expect(g.legal().filter((a) => a.type === 'optional')).toEqual([
        { type: 'optional', accept: false, player: 'p2' },
      ]);
    });

    it('must not fire: your own effect, or a K.O. in battle, is not replaced', () => {
      const g = start();
      koEffect(g, 'p2');
      expect(asked(g)).toBe(false);
      expect(alive(g)).toBe(false);
      const h = start();
      // p1's Character attacks the rested Oden: it is K.O.'d in battle with no offer.
      h.act({ type: 'attack', attacker: h.find('p1', 'characters', V.c7), target: oden(h) });
      passBlock(h);
      endCounter(h);
      expect(asked(h)).toBe(false);
      expect(alive(h)).toBe(false);
    });

    it('is not Once Per Turn: a second removal the same turn is offered again', () => {
      const g = start([V.c1, V.c2, V.c3, V.c4]);
      koEffect(g);
      g.act({ type: 'optional', accept: true });
      pick(g, [g.find('p2', 'hand', V.c1), g.find('p2', 'hand', V.c2)]);
      koEffect(g);
      expect(asked(g)).toBe(true);
    });
  });

  describe('[Activate: Main] [Once Per Turn]', () => {
    const start = (extra: Record<string, unknown> = {}) =>
      mk({
        characters: [{ card: ID, rested: true }, V.c1, V.c2],
        costArea: { active: 4, rested: 0 },
        ...extra,
      });

    it('rest 3 DON!! and return 1 of your other Characters to your hand: set this Character as active', () => {
      const g = start();
      activateAb(g, at(g, 'p1', 'characters', ID), 'untap');
      expectDecision(g, 'choose', 'p1');
      // Not Oden himself.
      expect(choices(g).sort()).toEqual(
        [at(g, 'p1', 'characters', V.c1), at(g, 'p1', 'characters', V.c2)].sort(),
      );
      pick(g, [at(g, 'p1', 'characters', V.c1)]);
      expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(false);
      expect(hand(g, 'p1')).toContain(V.c1);
      expect(
        g
          .zone('p1', 'characters')
          .map((c) => c.card)
          .sort(),
      ).toEqual([ID, V.c2].sort());
      expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 3 });
    });

    it('is Once Per Turn', () => {
      const g = start({ costArea: { active: 8, rested: 0 } });
      activateAb(g, at(g, 'p1', 'characters', ID), 'untap');
      pick(g, [at(g, 'p1', 'characters', V.c1)]);
      expect(canActivate(g, at(g, 'p1', 'characters', ID), 'untap')).toBe(false);
    });

    it('must not be offered with 2 active DON!! or with no other Character', () => {
      const g = start({ costArea: { active: 2, rested: 0 } });
      expect(canActivate(g, at(g, 'p1', 'characters', ID), 'untap')).toBe(false);
      const h = start({ characters: [{ card: ID, rested: true }] });
      expect(canActivate(h, at(h, 'p1', 'characters', ID), 'untap')).toBe(false);
    });

    it('an active Oden can still use it (the cost is paid, nothing changes)', () => {
      const g = start({ characters: [ID, V.c1] });
      activateAb(g, at(g, 'p1', 'characters', ID), 'untap');
      expect(isRested(g, at(g, 'p1', 'characters', ID))).toBe(false);
      expect(hand(g, 'p1')).toEqual([V.c1]);
    });
  });
});

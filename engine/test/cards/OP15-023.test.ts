/** OP15-023 Arlong. */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
  V,
} from './helpers.ts';
import { activate, canPick, koBy, offeredAb } from './helpers-w3s.ts';

const ID = 'OP15-023';
const rested = (card: string) => ({ card, rested: true });

describe('OP15-023 Arlong', () => {
  describe('[On K.O.] up to 2 rested cards will not become active', () => {
    const start = () =>
      game(
        { leader: PLAIN_PURPLE, characters: [ID] },
        {
          leader: rested(PLAIN_BLUE),
          characters: [rested(PURPLE), rested(V.c1), rested(V.c2), V.c3],
          costArea: { active: 0, rested: 2 },
        },
      );

    it('offers only rested cards (the Leader too, not an active Character, not DON!!)', () => {
      const g = start();
      koBy(g, 'p1', ID, 'p2');
      expectDecision(g, 'choose', 'p1');
      for (const c of [PURPLE, V.c1, V.c2])
        expect(canPick(g, g.find('p2', 'characters', c))).toBe(true);
      expect(canPick(g, g.leader('p2'))).toBe(true);
      expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
      expect(canPick(g, g.leader('p1'))).toBe(false);
    });

    it('2 are chosen and stay rested through the opponent’s next Refresh Phase; the others untap', () => {
      const g = start();
      koBy(g, 'p1', ID, 'p2');
      pick(g, [g.find('p2', 'characters', PURPLE), g.find('p2', 'characters', V.c1)]);
      g.act({ type: 'endTurn' });
      expectDecision(g, 'main', 'p2');
      expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
      expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(false);
      expect(g.card(g.leader('p2')).rested).toBe(false);
      // The DON!! cards are not affected.
      expect(don(g, 'p2').rested).toBe(0);
    });

    it('"up to 2": at most 2 can be picked, and none is allowed', () => {
      const g = start();
      koBy(g, 'p1', ID, 'p2');
      pick(g, [g.find('p2', 'characters', PURPLE), g.find('p2', 'characters', V.c1)]);
      // A third is not offered after the second (the choice is already complete).
      expectDecision(g, 'main', 'p1');
      const h = start();
      koBy(h, 'p1', ID, 'p2');
      none(h);
      h.act({ type: 'endTurn' });
      expect(h.card(h.find('p2', 'characters', PURPLE)).rested).toBe(false);
    });

    it('it is only for the next Refresh Phase: the one after untaps them', () => {
      const g = start();
      koBy(g, 'p1', ID, 'p2');
      pick(g, [g.find('p2', 'characters', PURPLE)]);
      g.act({ type: 'endTurn' }); // p2 turn 4: still rested
      expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(true);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' }); // p2 turn 6
      expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(false);
    });
  });

  describe('[Activate: Main] give a DON!! from the opponent’s cost area', () => {
    const start = (active: number, restedDon: number, chars: string[] = [PURPLE]) =>
      game(
        { leader: PLAIN_PURPLE, characters: [ID] },
        { leader: PLAIN_BLUE, characters: chars, costArea: { active, rested: restedDon } },
      );
    const go = (g: ReturnType<typeof start>) =>
      activate(g, g.find('p1', 'characters', ID), 'give-don');

    it('the cost gives a rested DON!!; the effect then gives 1 DON!! of either kind, to the Leader or a Character', () => {
      const g = start(0, 3);
      go(g); // the only Character takes the cost's DON!!
      expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
      expect(canPick(g, g.leader('p2'))).toBe(true);
      pick(g, [g.leader('p2')]);
      expect(g.card(g.leader('p2')).don).toBe(1);
      expect(don(g, 'p2')).toMatchObject({ active: 0, rested: 1, given: 2 });
    });

    it('with active and rested DON!! left, the giver chooses the kind', () => {
      const g = start(2, 2);
      go(g);
      expectDecision(g, 'choose', 'p1');
      const kinds = g.legal().flatMap((a) => (a.type === 'pick' ? [a.choice] : []));
      expect(kinds).toContainEqual({ from: 'costActive' });
      expect(kinds).toContainEqual({ from: 'costRested' });
      g.act({ type: 'pick', choice: { from: 'costActive' } });
      pick(g, [g.find('p2', 'characters', PURPLE)]);
      expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, given: 2 });
    });

    it('the cost needs a rested DON!! (active ones do not pay it) and an opposing Character', () => {
      const a = start(3, 0);
      expect(offeredAb(a, a.find('p1', 'characters', ID), 'give-don')).toBe(false);
      const b = start(0, 2, []);
      expect(offeredAb(b, b.find('p1', 'characters', ID), 'give-don')).toBe(false);
    });

    it('Once Per Turn, and "up to 1" lets the effect give nothing', () => {
      const g = start(0, 3);
      go(g);
      none(g);
      expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
      expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
    });
  });
});

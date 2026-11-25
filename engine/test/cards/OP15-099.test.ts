/** OP15-099 Urouge. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  none,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import {
  activate,
  canAcceptNow,
  mine,
  offered,
  offeredAb,
  rep,
  SUPERNOVAS_LEADER,
} from './helpers-lfa.ts';

const ID = 'OP15-099';
/** {Fallen Monk Pirates} {Supernovas} vanilla (cost 5) and a {Supernovas} Character in a hand. */
const SUPERNOVA = 'OP10-101';

describe('OP15-099 Urouge', () => {
  describe('[On Play] you may trash 1 {Supernovas} card from your hand: this Character gains [Rush] during this turn', () => {
    const start = (handCards: string[]) =>
      mine(SUPERNOVAS_LEADER, { hand: [ID, ...handCards] }, {}, 6);
    const urouge = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

    it('paying the cost gives [Rush] and he can attack on the turn he is played', () => {
      const g = start([SUPERNOVA, V.c1]);
      play(g, ID);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      // Only the {Supernovas} card can be trashed.
      expect(offered(g)).toEqual([g.find('p1', 'hand', SUPERNOVA)]);
      pick(g, [g.find('p1', 'hand', SUPERNOVA)]);
      expect(trash(g, 'p1')).toEqual([SUPERNOVA]);
      expect(hand(g, 'p1')).toEqual([V.c1]);
      expect(g.card(urouge(g)).keywords).toContain('Rush');
      expect(
        g.isLegal({ type: 'attack', attacker: urouge(g), target: g.leader('p2'), player: 'p1' }),
      ).toBe(true);
    });

    it('declining leaves the hand alone and gives no [Rush]: he cannot attack this turn', () => {
      const g = start([SUPERNOVA]);
      play(g, ID);
      decline(g);
      expect(hand(g, 'p1')).toEqual([SUPERNOVA]);
      expect(g.card(urouge(g)).keywords).not.toContain('Rush');
      expect(
        g.isLegal({ type: 'attack', attacker: urouge(g), target: g.leader('p2'), player: 'p1' }),
      ).toBe(false);
    });

    it('without a {Supernovas} card in the hand the cost cannot be paid: no [Rush]', () => {
      const g = start([V.c1, V.c2]);
      play(g, ID);
      expectDecision(g, 'optional', 'p1');
      expect(canAcceptNow(g)).toBe(false);
      decline(g);
      expect(g.card(urouge(g)).keywords).not.toContain('Rush');
      expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    });

    it('[Rush] lasts this turn only', () => {
      const g = start([SUPERNOVA]);
      play(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', SUPERNOVA)]);
      g.act({ type: 'endTurn' });
      g.act({ type: 'endTurn' });
      expect(g.card(urouge(g)).keywords).not.toContain('Rush');
    });
  });

  describe('[Activate: Main] you may turn 1 card from the top of your Life face-down: give up to 1 rested DON!! to your Leader or 1 of your Characters', () => {
    const AB = 'give-don';
    const start = (life: { card: string; faceUp: boolean }[], rested = 2) =>
      mine(SUPERNOVAS_LEADER, { characters: [ID, V.c1], life }, {}, 0, rested);
    const up = (n: number, down = 0) => [
      ...rep(n, V.c3).map((card) => ({ card, faceUp: true })),
      ...rep(down, V.c3).map((card) => ({ card, faceUp: false })),
    ];

    it('turns the top Life card face-down and gives 1 rested DON!! to the Leader', () => {
      const g = start(up(3));
      activate(g, g.find('p1', 'characters', ID), AB);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(g.zone('p1', 'life')[1]!.faceUp).toBe(true);
      expectDecision(g, 'choose', 'p1');
      expect(offered(g)).toContain(g.leader('p1'));
      expect(offered(g)).toContain(g.find('p1', 'characters', V.c1));
      pick(g, [g.leader('p1')]);
      expect(g.card(g.leader('p1')).don).toBe(1);
      expect(don(g, 'p1')).toMatchObject({ rested: 1 });
    });

    it('it can be given to a Character instead, including Urouge himself', () => {
      const g = start(up(1));
      activate(g, g.find('p1', 'characters', ID), AB);
      pick(g, [g.find('p1', 'characters', ID)]);
      expect(g.card(g.find('p1', 'characters', ID)).don).toBe(1);
    });

    it('"up to 1": the DON!! can be left, but the Life card stays face-down (the cost is paid)', () => {
      const g = start(up(1));
      activate(g, g.find('p1', 'characters', ID), AB);
      none(g);
      expect(g.card(g.leader('p1')).don).toBe(0);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(don(g, 'p1')).toMatchObject({ rested: 2 });
    });

    it('not offered when the top Life card is already face-down, even with a face-up card below it', () => {
      const g = start([
        { card: V.c3, faceUp: false },
        { card: V.c3, faceUp: true },
      ]);
      expect(offeredAb(g, g.find('p1', 'characters', ID), AB)).toBe(false);
    });

    it('not offered with no Life cards', () => {
      const g = start([]);
      expect(offeredAb(g, g.find('p1', 'characters', ID), AB)).toBe(false);
    });

    it('with no rested DON!! the cost is paid and nothing is given', () => {
      const g = start(up(2), 0);
      activate(g, g.find('p1', 'characters', ID), AB);
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
      expect(dec(g)?.kind).not.toBe('choose');
      expect(g.card(g.leader('p1')).don).toBe(0);
    });
  });
});

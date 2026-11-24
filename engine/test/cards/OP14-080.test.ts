/** OP14-080 Gecko Moria (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, trash, V } from './helpers.ts';
import { BW5, canActivate, game, idsOf, PLAIN_BLUE, rep, TBP4 } from './helpers-op14g3.ts';

const ID = 'OP14-080';

describe('OP14-080 Gecko Moria', () => {
  describe('[Activate: Main] [Once Per Turn] you may K.O. 1 of your {Thriller Bark Pirates} Characters', () => {
    const start = (chars: string[]) =>
      game({ leader: ID, characters: chars }, { leader: PLAIN_BLUE, characters: [V.c2] });
    const act = (g: ReturnType<typeof start>) =>
      g.act({ type: 'activate', card: g.leader('p1'), ability: 'activate' });

    it('your Leader and all of your Characters gain +1000 power during this turn', () => {
      const g = start([TBP4, V.c1, V.c3]);
      act(g);
      expect(idsOf(g, 'p1', 'trash')).toEqual([TBP4]);
      expect(g.power(g.leader('p1'))).toBe(6000);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(4000);
      expect(g.power(g.find('p1', 'characters', V.c3))).toBe(6000);
      expect(g.power(g.find('p2', 'characters', V.c2))).toBe(4000); // the opponent's are unaffected
      expect(g.power(g.leader('p2'))).toBe(5000);
    });

    it("the K.O.'d Character gets no bonus (it is gone) and the bonus ends with the turn", () => {
      const g = start([TBP4, V.c1]);
      act(g);
      g.act({ type: 'endTurn' });
      expect(g.power(g.leader('p1'))).toBe(5000);
      expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
    });

    it('with two {Thriller Bark Pirates} Characters you choose which; others are not candidates', () => {
      const g = start([TBP4, 'OP06-087', V.c1]);
      act(g);
      expectDecision(g, 'choose', 'p1');
      expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
      pick(g, [g.find('p1', 'characters', 'OP06-087')]);
      expect(idsOf(g, 'p1', 'trash')).toEqual(['OP06-087']);
    });

    it('cannot be activated without one, and only once per turn', () => {
      const g = start([BW5, V.c1]);
      expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
      const h = start([TBP4, 'OP06-094']);
      act(h);
      pick(h, [h.find('p1', 'characters', 'OP06-094')]);
      expect(canActivate(h, h.leader('p1'), 'activate')).toBe(false);
    });
  });

  describe('[When Attacking] you may trash 3 cards from your hand: add up to 1 card from the top of your deck to the top of your Life cards', () => {
    const start = (hnd: string[]) =>
      game({ leader: ID, hand: hnd, deck: [V.c4, V.c5, V.c6] }, { leader: PLAIN_BLUE });
    const attack = (g: ReturnType<typeof start>) =>
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });

    it('trash 3, then the top card of the deck goes to the top of your Life', () => {
      const g = start(rep(4, V.c1));
      attack(g);
      accept(g);
      pick(g, [
        g.find('p1', 'hand', V.c1, 0),
        g.find('p1', 'hand', V.c1, 1),
        g.find('p1', 'hand', V.c1, 2),
      ]);
      accept(g);
      expect(trash(g, 'p1')).toEqual(rep(3, V.c1));
      expect(hand(g, 'p1')).toEqual([V.c1]);
      expect(g.zone('p1', 'life')[0]!.card).toBe(V.c4);
      expect(g.life('p1')).toBe(4);
    });

    it('declining the optional cost: nothing is trashed or added', () => {
      const g = start(rep(4, V.c1));
      attack(g);
      decline(g);
      expect(hand(g, 'p1')).toHaveLength(4);
      expect(g.life('p1')).toBe(3);
    });

    it('with only 2 cards in hand the cost cannot be paid and nothing is asked', () => {
      const g = start(rep(2, V.c1));
      attack(g);
      // A hand cost is secret: the offer is shown, but accepting it is illegal.
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
      expect(g.life('p1')).toBe(3);
    });

    it('"up to 1": after paying, the card may be left on the deck', () => {
      const g = start(rep(3, V.c1));
      attack(g);
      accept(g);
      pick(g, [
        g.find('p1', 'hand', V.c1, 0),
        g.find('p1', 'hand', V.c1, 1),
        g.find('p1', 'hand', V.c1, 2),
      ]);
      decline(g);
      expect(g.life('p1')).toBe(3);
      expect(trash(g, 'p1')).toHaveLength(3);
    });
  });
});

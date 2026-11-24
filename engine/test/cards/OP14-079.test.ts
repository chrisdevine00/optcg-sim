/** OP14-079 Crocodile (Leader). */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, trash, V } from './helpers.ts';
import {
  BW1,
  BW5,
  canActivate,
  canPick,
  game,
  idsOf,
  PLAIN_BLUE,
  plantOn,
  rep,
  TBP8,
} from './helpers-op14g3.ts';

const ID = 'OP14-079';

describe('OP14-079 Crocodile', () => {
  const start = (p1chars: string[], p2chars: string[] = [V.c2]) =>
    game(
      { leader: ID, characters: p1chars, deck: rep(10, V.c1) },
      { leader: PLAIN_BLUE, characters: p2chars },
    );
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.leader('p1'), ability: 'activate' });

  describe("All of your opponent's Characters cannot be removed from the field by your effects", () => {
    const kill = [{ do: { ko: { from: 'characters', owner: 'opponent' } } }];

    it('your K.O. effect cannot remove their Character', () => {
      const g = start([V.c1]);
      plantOn(g, g.find('p1', 'characters', V.c1), kill);
      expect(idsOf(g, 'p2', 'characters')).toEqual([V.c2]);
      expect(idsOf(g, 'p2', 'trash')).toEqual([]);
    });

    it('control: with another Leader the same effect does K.O. it', () => {
      const g = game(
        { leader: 'ST03-001', characters: [V.c1] },
        { leader: PLAIN_BLUE, characters: [V.c2] },
      );
      plantOn(g, g.find('p1', 'characters', V.c1), kill);
      expect(idsOf(g, 'p2', 'trash')).toEqual([V.c2]);
    });

    it('your return-to-hand effect cannot remove it either', () => {
      const g = start([V.c1]);
      plantOn(g, g.find('p1', 'characters', V.c1), [
        { do: { move: { what: { from: 'characters', owner: 'opponent' }, to: { zone: 'hand' } } } },
      ]);
      expect(idsOf(g, 'p2', 'characters')).toEqual([V.c2]);
    });

    it('your own Characters can still be removed by your effects', () => {
      const g = start([V.c1, V.c3]);
      plantOn(g, g.find('p1', 'characters', V.c1), [
        { do: { ko: { from: 'characters', owner: 'you', filter: { name: 'Gordon' } } } },
      ]);
      const mine = [V.c1, V.c3];
      expect(idsOf(g, 'p1', 'characters').sort()).toEqual(mine.sort());
    });

    it("their own effects (and so the opponent's own removal) still remove their Characters", () => {
      const g = game(
        { leader: ID, characters: [V.c1] },
        { leader: PLAIN_BLUE, characters: [V.c2, V.c3] },
        { turn: 4, activePlayer: 'p2' },
      );
      plantOn(g, g.find('p2', 'characters', V.c2), [
        { do: { ko: { from: 'characters', owner: 'you', filter: { cost: { eq: 3 } } } } },
      ]);
      expect(idsOf(g, 'p2', 'trash')).toEqual([V.c3]);
    });
  });

  describe('[Activate: Main] [Once Per Turn] you may K.O. 1 of your {Baroque Works} Characters', () => {
    it('K.O. a Baroque Works Character: give up to 1 opposing Character -10 cost during this turn', () => {
      const g = start([BW5, V.c1]);
      act(g);
      // The only Baroque Works Character is the only candidate: the K.O. cost is paid with it.
      expect(idsOf(g, 'p1', 'trash')).toEqual([BW5]);
      expect(idsOf(g, 'p1', 'characters')).toEqual([V.c1]);
      pick(g, [g.find('p2', 'characters', V.c2)]);
      expect(g.card(g.find('p2', 'characters', V.c2)).cost).toBe(0); // 2 - 10, floored at 0
      expectDecision(g, 'optional', 'p1');
    });

    it('-10 is the full amount: a cost 8 Character is reduced to 0, not to 3', () => {
      const g = start([BW5], [TBP8]);
      act(g);
      pick(g, [g.find('p2', 'characters', TBP8)]);
      expect(g.card(g.find('p2', 'characters', TBP8)).cost).toBe(0);
    });

    it('then you may trash 2 cards from the top of your deck', () => {
      const g = start([BW5]);
      act(g);
      pick(g, [g.find('p2', 'characters', V.c2)]);
      accept(g);
      expect(trash(g, 'p1')).toEqual([BW5, V.c1, V.c1].sort());
      expect(g.zone('p1', 'deck')).toHaveLength(8);
    });

    it('the mill may be declined, and the cost reduction is "up to 1"', () => {
      const g = start([BW5]);
      act(g);
      none(g);
      decline(g);
      expect(g.card(g.find('p2', 'characters', V.c2)).cost).toBe(2);
      expect(g.zone('p1', 'deck')).toHaveLength(10);
    });

    it('a type that only includes the words counts: "Former Baroque Works" is a Baroque Works type', () => {
      const g = start(['ST30-013']);
      act(g);
      expect(idsOf(g, 'p1', 'trash')).toEqual(['ST30-013']);
    });

    it("with two Baroque Works Characters you choose which one is K.O.'d", () => {
      const g = start([BW5, BW1, V.c1]);
      act(g);
      expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
      pick(g, [g.find('p1', 'characters', BW1)]);
      expect(idsOf(g, 'p1', 'trash')).toEqual([BW1]);
    });

    it('cannot be activated without a Baroque Works Character, and only once per turn', () => {
      const g = start([V.c1]);
      expect(canActivate(g, g.leader('p1'), 'activate')).toBe(false);
      const h = start([BW5, BW1]);
      act(h);
      pick(h, [h.find('p1', 'characters', BW5)]);
      none(h);
      decline(h);
      expect(canActivate(h, h.leader('p1'), 'activate')).toBe(false);
    });
  });
});

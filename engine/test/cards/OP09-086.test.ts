/** OP09-086 Jesus Burgess. */
import { describe, expect, it } from 'vitest';
import { passBlock, V } from './helpers.ts';
import { BLACKBEARD_LEADER, koBy, mine, OTHER_LEADER, rep, theirs } from './helpers-lfa.ts';

const ID = 'OP09-086';
const chars = (g: ReturnType<typeof mine>) => g.zone('p1', 'characters').map((c) => c.card);
const power = (g: ReturnType<typeof mine>) => g.power(g.find('p1', 'characters', ID));

describe('OP09-086 Jesus Burgess', () => {
  describe("cannot be K.O.'d by your opponent's effects", () => {
    it("an opponent's effect cannot K.O. him, on either turn", () => {
      const mineTurn = mine(OTHER_LEADER, { characters: [ID] });
      koBy(mineTurn, 'p1', ID, 'p2');
      expect(chars(mineTurn)).toEqual([ID]);
      const theirTurn = theirs(OTHER_LEADER, { characters: [ID] });
      koBy(theirTurn, 'p1', ID, 'p2');
      expect(chars(theirTurn)).toEqual([ID]);
    });

    it('must not stop your own effect, nor a battle K.O.', () => {
      const own = mine(OTHER_LEADER, { characters: [ID] });
      koBy(own, 'p1', ID, 'p1');
      expect(chars(own)).toEqual([]);
      const g = theirs(
        OTHER_LEADER,
        { characters: [{ card: ID, rested: true }] },
        {
          characters: [V.c7],
        },
      );
      g.act({
        type: 'attack',
        attacker: g.find('p2', 'characters', V.c7),
        target: g.find('p1', 'characters', ID),
      });
      passBlock(g);
      g.act({ type: 'endCounter' });
      expect(chars(g)).toEqual([]);
    });
  });

  describe('with a {Blackbeard Pirates} Leader, +1000 power for every 4 cards in your trash', () => {
    const withTrash = (n: number, leader = BLACKBEARD_LEADER) =>
      mine(leader, { characters: [ID], trash: rep(n, V.c1) });

    it('boundaries: 3 cards +0, 4 cards +1000, 7 cards +1000, 8 cards +2000', () => {
      expect(power(withTrash(0))).toBe(5000);
      expect(power(withTrash(3))).toBe(5000);
      expect(power(withTrash(4))).toBe(6000);
      expect(power(withTrash(7))).toBe(6000);
      expect(power(withTrash(8))).toBe(7000);
      expect(power(withTrash(12))).toBe(8000);
    });

    it("it is live on the opponent's turn as well", () => {
      const g = theirs(BLACKBEARD_LEADER, { characters: [ID], trash: rep(4, V.c1) });
      expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
    });

    it("must not apply with another Leader, or count the opponent's trash", () => {
      expect(power(withTrash(8, OTHER_LEADER))).toBe(5000);
      const g = mine(BLACKBEARD_LEADER, { characters: [ID] }, { trash: rep(8, V.c1) });
      expect(power(g)).toBe(5000);
    });

    it("follows the trash as it changes: a card K.O.'d into the trash can lift it to the next step", () => {
      const g = mine(BLACKBEARD_LEADER, { characters: [ID, V.c1], trash: rep(3, V.c2) });
      expect(power(g)).toBe(5000);
      koBy(g, 'p1', V.c1, 'p1');
      expect(power(g)).toBe(6000);
    });
  });
});

/** OP12-102 Shirahoshi. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import { plant } from './helpers-op15g2.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { cardsIn, mk, NEPTUNIAN, SHIRAHOSHI2, SHIRAHOSHI4 } from './helpers-op12g3.ts';

const ID = 'OP12-102';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const life = (faceUp = false) => [
  { card: V.c1, faceUp },
  { card: V.c2, faceUp: false },
  { card: V.c3, faceUp: false },
];

/** p2's turn: p1 has these Characters; p2 K.O.s one with an effect (the pick is answered). */
const opponentTurn = (characters: string[], lifeCards = life()) =>
  mk({ characters, life: lifeCards }, {}, { turn: 4, activePlayer: 'p2' });

describe('OP12-102 Shirahoshi', () => {
  describe('"If your Character with a base cost of 6 or less would be removed from the field by your opponent\'s effect"', () => {
    it('you may turn the top Life card face-up instead: the Character stays', () => {
      const g = opponentTurn([ID, V.c6]);
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', V.c6)]);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([ID, V.c6].sort());
      expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
      expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
    });

    it('it covers Shirahoshi herself (base cost 2)', () => {
      const g = opponentTurn([ID]);
      plantOpponentEffect(g, koOne);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('declining lets the removal happen and leaves the Life face-down', () => {
      const g = opponentTurn([ID, V.c6]);
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', V.c6)]);
      decline(g);
      expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
      expect(g.zone('p1', 'life').every((c) => !c.faceUp)).toBe(true);
    });

    it('boundary: a Character with base cost 7 is not covered; nothing is offered', () => {
      const g = opponentTurn([ID, V.c7]);
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', V.c7)]);
      expectDecision(g, 'main', 'p2');
      expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('with the top Life card already face-up there is nothing to turn: the removal happens', () => {
      const g = opponentTurn([ID, V.c6], life(true));
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', V.c6)]);
      expectDecision(g, 'main', 'p2');
      expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    });

    it('does not cover your own effects: the K.O. goes through with nothing offered', () => {
      const g = mk({ characters: [ID, V.c6], life: life() });
      plant(g, 'p1', { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
      pick(g, [g.find('p1', 'characters', V.c6)]);
      expectDecision(g, 'main', 'p1');
      expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    });
  });

  describe("[Opponent's Turn] your Neptunian Characters gain +2000 power", () => {
    it("on the opponent's turn with no other [Shirahoshi] of base cost 2", () => {
      const g = mk({ characters: [ID, NEPTUNIAN, V.c4] }, {}, { turn: 4, activePlayer: 'p2' });
      expect(g.power(g.find('p1', 'characters', NEPTUNIAN))).toBe(7000 + 2000);
      expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
    });

    it('not on your own turn', () => {
      const g = mk({ characters: [ID, NEPTUNIAN] });
      expect(g.power(g.find('p1', 'characters', NEPTUNIAN))).toBe(7000);
    });

    it('another [Shirahoshi] with base cost 2 switches it off, one with base cost 4 does not', () => {
      const off = mk(
        { characters: [ID, SHIRAHOSHI2, NEPTUNIAN] },
        {},
        { turn: 4, activePlayer: 'p2' },
      );
      expect(off.power(off.find('p1', 'characters', NEPTUNIAN))).toBe(7000);
      const on = mk(
        { characters: [ID, SHIRAHOSHI4, NEPTUNIAN] },
        {},
        { turn: 4, activePlayer: 'p2' },
      );
      expect(on.power(on.find('p1', 'characters', NEPTUNIAN))).toBe(9000);
    });

    it('an opposing [Shirahoshi] with base cost 2 does not switch it off', () => {
      const g = mk(
        { characters: [ID, NEPTUNIAN] },
        { characters: [SHIRAHOSHI2] },
        { turn: 4, activePlayer: 'p2' },
      );
      expect(g.power(g.find('p1', 'characters', NEPTUNIAN))).toBe(9000);
    });
  });
});

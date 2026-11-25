/** ST25-003 Crocodile & Mihawk. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  canAccept,
  CG2,
  CG4,
  CG5,
  dec,
  decline,
  expectDecision,
  hand,
  ids,
  mk,
  none,
  opp,
  pick,
  pickable,
  play,
  plantOpponentEffect,
  trash,
  V,
} from './helpers-lfc.ts';

const ID = 'ST25-003';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };

describe('ST25-003 Crocodile & Mihawk', () => {
  describe('[On Play]', () => {
    it('draws 2, trashes 1, then plays a {Cross Guild} Character of cost 4 or less from hand', () => {
      const g = mk({ hand: [ID, CG2, CG5, V.c3] });
      play(g, ID);
      expect(hand(g, 'p1')).toHaveLength(5); // CG2, CG5, V.c3 and 2 drawn
      pick(g, [g.find('p1', 'hand', V.c3)]);
      expect(trash(g, 'p1')).toEqual([V.c3]);
      // Cost 2 {Cross Guild} is offered; cost 5 {Cross Guild} and the others are not.
      expect(pickable(g)).toEqual([g.find('p1', 'hand', CG2)]);
      pick(g, [g.find('p1', 'hand', CG2)]);
      expect(ids(g, 'p1', 'characters')).toEqual([ID, CG2]);
    });

    it('boundary: a cost 4 {Cross Guild} Character may be played, a cost 5 one may not', () => {
      const g = mk({ hand: [ID, CG4, CG5, V.c1] });
      play(g, ID);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(pickable(g)).toEqual([g.find('p1', 'hand', CG4)]);
    });

    it('"up to 1": the play may be declined; with no eligible card there is no prompt after the trash', () => {
      const g = mk({ hand: [ID, CG2, V.c1] });
      play(g, ID);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      none(g);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      const h = mk({ hand: [ID, CG5, V.c1] });
      play(h, ID);
      pick(h, [h.find('p1', 'hand', V.c1)]);
      // The play is asked at max 0 or skipped: either way nothing is played.
      if (dec(h)?.kind === 'choose') none(h);
      expect(ids(h, 'p1', 'characters')).toEqual([ID]);
    });

    it('the card trashed first cannot be the one played', () => {
      const g = mk({ hand: [ID, CG2], deck: [V.c1, V.c2, V.c3, V.c3] });
      play(g, ID);
      // Hand: CG2, c1, c2. Trash CG2: nothing eligible is left to play.
      pick(g, [g.find('p1', 'hand', CG2)]);
      if (dec(g)?.kind === 'choose') none(g);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      expect(trash(g, 'p1')).toEqual([CG2]);
    });
  });

  describe("[Once Per Turn] if your {Cross Guild} Character would be removed by your opponent's effect, you may trash 1 card from hand instead", () => {
    const theirs = (chars: string[], handCards: string[] = [V.c1, V.c3]) =>
      mk({ characters: chars, hand: handCards }, {}, opp);
    const koIt = (g: ReturnType<typeof theirs>, target: string) => {
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', target)]);
    };

    it('trashing 1 card keeps another {Cross Guild} Character on the field', () => {
      const g = theirs([ID, CG2]);
      koIt(g, CG2);
      expectDecision(g, 'optional', 'p1');
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(ids(g, 'p1', 'characters')).toEqual([ID, CG2]);
      expect(trash(g, 'p1')).toEqual([V.c1]);
    });

    it('also protects Crocodile & Mihawk itself; declining lets the K.O. happen', () => {
      const g = theirs([ID]);
      koIt(g, ID);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expect(ids(g, 'p1', 'characters')).toEqual([ID]);
      const h = theirs([ID, CG2]);
      koIt(h, CG2);
      decline(h);
      expect(ids(h, 'p1', 'characters')).toEqual([ID]);
      expect(trash(h, 'p1')).toEqual([CG2]);
    });

    it('once per turn in all: a second removal in the same turn is not replaced', () => {
      const g = theirs([ID, CG2, CG5]);
      koIt(g, CG2);
      accept(g);
      pick(g, [g.find('p1', 'hand', V.c1)]);
      expectDecision(g, 'main', 'p2');
      plantOpponentEffect(g, koOne);
      pick(g, [g.find('p1', 'characters', CG5)]);
      expect(dec(g)?.kind).not.toBe('optional');
      expect(ids(g, 'p1', 'characters')).not.toContain(CG5);
    });

    it('must not protect a Character without the type, nor stop your own effects', () => {
      const g = theirs([ID, V.c2]);
      koIt(g, V.c2);
      expect(dec(g)?.kind).not.toBe('optional');
      expect(ids(g, 'p1', 'characters')).not.toContain(V.c2);
      const own = theirs([ID, CG2]);
      own.state = applyOp(own.state, {
        op: 'ko',
        card: own.find('p1', 'characters', CG2),
        by: 'p1',
      }).state;
      expect(ids(own, 'p1', 'characters')).not.toContain(CG2);
    });

    it('with an empty hand the replacement cannot be accepted', () => {
      const g = theirs([ID, CG2], []);
      koIt(g, CG2);
      if (dec(g)?.kind === 'optional') {
        expect(canAccept(g)).toBe(false);
        decline(g);
      }
      expect(ids(g, 'p1', 'characters')).not.toContain(CG2);
    });
  });
});

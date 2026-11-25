/**
 * ST28-001 Ashura Doji (Character, Yellow, cost 3, 3000, Counter +1000, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: [On Play] If your Leader has the "Land of Wano" type and your opponent has 3 or more
 * Life cards, K.O. up to 1 of your opponent's Characters with a base cost of 5 or less.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  chars,
  fill,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  trash,
} from '../op17/kit-op17b.ts';
import { RED, hasEvent } from '../kit.ts';
import { inst, kind, LC, playRaw, SCL } from './kit-lfc.ts';

const DOJI = 'ST28-001';

function game(
  leader: string,
  oppLife: number,
  p2chars: (string | { card: string; rested?: boolean })[],
) {
  return mine(
    leader,
    { hand: [DOJI], deck: fill(BLUE, 6), costArea: { active: 3, rested: 0 } },
    { life: fill(RED, oppLife), characters: p2chars as string[] },
  );
}

describe('ST28-001 Ashura Doji: [On Play] with a "Land of Wano" Leader and an opponent with 3+ Life, K.O. a base cost 5 or less Character', () => {
  it('K.O.s the chosen Character; offers only opposing Characters of base cost 5 or less', () => {
    const g = game(LC.wano, 3, [SCL.c2, SCL.c5, SCL.c6, SCL.c8]);
    playRaw(g, DOJI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.c2, SCL.c5].sort());
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c5)]);
    expect(atMain(g)).toBe(true);
    expect(trash(g, 'p2')).toEqual([SCL.c5]);
    expect(chars(g, 'p2')).toEqual([SCL.c2, SCL.c6, SCL.c8].sort());
    expect(hasEvent(g, 'KO', {})).toBe(true);
  });

  it('boundary on Life: with exactly 3 Life cards it fires; with 2 it does not and asks nothing', () => {
    const g3 = game(LC.wano, 3, [SCL.c5]);
    playRaw(g3, DOJI);
    expect(kind(g3)).toBe('choose');
    const g2 = game(LC.wano, 2, [SCL.c5]);
    playRaw(g2, DOJI);
    expect(atMain(g2)).toBe(true);
    expect(chars(g2, 'p2')).toEqual([SCL.c5]);
    expect(trash(g2, 'p2')).toEqual([]);
  });

  it('with many Life cards (5) it fires', () => {
    const g = game(LC.wano, 5, [SCL.c3]);
    playRaw(g, DOJI);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c3)]);
    expect(trash(g, 'p2')).toEqual([SCL.c3]);
  });

  it('with a Leader that does not have the "Land of Wano" type it does nothing', () => {
    const g = game(LC.plain, 4, [SCL.c3]);
    playRaw(g, DOJI);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SCL.c3]);
  });

  it('base cost boundary: a cost 5 Character is offered, a cost 6 one is not', () => {
    const g = game(LC.wano, 4, [SCL.c5, SCL.c6]);
    playRaw(g, DOJI);
    expect(offeredIds(g)).toEqual([SCL.c5]);
  });

  it('"up to 1": may choose nothing, and nothing is K.O.ed', () => {
    const g = game(LC.wano, 4, [SCL.c5]);
    playRaw(g, DOJI);
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SCL.c5]);
  });

  it('a rested opposing Character can be K.O.ed too', () => {
    const g = game(LC.wano, 4, [{ card: SCL.c4, rested: true }]);
    playRaw(g, DOJI);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c4)]);
    expect(trash(g, 'p2')).toEqual([SCL.c4]);
  });

  it('never targets my own Characters (the Doji itself and my other Characters are not offered)', () => {
    const g = mine(
      LC.wano,
      { hand: [DOJI], characters: [SCL.c3], costArea: { active: 3, rested: 0 } },
      { characters: [SCL.c2], life: fill(RED, 4) },
    );
    playRaw(g, DOJI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCL.c2]);
    pickInst(g, [inst(g, 'p2', 'characters', SCL.c2)]);
    expect(chars(g, 'p1')).toEqual([SCL.c3, DOJI].sort());
  });

  it('with no opposing Characters the effect does nothing and does not fail the play', () => {
    const g = game(LC.wano, 4, []);
    playRaw(g, DOJI);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p1')).toEqual([DOJI]);
  });
});

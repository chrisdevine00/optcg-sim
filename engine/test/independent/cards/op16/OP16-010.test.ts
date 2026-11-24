/**
 * OP16-010 Namule (Character, Red, cost 1, 2000, Counter +2000, {Fish-Man}/{Whitebeard Pirates},
 * Strike).
 *
 * Card text: "[On Play] You may reveal 1 Character card with 8000 power from your hand: K.O. up to 1 of
 * your opponent's Characters with 2000 base power or less."
 *
 * Rules: CR 8-3-1 (costs), "base power" ignores effects and DON!! (CR 4-9-2), "up to 1" (CR 8-4-4-1),
 * CR 11-2-1 (revealed cards stay in hand).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  charIds,
  choices,
  describeEightKCost,
  gammaKnife,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  payHand,
  pickInst,
  playCard,
  SC2,
  trash,
  yes,
} from './kit-op16a.ts';

const NAMULE = 'OP16-010';

function playIt(extra: string[], p2chars: string[] = [OV.dadan2]) {
  const g = mine(OL.luffy, { hand: [NAMULE, ...extra] }, { characters: p2chars });
  playCard(g, NAMULE);
  return g;
}
function pay(p2chars: string[]) {
  const g = playIt([OV.thatch], p2chars);
  yes(g);
  payHand(g, [OV.thatch]);
  return g;
}

describeEightKCost({
  id: NAMULE,
  verb: 'reveal',
  start: (extra) => playIt(extra),
  afterPay: (g) => pickInst(g, [at(g, 'p2', 'characters', OV.dadan2)]),
  happened: (g) => charIds(g, 'p2').length === 0,
});

describe('OP16-010 Namule: [On Play] K.O. a 2000-base-power-or-less Character', () => {
  it('K.O.s the chosen Character, which goes to the opponent\'s trash', () => {
    const g = pay([OV.dadan2]);
    pickInst(g, [at(g, 'p2', 'characters', OV.dadan2)]);
    expect(charIds(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([OV.dadan2]);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: base power 2000 is a candidate, 3000 is not', () => {
    const g = pay([OV.dadan2, OV.komachiyo3]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
  });

  it('"or less": a Character with base power 0 is a candidate', () => {
    const g = pay([OV.cobra0, OV.sai4]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.cobra0]);
  });

  it('"base power": a 3000-base Character reduced to 0 this turn is still not a candidate', () => {
    const g = mine(
      OL.shanks,
      { hand: [SC2.gammaKnife, NAMULE, OV.thatch] },
      { characters: [OV.komachiyo3, OV.dadan2] },
    );
    gammaKnife(g, at(g, 'p2', 'characters', OV.komachiyo3));
    expect(g.power(at(g, 'p2', 'characters', OV.komachiyo3))).toBe(-2000);
    playCard(g, NAMULE);
    yes(g);
    payHand(g, [OV.thatch]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
  });

  it('K.O.s only one Character when two qualify', () => {
    const g = pay([OV.dadan2, OV.cobra0]);
    pickInst(g, [at(g, 'p2', 'characters', OV.cobra0)]);
    expect(charIds(g, 'p2')).toEqual([OV.dadan2]);
  });

  it('"up to 1": may choose nothing; the revealed card stays in hand', () => {
    const g = pay([OV.dadan2]);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p2')).toEqual([OV.dadan2]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('only opposing Characters are candidates (not the Leader, not mine)', () => {
    const g = mine(
      OL.luffy,
      { hand: [NAMULE, OV.thatch], characters: [OV.whiteyBay2] },
      { characters: [OV.dadan2] },
    );
    playCard(g, NAMULE);
    yes(g);
    payHand(g, [OV.thatch]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('with no qualifying Character the revealed cost is paid and nothing is K.O.\'d', () => {
    const g = pay([OV.hajrudin6]);
    expect(atMain(g)).toBe(true);
    expect(charIds(g, 'p2')).toEqual([OV.hajrudin6]);
  });
});

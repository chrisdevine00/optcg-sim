/**
 * OP16-006 Shanks (Character, Red, cost 4, 5000, Counter +2000, {The Four Emperors}/{Red-Haired
 * Pirates}, Slash).
 *
 * Card text: "[On Play] You may rest 2 of your DON!! cards: K.O. up to 1 of your opponent's Characters
 * with 4000 power or less."
 *
 * Rules: CR 8-3-1 (an unpayable cost cannot be paid), resting DON!! needs active DON!! (CR 6-5-5),
 * "up to 1" (CR 8-4-4-1), K.O. sends the Character to the trash (CR 10-2-17 [On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  charIds,
  choices,
  don,
  mine,
  need,
  no,
  none,
  OL,
  OV,
  offeredIds,
  payDon,
  pickInst,
  playCard,
  trash,
  unusable,
  yes,
  mayChooseNone,
} from './kit-op16a.ts';

const SHANKS = 'OP16-006';

function start(
  p2chars: string[],
  costArea = { active: 10, rested: 0 },
  mineChars: string[] = [],
) {
  const g = mine(OL.shanks, { hand: [SHANKS], costArea, characters: mineChars }, { characters: p2chars });
  playCard(g, SHANKS);
  return g;
}
/** Use the effect up to the target choice. */
function pay(p2chars: string[]) {
  const g = start(p2chars);
  yes(g);
  payDon(g, 2);
  return g;
}

describe('OP16-006 Shanks: [On Play] rest 2 DON!!: K.O. a 4000-or-less Character', () => {
  it('is asked whether to rest 2 DON!! when played', () => {
    const g = start([OV.sai4]);
    need(g, 'optional', 'p1');
  });

  it('paying rests exactly 2 more DON!! (4 for the play cost + 2) and K.O.s the chosen Character', () => {
    const g = pay([OV.sai4]);
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', OV.sai4)]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expect(charIds(g, 'p2')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([OV.sai4]);
    expect(atMain(g)).toBe(true);
  });

  it('boundary: 4000 power is a candidate, 5000 is not', () => {
    const g = pay([OV.sai4, OV.marco5]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.sai4]);
  });

  it('"or less": 3000 and 2000 power are candidates too', () => {
    const g = pay([OV.komachiyo3, OV.dadan2, OV.hajrudin6]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.dadan2, OV.komachiyo3].sort());
  });

  it('K.O.s only one Character even when several qualify', () => {
    const g = pay([OV.sai4, OV.komachiyo3]);
    pickInst(g, [at(g, 'p2', 'characters', OV.sai4)]);
    expect(charIds(g, 'p2')).toEqual([OV.komachiyo3]);
  });

  it('"up to 1": may choose nothing; the 2 DON!! stay rested (the cost was paid)', () => {
    const g = pay([OV.sai4]);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p2')).toEqual([OV.sai4]);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });

  it('declining pays nothing: only the play cost is rested and nothing is K.O.\'d', () => {
    const g = start([OV.sai4]);
    no(g);
    expect(don(g, 'p1')).toMatchObject({ active: 6, rested: 4 });
    expect(charIds(g, 'p2')).toEqual([OV.sai4]);
    expect(atMain(g)).toBe(true);
  });

  it('with only 1 active DON!! left after the play cost, the cost cannot be paid', () => {
    const g = start([OV.sai4], { active: 5, rested: 5 });
    unusable(g, 'p1');
    expect(charIds(g, 'p2')).toEqual([OV.sai4]);
    expect(atMain(g)).toBe(true);
  });

  it('rested DON!! cannot pay: with 0 active DON!! left the cost cannot be paid', () => {
    const g = start([OV.sai4], { active: 4, rested: 6 });
    unusable(g, 'p1');
    expect(charIds(g, 'p2')).toEqual([OV.sai4]);
  });

  it('exactly 2 active DON!! left after the play cost is enough', () => {
    const g = start([OV.sai4], { active: 6, rested: 4 });
    yes(g);
    payDon(g, 2);
    pickInst(g, [at(g, 'p2', 'characters', OV.sai4)]);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 10 });
    expect(charIds(g, 'p2')).toEqual([]);
  });

  it('only the opponent\'s Characters are candidates (not mine, not the Leader)', () => {
    const g = mine(
      OL.shanks,
      { hand: [SHANKS], characters: [OV.dadan2] },
      { characters: [OV.sai4] },
    );
    playCard(g, SHANKS);
    yes(g);
    payDon(g, 2);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.sai4]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('with no Character of 4000 or less nothing is K.O.\'d (the cost, once paid, stays paid)', () => {
    const g = pay([OV.marco5, OV.hajrudin6]);
    expect(atMain(g)).toBe(true);
    expect(charIds(g, 'p2')).toEqual([OV.marco5, OV.hajrudin6].sort());
    expect(don(g, 'p1')).toMatchObject({ rested: 6 });
  });
});

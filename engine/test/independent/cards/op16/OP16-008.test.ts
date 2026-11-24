/**
 * OP16-008 Squard (Character, Red, cost 5, 7000, no Counter, {Whitebeard Pirates Allies}, Slash).
 *
 * Card text: "[On Play] You may trash 1 of your Characters with 10000 base power: K.O. up to 1 of your
 * opponent's Characters with 8000 power or less."
 *
 * Rules: CR 8-3-1 (costs), trashing a Character is not a K.O. (RL-15, M6b-Q19 answered), "base
 * power" ignores DON!! and effects (CR 4-9-2), "up to 1" (CR 8-4-4-1), CR 10-2-17 ([On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  charIds,
  choices,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  OL,
  OV,
  offeredIds,
  payCost,
  pickInst,
  playCard,
  trash,
  unusable,
  yes,
} from './kit-op16a.ts';

const SQUARD = 'OP16-008';

function start(
  mineChars: (string | { card: string; don?: number })[],
  p2chars: string[] = [OV.thatch],
  p2Rested = false,
) {
  const g = mine(
    OL.luffy,
    { hand: [SQUARD], characters: mineChars, costArea: { active: 10 - 0, rested: 0 } },
    { characters: p2chars.map((c) => ({ card: c, rested: p2Rested })) },
  );
  playCard(g, SQUARD);
  return g;
}

describe('OP16-008 Squard: [On Play] trash a 10000-base Character: K.O. an 8000-or-less Character', () => {
  it('is asked whether to trash a Character when played with a 10000-base Character on my field', () => {
    const g = start([OV.accino10]);
    need(g, 'optional', 'p1');
  });

  it('the cost offers exactly my Characters with 10000 base power (not 9000 or 8000)', () => {
    const g = start([OV.accino10, OV.shiki10, OV.oars9, OV.thatch]);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([OV.accino10, OV.shiki10].sort());
  });

  it('"base power": an 8000-base Character with 2 DON!! given (10000 now) is not a candidate', () => {
    const g = mine(
      OL.luffy,
      {
        hand: [SQUARD],
        characters: [{ card: OV.thatch, don: 2 }, OV.accino10],
        costArea: { active: 8, rested: 0 },
      },
      { characters: [OV.hajrudin6] },
    );
    expect(g.power(at(g, 'p1', 'characters', OV.thatch))).toBe(10000);
    playCard(g, SQUARD);
    yes(g);
    payCost(g, [OV.accino10]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.hajrudin6]);
    expect(trash(g, 'p1')).toEqual([OV.accino10]);
    expect(charIds(g, 'p1').sort()).toEqual([OV.thatch, SQUARD].sort());
  });

  it('paying trashes the chosen Character (to trash, not K.O.) and then K.O.s the target', () => {
    const g = start([OV.accino10]);
    yes(g);
    payCost(g, [OV.accino10]);
    pickInst(g, [at(g, 'p2', 'characters', OV.thatch)]);
    expect(trash(g, 'p1')).toEqual([OV.accino10]);
    expect(trash(g, 'p2')).toEqual([OV.thatch]);
    expect(charIds(g, 'p1')).toEqual([SQUARD]);
    expect(charIds(g, 'p2')).toEqual([]);
    expect(atMain(g)).toBe(true);
    const kos = g.eventsOfType('KO');
    expect(kos).toHaveLength(1);
    expect(kos[0]!.card).toBe(OV.thatch);
  });

  it('boundary: the target may have 8000 power but not 9000', () => {
    const g = start([OV.accino10], [OV.thatch, OV.oars9]);
    yes(g);
    payCost(g, [OV.accino10]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });

  it('"or less": 4000 and 6000 power Characters are candidates too', () => {
    const g = start([OV.accino10], [OV.sai4, OV.hajrudin6, OV.accino10]);
    yes(g);
    payCost(g, [OV.accino10]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.hajrudin6, OV.sai4].sort());
  });

  it('K.O.s only one Character when several qualify', () => {
    const g = start([OV.accino10], [OV.thatch, OV.sai4]);
    yes(g);
    payCost(g, [OV.accino10]);
    pickInst(g, [at(g, 'p2', 'characters', OV.sai4)]);
    expect(charIds(g, 'p2')).toEqual([OV.thatch]);
  });

  it('"up to 1": may choose nothing; the cost is already paid', () => {
    const g = start([OV.accino10]);
    yes(g);
    payCost(g, [OV.accino10]);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p2')).toEqual([OV.thatch]);
    expect(trash(g, 'p1')).toEqual([OV.accino10]);
  });

  it('declining: nothing is trashed and nothing is K.O.\'d', () => {
    const g = start([OV.accino10]);
    no(g);
    expect(charIds(g, 'p1')).toEqual([OV.accino10, SQUARD].sort());
    expect(charIds(g, 'p2')).toEqual([OV.thatch]);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('with no 10000-base Character of mine the cost cannot be paid (Squard itself is 7000)', () => {
    const g = start([OV.thatch, OV.oars9]);
    unusable(g, 'p1');
    expect(charIds(g, 'p2')).toEqual([OV.thatch]);
    expect(atMain(g)).toBe(true);
  });

  it('an opponent\'s 10000-base Character cannot pay the cost', () => {
    const g = start([], [OV.accino10]);
    unusable(g, 'p1');
    expect(charIds(g, 'p2')).toEqual([OV.accino10]);
  });

  it('the Leader is never a K.O. target and my own Characters are not offered as targets', () => {
    const g = start([OV.accino10, OV.dadan2]);
    yes(g);
    payCost(g, [OV.accino10]);
    need(g, 'choose');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toEqual([OV.thatch]);
  });

  it('rested opposing Characters are valid K.O. targets too', () => {
    const g = start([OV.accino10], [OV.thatch], true);
    yes(g);
    payCost(g, [OV.accino10]);
    pickInst(g, [at(g, 'p2', 'characters', OV.thatch)]);
    expect(charIds(g, 'p2')).toEqual([]);
  });
});

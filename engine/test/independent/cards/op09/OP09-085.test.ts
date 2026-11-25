/**
 * OP09-085 Gecko Moria (Character, Black, cost 4, 5000, no Counter, {Thriller Bark Pirates}).
 *
 * Card text: "[On Play] Play up to 1 "Thriller Bark Pirates" type Character card with a cost of 2 or
 * less from your trash rested."
 *
 * Rules: "up to 1" may be 0; the played card enters rested (CR 3-7-5 and the card's "rested"); only
 * Character cards qualify (CR 2-2-4-2); my trash only. With 5 Characters a new one is played after
 * trashing one of mine as rule processing (CR 3-7-6-1), which is not a K.O. (CR 10-2-1-3).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  chr,
  choices,
  hand,
  kind,
  LD9,
  mayEnd,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  SC9,
  trash,
} from './kit-op09c.ts';

const MORIA = 'OP09-085';
const STAGE_TB = 'OP06-098'; // Black Stage, cost 1, {Thriller Bark Pirates}
const EVENT_TB = 'EB05-049'; // Black Event, cost 1, {Thriller Bark Pirates}

function board(trashCards: string[], p2trash: string[] = [], chars: string[] = []) {
  return mine(
    LD9.luffy,
    { hand: [MORIA], trash: trashCards, characters: chars },
    { trash: p2trash },
  );
}

describe('OP09-085 Gecko Moria: [On Play] play up to 1 {Thriller Bark Pirates} Character, cost 2 or less, from my trash rested', () => {
  it('printed values: Black Character, cost 4, 5000, no Counter', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', MORIA));
    expect(c.cost).toBe(4);
    expect(c.counter ?? null).toBeNull();
    playRaw(g, MORIA);
    expect(g.power(chr(g, 'p1', MORIA))).toBe(5000);
  });

  it('offers exactly the {Thriller Bark Pirates} Characters of cost 2 or less in my trash', () => {
    const g = board([SC9.tb1, SC9.tb2, SC9.tb3, SC9.tb4, SC9.c1, SC9.c2]);
    playRaw(g, MORIA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC9.tb1, SC9.tb2].sort());
  });

  it('cost boundary: cost 2 qualifies, cost 3 and cost 4 do not (nothing to pick, nothing played)', () => {
    const g = board([SC9.tb3, SC9.tb4]);
    playRaw(g, MORIA);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MORIA]);
    expect(trash(g)).toEqual([SC9.tb3, SC9.tb4].sort());
  });

  it('only Characters: a {Thriller Bark Pirates} Stage or Event of cost 1 is not offered', () => {
    const g = board([STAGE_TB, EVENT_TB, SC9.tb2]);
    playRaw(g, MORIA);
    expect(offeredIds(g)).toEqual([SC9.tb2]);
  });

  it('the type must be {Thriller Bark Pirates}: a plain cost-1 Character is not offered', () => {
    const g = board([SC9.c1, SC9.c2, SC9.tb1]);
    playRaw(g, MORIA);
    expect(offeredIds(g)).toEqual([SC9.tb1]);
  });

  it('the chosen Character enters play RESTED and leaves my trash', () => {
    const g = board([SC9.tb1, SC9.tb2]);
    playRaw(g, MORIA);
    pickCards(g, [SC9.tb2]);
    expect(atMain(g)).toBe(true);
    const played = g.zone('p1', 'characters').find((c) => c.card === SC9.tb2);
    expect(played).toBeTruthy();
    expect(played!.rested).toBe(true);
    expect(trash(g)).toEqual([SC9.tb1]);
  });

  it('Gecko Moria herself stays on the field, active', () => {
    const g = board([SC9.tb1]);
    playRaw(g, MORIA);
    pickCards(g, [SC9.tb1]);
    expect(g.card(chr(g, 'p1', MORIA)).rested).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('"up to 1": may choose nothing; the trash is unchanged', () => {
    const g = board([SC9.tb1, SC9.tb2]);
    playRaw(g, MORIA);
    need(g, 'choose', 'p1');
    expect(mayEnd(g)).toBe(true);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MORIA]);
    expect(trash(g)).toEqual([SC9.tb1, SC9.tb2].sort());
  });

  it('plays at most 1 Character even when several qualify', () => {
    const g = board([SC9.tb1, SC9.tb2]);
    playRaw(g, MORIA);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it("only my own trash: the opponent's {Thriller Bark Pirates} Characters are never offered", () => {
    const g = board([SC9.tb1], [SC9.tb2]);
    playRaw(g, MORIA);
    expect(offeredIds(g)).toEqual([SC9.tb1]);
  });

  it('the played card costs nothing: my DON!! are untouched by the effect', () => {
    const g = board([SC9.tb2]);
    playRaw(g, MORIA); // pays 4
    const before = g.zone('p1', 'characters').length;
    pickCards(g, [SC9.tb2]);
    expect(g.zone('p1', 'characters')).toHaveLength(before + 1);
    expect(hand(g)).toEqual([]);
  });

  it('with 4 other Characters the played Character forces one of them to the trash (not a K.O.)', () => {
    const g = board([SC9.tb1], [], [SC9.c1, SC9.c2, SC9.c3, SC9.c4]);
    // Moria is the 5th Character already? With 4 others the area holds 5 once Moria is played.
    playRaw(g, MORIA);
    pickCards(g, [SC9.tb1]);
    // Whatever was chosen to make room, the area never holds more than 5 and the card was played.
    while (kind(g) === 'choose') act(g, { type: 'pick', choice: choices(g)[0]! });
    expect(g.zone('p1', 'characters').length).toBeLessThanOrEqual(5);
    expect(g.zone('p1', 'characters').some((c) => c.card === SC9.tb1)).toBe(true);
    expect(trash(g)).toHaveLength(1);
  });
});

/**
 * OP15-007 Gin (Character, Red, cost 6, 7000, Counter +1000, {Krieg Pirates}/{East Blue}).
 *
 * Card text: "[On Play] If your Leader has the {East Blue} type, play up to 1 Character card with a
 * cost of 5 or less from your hand."
 *
 * Rules: CR 3-1-6 (playing by an effect pays no cost), CR 8-4-4-1 ("up to"), CR 3-7-6 (a sixth
 * Character forces a trash), CR 8-1-2 (the effect has no "may", only the target is optional).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  choices,
  don,
  hand,
  kind,
  LD15,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  S15,
  SCN,
  trash,
} from './kit-op15a.ts';

const GIN = 'OP15-007';

function board(
  leader: string = LD15.eastBlue,
  handCards: string[] = [],
  characters: string[] = [],
) {
  return mine(leader, { hand: [GIN, ...handCards], characters });
}

describe('OP15-007 Gin: [On Play] play a cost 5 or less Character with an {East Blue} Leader', () => {
  it('with an {East Blue} Leader it offers exactly the Characters with cost 5 or less in hand', () => {
    const g = board(LD15.eastBlue, [SCN.c3, SCN.c5, SCN.c6, S15.event]);
    playRaw(g, GIN);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c5].sort());
  });

  it('boundary: a cost 5 Character is offered, a cost 6 Character is not', () => {
    const g = board(LD15.eastBlue, [SCN.c5, SCN.c6]);
    playRaw(g, GIN);
    expect(offeredIds(g)).toEqual([SCN.c5]);
  });

  it('the chosen Character enters the field without paying its cost', () => {
    const g = board(LD15.eastBlue, [SCN.c5]);
    playRaw(g, GIN);
    pickInst(g, [at(g, 'p1', 'hand', SCN.c5)]);
    expect(chars(g)).toEqual([GIN, SCN.c5].sort());
    // Gin cost 6 only: 4 active left, nothing more rested.
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": nothing may be chosen, and then nothing is played', () => {
    const g = board(LD15.eastBlue, [SCN.c3]);
    playRaw(g, GIN);
    none(g);
    expect(chars(g)).toEqual([GIN]);
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('plays at most one Character even with two candidates in hand', () => {
    const g = board(LD15.eastBlue, [SCN.c3, SCN.c4]);
    playRaw(g, GIN);
    pickInst(g, [at(g, 'p1', 'hand', SCN.c3)]);
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([GIN, SCN.c3].sort());
    expect(hand(g)).toEqual([SCN.c4]);
  });

  it('without an {East Blue} Leader nothing is offered or played', () => {
    const g = board(LD15.luffy, [SCN.c3]);
    playRaw(g, GIN);
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([GIN]);
    expect(hand(g)).toEqual([SCN.c3]);
  });

  it('with no legal Character in hand the effect ends without a played card', () => {
    const g = board(LD15.eastBlue, [SCN.c6, S15.event]);
    playRaw(g, GIN);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([GIN]);
  });

  it('a played Character beyond the limit of 5 asks me to trash one of my Characters', () => {
    const g = board(LD15.eastBlue, [SCN.c3], [SCN.c1, SCN.c2, SCN.c4, SCN.c6]);
    playRaw(g, GIN);
    pickInst(g, [at(g, 'p1', 'hand', SCN.c3)]);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickInst(g, [at(g, 'p1', 'characters', SCN.c1)]);
    expect(chars(g)).toHaveLength(5);
    expect(trash(g)).toEqual([SCN.c1]);
    expect(chars(g)).toContain(SCN.c3);
  });
});

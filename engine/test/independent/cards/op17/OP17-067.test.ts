/**
 * OP17-067 Kurozumi Kanjuro (Character, Purple, cost 2, 3000, Counter +1000, {Land of Wano}/{Kurozumi Clan}).
 *
 * Card text: "[On Play] DON!! −1: If you have a Character with a cost of 10 or more, rest up to 1 of your
 * opponent's Characters."
 *
 * Rules: CR 8-3-1-6 / RD 86 (DON!! −X), RD 112 (the cost of an [On Play] may be declined), CR 8-3-3
 * (failed "if"), CR 8-4-4-1 ("up to"), CR 1-3-6-2 (cost as modified).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  at,
  choices,
  don,
  kind,
  LD,
  mine,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  pickCards,
  playCard,
  SCN,
  yes,
} from './kit-op17b.ts';

const KANJURO = 'OP17-067';

function play(chars: string[], opp: string[] = [SCN.c3, SCN.c8]) {
  const g = mine(
    LD.akp,
    { hand: [KANJURO], characters: chars, costArea: { active: 2, rested: 0 } },
    { characters: opp },
  );
  playCard(g, KANJURO);
  return g;
}

describe('OP17-067 Kurozumi Kanjuro: [On Play] DON!! −1: if you have a cost 10+ Character, rest up to 1 opposing Character', () => {
  it('with a cost-10 Character: returns 1 DON!!, and rests the chosen opposing Character', () => {
    const g = play([SCN.c10]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 1, deck: 9 });
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c3]);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c8)).rested).toBe(false);
  });

  it('there is no cost limit on the target: a cost-8 Character is a candidate, the Leader is not', () => {
    const g = play([SCN.c10]);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c8].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('only opposing Characters are candidates, never my own', () => {
    const g = play([SCN.c10, SCN.c2]);
    yes(g);
    expect(offeredIds(g)).not.toContain(SCN.c2);
    expect(offeredIds(g)).not.toContain(SCN.c10);
  });

  it('"up to 1": the target may be skipped after the DON!! is returned', () => {
    const g = play([SCN.c10]);
    yes(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(don(g)).toMatchObject({ deck: 9 });
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('rests only 1 even when several qualify', () => {
    const g = play([SCN.c10]);
    yes(g);
    pickCards(g, [SCN.c8]);
    expect(kind(g)).toBe('main');
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('boundary: a cost-9 Character does not satisfy "10 or more"; nothing is rested', () => {
    const g = play([SCN.c9]);
    if (kind(g) === 'optional') yes(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('a Character whose current cost is 10 or more through an effect counts (Dorry is cost 5 +12)', () => {
    const g = play(['OP17-085']);
    yes(g);
    pickCards(g, [SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
  });

  it('only my Characters count: an opposing cost-10 Character does not satisfy the condition', () => {
    const g = play([], [SCN.c10]);
    if (kind(g) === 'optional') yes(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c10)).rested).toBe(false);
  });

  it('declining the DON!! −1: no DON!! returned, nothing rested, the Character is still played', () => {
    const g = play([SCN.c10]);
    no(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 2, deck: 8 });
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });
});

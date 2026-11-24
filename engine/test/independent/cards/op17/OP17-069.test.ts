/**
 * OP17-069 Jack (Character, Purple, cost 9, 10000, no Counter, {Fish-Man}/{Animal Kingdom Pirates}, [Rush: Character]).
 *
 * Card text: "[Rush: Character] (This card can attack Characters on the turn in which it is played.)
 * [On Play] DON!! −1: If your Leader has the {Animal Kingdom Pirates} type, give up to 1 of your
 * opponent's Characters −2000 power during this turn."
 *
 * Rules: CR 10-1-6 ([Rush: Character]: Characters only, not the Leader), CR 8-3-1-6 (DON!! −X),
 * RD 112 (an [On Play] cost may be declined), CR 8-3-3 (failed "if"), CR 1-3-6-1 (power may go
 * negative, no trashing), CR 6-6-1-3 ("during this turn").
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  canHit,
  choices,
  don,
  kind,
  kw,
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
  toMyNextMain,
  yes,
} from './kit-op17b.ts';

const JACK = 'OP17-069';
const OROCHI = 'OP17-066'; // 0 power, cost 1 (its [On Play] only matters when played)

function play(leader: string, opp: (string | { card: string; rested?: boolean })[] = [SCN.c4]) {
  const g = mine(leader, { hand: [JACK], costArea: { active: 9, rested: 0 } }, { characters: opp });
  playCard(g, JACK);
  return g;
}

describe('OP17-069 Jack: [Rush: Character]; [On Play] DON!! −1: if {Animal Kingdom Pirates} Leader, give an opposing Character −2000', () => {
  it('has [Rush: Character]: on the turn it is played it can attack a rested opposing Character but not the Leader', () => {
    const g = play(LD.akp, [{ card: SCN.c4, rested: true }]);
    no(g);
    const jack = at(g, 'p1', 'characters', JACK);
    expect(kw(g, jack)).toContain('Rush: Character');
    expect(canHit(g, jack, at(g, 'p2', 'characters', SCN.c4))).toBe(true);
    expect(canHit(g, jack, g.leader('p2'))).toBe(false);
  });

  it('AKP Leader: returns 1 DON!! and the chosen opposing Character gets −2000 this turn', () => {
    const g = play(LD.akp);
    need(g, 'optional', 'p1');
    yes(g);
    expect(don(g)).toMatchObject({ active: 0, rested: 8, deck: 2 });
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c4]);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(4000);
  });

  it('the penalty lasts only this turn', () => {
    const g = play(LD.akp);
    yes(g);
    pickCards(g, [SCN.c4]);
    toMyNextMain(g);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('a Leader without the {Animal Kingdom Pirates} type: nothing happens to the Character', () => {
    const g = play(LD.neutral);
    if (kind(g) === 'optional') yes(g);
    expect(atMain(g)).toBe(true);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('declining the DON!! −1: no DON!! returned, no penalty', () => {
    const g = play(LD.akp);
    no(g);
    expect(don(g)).toMatchObject({ rested: 9, deck: 1 });
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('"up to 1": the target may be skipped after the DON!! is returned', () => {
    const g = play(LD.akp);
    yes(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(don(g)).toMatchObject({ deck: 2 });
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('only opposing Characters are candidates (not the Leaders, not my own Characters)', () => {
    const g = mine(
      LD.akp,
      { hand: [JACK], characters: [SCN.c2], costArea: { active: 9, rested: 0 } },
      { characters: [SCN.c4, SCN.c5] },
    );
    playCard(g, JACK);
    yes(g);
    expect(offeredIds(g)).toEqual([SCN.c4, SCN.c5].sort());
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('gives −2000 to only 1 Character even when several are there', () => {
    const g = play(LD.akp, [SCN.c4, SCN.c5]);
    yes(g);
    pickCards(g, [SCN.c5]);
    expect(g.power(at(g, 'p2', 'characters', SCN.c5))).toBe(5000);
    expect(g.power(at(g, 'p2', 'characters', SCN.c4))).toBe(6000);
  });

  it('power may go negative and the Character is not trashed (0 power Character −2000 = −2000)', () => {
    const g = play(LD.akp, [OROCHI]);
    yes(g);
    pickCards(g, [OROCHI]);
    expect(g.power(at(g, 'p2', 'characters', OROCHI))).toBe(-2000);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });
});

/**
 * OP17-108 Charlotte Brulee (Character, Yellow, cost 3, 4000, Counter +1000, {Big Mom Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.) [Trigger] Rest up to 1 of your opponent's Characters with a cost of 6
 * or less."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 10-1-5 / RD 101-102 ([Trigger]: optional; the card is in no area
 * while it resolves, then trashed), CR 8-4-4-1 ("up to"), CR 1-3-2-1 (resting a rested card does
 * nothing).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  blockers,
  BLUE,
  cardIds,
  choices,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickCards,
  SCN,
  theirs,
  trash,
  chars,
} from './kit-op17b.ts';

const BRULEE = 'OP17-108';

function hit(opp: (string | { card: string; rested?: boolean })[], mineChars: string[] = []) {
  const g = theirs(
    LD.bmp,
    { life: [BRULEE, ...fill(BLUE, 3)], characters: mineChars },
    { characters: opp },
  );
  hitLeader(g);
  return g;
}

describe('OP17-108 Charlotte Brulee: [Blocker]; [Trigger] rest up to 1 opposing Character with cost 6 or less', () => {
  it('has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(LD.bmp, { characters: [BRULEE] }, { characters: [SCN.c3] });
    expect(g.card(at(g, 'p1', 'characters', BRULEE)).keywords).toContain('Blocker');
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', BRULEE)]);
  });

  it('[Trigger] activated: rests the chosen opposing cost-6 Character; Brulee is trashed afterwards, not played', () => {
    const g = hit([SCN.c6, SCN.c4]);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickCards(g, [SCN.c6]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c6)).rested).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(false);
    expect(trash(g)).toEqual([BRULEE]);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('boundary: cost 6 is a candidate, cost 7 is not', () => {
    const g = hit([SCN.c6, SCN.c7]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SCN.c6]);
  });

  it('only opposing Characters are candidates (not the Leader, not mine)', () => {
    const g = hit([SCN.c3], [SCN.c2]);
    activateTrigger(g);
    expect(offeredIds(g)).toEqual([SCN.c3]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('"up to 1": the target may be skipped', () => {
    const g = hit([SCN.c3]);
    activateTrigger(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
    expect(trash(g)).toEqual([BRULEE]);
  });

  it('rests only 1 even when several qualify', () => {
    const g = hit([SCN.c3, SCN.c4]);
    activateTrigger(g);
    pickCards(g, [SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c4)).rested).toBe(false);
  });

  it('the [Trigger] is optional: declining adds Brulee to my hand and rests nothing', () => {
    const g = hit([SCN.c3]);
    declineTrigger(g);
    expect(hand(g)).toEqual([BRULEE]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(false);
  });

  it('no candidates: the [Trigger] resolves without a target and Brulee is still trashed', () => {
    const g = hit([SCN.c8]);
    activateTrigger(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(trash(g)).toEqual([BRULEE]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c8]);
  });

  it('an already rested Character can be chosen but nothing changes (it stays rested)', () => {
    const g = hit([{ card: SCN.c3, rested: true }]);
    activateTrigger(g);
    if (kind(g) === 'choose' && choices(g).length) pickCards(g, [SCN.c3]);
    expect(g.card(at(g, 'p2', 'characters', SCN.c3)).rested).toBe(true);
  });
});

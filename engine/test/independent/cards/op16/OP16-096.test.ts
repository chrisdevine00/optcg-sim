/**
 * OP16-096 Yamato (Character, Black, cost 8, 8000, Counter +1000, {Land of Wano}).
 *
 * Card text: "[Unblockable] (This card cannot be blocked.) [On K.O.] Play up to 1 [Yamato] with a cost
 * of 6 or less from your trash."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 3-7-6 (five Character areas), CR 10-1-?? ([Unblockable]); an
 * [On K.O.] effect resolves after the Character is in the trash, so a [Yamato] K.O.'d here is itself
 * in the trash (with cost 8, so never a candidate).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  blockers,
  chars,
  cardIds,
  decision,
  hand,
  kind,
  kw,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredIds,
  p1main,
  pickCards,
  SC16,
  SCN,
  theirs,
  theyKo,
  trash,
} from './kit-op16c.ts';

const ID = 'OP16-096';
const YAMATO6 = 'OP16-098'; // Black, cost 6, [Yamato]
const YAMATO8 = 'OP16-097'; // Black, cost 8, [Yamato]
const YAMATO5 = 'ST09-013'; // Yellow, cost 5, 7000, [Yamato], vanilla

function koed(tr: string[], field: string[] = [], leader: string = LD16.wano) {
  const g = theirs(
    leader,
    { characters: [{ card: ID, rested: true }, ...field], trash: tr },
    { characters: [SCN.c7] },
  );
  theyKo(g, at(g, 'p1', 'characters', ID), at(g, 'p2', 'characters', SCN.c7));
  return g;
}

describe('OP16-096 Yamato: [On K.O.] play up to 1 [Yamato] with cost 6 or less from my trash', () => {
  it("plays the chosen [Yamato] from the trash after being K.O.'d (a vanilla one here, so no [On Play] follows)", () => {
    const g = koed([YAMATO5]);
    need(g, 'choose', 'p1');
    pickCards(g, [YAMATO5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([YAMATO5]);
    expect(trash(g)).toEqual([ID]);
  });

  it("boundary: cost 5 and 6 are offered, cost 8 ([Yamato] OP16-097) is not, nor the K.O.'d cost-8 Yamato itself", () => {
    const g = koed([YAMATO6, YAMATO5, YAMATO8]);
    expect(offeredIds(g)).toEqual([YAMATO5, YAMATO6].sort());
  });

  it('only cards named [Yamato]: another {Land of Wano} Character with cost 6 is not offered', () => {
    const g = koed([SC16.wano6, SC16.wano3, YAMATO5]);
    expect(offeredIds(g)).toEqual([YAMATO5]);
  });

  it('"up to 1": may play nothing', () => {
    const g = koed([YAMATO6]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, YAMATO6].sort());
  });

  it('plays at most one even when two qualify', () => {
    const g = koed([YAMATO6, YAMATO5]);
    pickCards(g, [YAMATO5]);
    expect(chars(g)).toEqual([YAMATO5]);
    expect(trash(g)).toEqual([ID, YAMATO6].sort());
  });

  it('no [Yamato] with cost 6 or less in the trash: nothing is played', () => {
    const g = koed([YAMATO8, SC16.wano3]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([]);
  });

  it('the Yamato played from the trash is played active (not rested)', () => {
    const g = koed([YAMATO5]);
    pickCards(g, [YAMATO5]);
    expect(g.card(at(g, 'p1', 'characters', YAMATO5)).rested).toBe(false);
  });

  it("with a full field (5 Characters; one is K.O.'d, so 4 remain) the played Yamato fits without trashing", () => {
    const field = [SC16.wano1, SC16.wano3, SC16.wano5, SC16.wano6];
    const g = koed([YAMATO5], field);
    pickCards(g, [YAMATO5]);
    expect(decision(g)?.purpose).not.toBe('characterLimit');
    expect(chars(g)).toHaveLength(5);
    expect(hand(g)).toEqual([]);
  });

  it('[Unblockable]: has the keyword and cannot be blocked when attacking', () => {
    const g = p1main(LD16.wano, { characters: [ID] }, { characters: ['OP09-072'] });
    expect(kw(g, at(g, 'p1', 'characters', ID))).toContain('Unblockable');
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual(['OP09-072']);
  });
});

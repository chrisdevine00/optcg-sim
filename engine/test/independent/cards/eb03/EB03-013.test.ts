/**
 * EB03-013 Carrot (Character, Green, cost 6, 7000, Counter +1000, {Minks}).
 *
 * Card text: "[Activate: Main] [Once Per Turn] If this Character was played on this turn, K.O. up to 1
 * of your opponent's rested Characters with a cost of 5 or less. Then, play up to 1 [Zou] from your
 * hand."
 *
 * Rules: CR 8-1-3-2 ([Once Per Turn]), CR 8-4-4-1 ("up to" allows 0), CR 4-10-1/-2 ("If" and "Then":
 * a "Then" after a failed "If" does not resolve; after a "then" that did nothing the next clause
 * still can; M4b-5), effect plays pay no cost, Stage replacement CR 3-8-5.
 * [Zou] is the card named Zou: OP08-039 Zou, a Stage.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canUseAbility,
  chr,
  isRestedC,
  kind,
  LA,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickCards,
  pickInst,
  playRaw,
  SA,
  tryActivate,
  useYes,
  zoneIds,
  donOf,
} from './kit-eb03a.ts';

const CARROT = 'EB03-013';
/** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (not named Zou). */
const OTHER_STAGE = 'OP05-021';

function board(
  p2: (string | { card: string; rested?: boolean })[],
  o: { played?: boolean; hand?: string[]; stage?: string } = {},
) {
  return mine(
    LA.croc,
    {
      characters: [{ card: CARROT, playedThisTurn: o.played ?? true }],
      hand: o.hand ?? [SA.zou],
      ...(o.stage ? { stage: o.stage } : {}),
    },
    { characters: p2 },
  );
}

describe('EB03-013 Carrot: printed values', () => {
  it('cost 6, 7000, Counter +1000', () => {
    const g = board([]);
    const c = chr(g, 'p1', CARROT);
    expect(g.card(c).cost).toBe(6);
    expect(g.power(c)).toBe(7000);
    expect(g.card(c).counter).toBe(1000);
  });
});

describe('EB03-013 Carrot: [Activate: Main] [Once Per Turn] if played this turn, K.O. an opposing rested Character (cost 5 or less), then play [Zou]', () => {
  it('K.O.s the chosen rested Character with cost 5 (boundary), then plays Zou from hand', () => {
    const g = board([{ card: SA.kingdew, rested: true }]);
    useYes(g, at(g, 'p1', 'characters', CARROT));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.kingdew)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p2', 'trash')).toEqual([SA.kingdew]);
    need(g, 'choose', 'p1');
    pickCards(g, [SA.zou]);
    expect(zoneIds(g, 'p1', 'stage')).toEqual([SA.zou]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('offers only rested opposing Characters with cost 5 or less', () => {
    const g = board([
      { card: SA.kingdew, rested: true },
      { card: SA.thatch, rested: true },
      { card: SA.sai, rested: true },
      SA.hajrudin,
    ]);
    useYes(g, at(g, 'p1', 'characters', CARROT));
    need(g, 'choose', 'p1');
    // Kingdew (5, rested) and Sai (2, rested). Thatch costs 6; Hajrudin is active.
    expect(offeredIds(g)).toEqual([SA.kingdew, SA.sai].sort());
  });

  it('the Zou is played without paying its cost of 3', () => {
    const g = board([{ card: SA.sai, rested: true }]);
    const before = donOf(g, 'p1');
    useYes(g, at(g, 'p1', 'characters', CARROT));
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    pickCards(g, [SA.zou]);
    expect(donOf(g, 'p1')).toEqual(before);
  });

  it('"up to 1": may K.O. nobody, and Zou can still be played (a "Then" after an empty "up to")', () => {
    const g = board([{ card: SA.sai, rested: true }]);
    useYes(g, at(g, 'p1', 'characters', CARROT));
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.sai]);
    // CR 4-10-2: the clause after an unresolved "then" can still resolve; only a failed "If" blocks it.
    need(g, 'choose', 'p1');
    pickCards(g, [SA.zou]);
    expect(zoneIds(g, 'p1', 'stage')).toEqual([SA.zou]);
  });

  it('"up to 1": Zou may also be left in hand', () => {
    const g = board([{ card: SA.sai, rested: true }]);
    useYes(g, at(g, 'p1', 'characters', CARROT));
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p1', 'stage')).toEqual([]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([SA.zou]);
  });

  it("with no rested opposing Character (or none with cost 5 or less) nothing is K.O.'d, Zou is still played", () => {
    const g = board([SA.kingdew, { card: SA.thatch, rested: true }]);
    useYes(g, at(g, 'p1', 'characters', CARROT));
    need(g, 'choose', 'p1');
    // The engine may skip the K.O. pick when it has no candidate, or ask it empty: both are fine.
    if (!offeredIds(g).includes(SA.zou)) {
      expect(offeredIds(g)).toEqual([]);
      none(g);
      need(g, 'choose', 'p1');
    }
    pickCards(g, [SA.zou]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.kingdew, SA.thatch].sort());
    expect(zoneIds(g, 'p1', 'stage')).toEqual([SA.zou]);
  });

  it('only a card named [Zou] can be played: another Stage in hand is not offered', () => {
    const g = board([{ card: SA.sai, rested: true }], { hand: [SA.zou, OTHER_STAGE, SA.marco] });
    useYes(g, at(g, 'p1', 'characters', CARROT));
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.zou]);
  });

  it('without a Zou in hand nothing is played; the K.O. still happens', () => {
    const g = board([{ card: SA.sai, rested: true }], { hand: [OTHER_STAGE] });
    useYes(g, at(g, 'p1', 'characters', CARROT));
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    if (kind(g) === 'choose') none(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p1', 'stage')).toEqual([]);
    expect(zoneIds(g, 'p1', 'hand')).toEqual([OTHER_STAGE]);
  });

  it('playing Zou replaces the Stage already in play (the old Stage is trashed)', () => {
    const g = board([{ card: SA.sai, rested: true }], { stage: OTHER_STAGE });
    useYes(g, at(g, 'p1', 'characters', CARROT));
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    pickCards(g, [SA.zou]);
    expect(zoneIds(g, 'p1', 'stage')).toEqual([SA.zou]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([OTHER_STAGE]);
  });

  it('[Once Per Turn]: after one use it is not offered again', () => {
    const g = board([
      { card: SA.sai, rested: true },
      { card: SA.marco, rested: true },
    ]);
    const c = at(g, 'p1', 'characters', CARROT);
    useYes(g, c);
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    pickCards(g, [SA.zou]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, c)).toEqual([]);
  });

  it('a Carrot played from hand this turn can use it (the condition is read as true)', () => {
    const g = mine(
      LA.croc,
      { hand: [CARROT, SA.zou] },
      { characters: [{ card: SA.sai, rested: true }] },
    );
    playRaw(g, CARROT);
    need(g, 'main', 'p1');
    const c = at(g, 'p1', 'characters', CARROT);
    expect(canUseAbility(g, c)).toBe(true);
    useYes(g, c);
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('must not happen: a Carrot that was NOT played this turn K.O.s nothing and plays no Zou', () => {
    const g = board([{ card: SA.sai, rested: true }], { played: false });
    const c = at(g, 'p1', 'characters', CARROT);
    if (tryActivate(g, c)) {
      // The engine may offer the activation and let it resolve to nothing. Accept every target it
      // offers: the K.O. and the Zou must not happen anyway.
      for (let i = 0; i < 4 && kind(g) === 'choose'; i++) {
        const offered = offeredIds(g);
        if (offered.includes(SA.sai)) pickInst(g, [chr(g, 'p2', SA.sai)]);
        else if (offered.includes(SA.zou)) pickCards(g, [SA.zou]);
        else none(g);
      }
    }
    expect(zoneIds(g, 'p2', 'characters')).toEqual([SA.sai]);
    expect(zoneIds(g, 'p1', 'stage')).toEqual([]);
    expect(isRestedC(g, 'p2', SA.sai)).toBe(true);
  });
});

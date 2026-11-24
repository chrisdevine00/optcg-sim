/**
 * EB03-016 Kouzuki Hiyori (Character, Green, cost 1, 0 power, no Counter, {Land of Wano}/{Kouzuki Clan}).
 *
 * Card text: "[On Play] If your Leader is [Kouzuki Oden], draw 1 card.
 * [Activate: Main] You may trash this Character: Give up to 1 rested DON!! card to your {Land of Wano}
 * type Leader."
 *
 * Rules: CR 8-3-3 (conditions), CR 8-3-1 (a "you may" cost is optional and all-or-nothing), trashing a
 * Character as a cost is not a K.O. (RL-15), giving DON!! (CR 6-5-5), CR 8-4-4-1 ("up to" allows 0).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  choices,
  deck,
  donOf,
  fill,
  hand,
  kind,
  LA,
  mine,
  need,
  none,
  offeredAbilities,
  pickInst,
  playRaw,
  SA,
  tryActivate,
  useYes,
  zoneIds,
} from './kit-eb03a.ts';

const HIYORI = 'EB03-016';
/** EB01-001 Kouzuki Oden: Green/Red, 5000, 4 Life, {Land of Wano}/{Kouzuki Clan}; also named [Kouzuki Oden]. */
const ODEN2 = 'EB01-001';

describe('EB03-016 Kouzuki Hiyori: printed values', () => {
  it('cost 1, 0 power', () => {
    const g = mine(LA.oden, { characters: [HIYORI] });
    const h = chr(g, 'p1', HIYORI);
    expect(g.card(h).cost).toBe(1);
    expect(g.power(h)).toBe(0);
  });
});

describe('EB03-016 Kouzuki Hiyori: [On Play] if your Leader is [Kouzuki Oden], draw 1 card', () => {
  const play = (leader: string) => {
    const g = mine(leader, { hand: [HIYORI], deck: [SA.marco, ...fill(BLUE, 9)] });
    playRaw(g, HIYORI);
    return g;
  };

  it('with [Kouzuki Oden] as Leader: draws exactly 1 card (the top card)', () => {
    const g = play(LA.oden);
    expect(hand(g)).toEqual([SA.marco]);
    expect(deck(g)).toHaveLength(9);
    expect(kind(g)).toBe('main');
  });

  it('the other [Kouzuki Oden] Leader (EB01-001) also draws', () => {
    const g = play(ODEN2);
    expect(hand(g)).toEqual([SA.marco]);
  });

  it('a {Land of Wano} Leader that is not Oden does not draw', () => {
    const g = play(LA.wano);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
  });

  it('a different Leader does not draw', () => {
    const g = play(LA.croc);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
    expect(kind(g)).toBe('main');
  });

  it('draws only 1, and Hiyori ends on the field', () => {
    const g = play(LA.oden);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([HIYORI]);
    expect(hand(g)).toHaveLength(1);
  });
});

describe('EB03-016 Kouzuki Hiyori: [Activate: Main] trash this Character: give up to 1 rested DON!! to your {Land of Wano} Leader', () => {
  const board = (leader: string, active = 3, rested = 2, extra: string[] = []) =>
    mine(leader, { characters: [HIYORI, ...extra], costArea: { active, rested } });

  it('trashes Hiyori and gives 1 rested DON!! to a {Land of Wano} Leader (+1000)', () => {
    const g = board(LA.oden);
    useYes(g, at(g, 'p1', 'characters', HIYORI));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(zoneIds(g, 'p1', 'trash')).toEqual([HIYORI]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('works for any {Land of Wano} Leader, not only Oden', () => {
    const g = board(LA.wano);
    useYes(g, at(g, 'p1', 'characters', HIYORI));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('gives only 1 even with 4 rested DON!!', () => {
    const g = board(LA.oden, 1, 4);
    useYes(g, at(g, 'p1', 'characters', HIYORI));
    pickInst(g, [g.leader('p1')]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, given: 1 });
  });

  it('"up to 1": may give nothing, and Hiyori is trashed anyway (the cost is paid)', () => {
    const g = board(LA.oden);
    useYes(g, at(g, 'p1', 'characters', HIYORI));
    need(g, 'choose', 'p1');
    none(g);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
    expect(zoneIds(g, 'p1', 'trash')).toEqual([HIYORI]);
  });

  it('only a RESTED DON!! can be given: with only active DON!! nothing is given', () => {
    const g = board(LA.oden, 5, 0);
    const h = at(g, 'p1', 'characters', HIYORI);
    if (tryActivate(g, h)) {
      for (let i = 0; i < 2 && kind(g) === 'choose'; i++) none(g);
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not happen: a Leader that is not {Land of Wano} receives no DON!!', () => {
    const g = board(LA.croc);
    const h = at(g, 'p1', 'characters', HIYORI);
    if (tryActivate(g, h)) {
      for (let i = 0; i < 2 && kind(g) === 'choose'; i++) {
        // Take the Leader if it is offered at all: it must not be given a DON!! anyway.
        if (choices(g).includes(g.leader('p1'))) pickInst(g, [g.leader('p1')]);
        else none(g);
      }
    }
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the DON!! goes to the Leader, never to another Character', () => {
    const g = board(LA.oden, 3, 2, [SA.komachiyo]);
    useYes(g, at(g, 'p1', 'characters', HIYORI));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(chr(g, 'p1', SA.komachiyo))).toBe(3000);
  });

  it('Hiyori played this turn can activate at once', () => {
    const g = mine(LA.oden, {
      characters: [{ card: HIYORI, playedThisTurn: true }],
      costArea: { active: 3, rested: 2 },
    });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HIYORI))).toHaveLength(1);
  });

  it('a rested Hiyori can still activate (the cost is a trash, not a rest)', () => {
    const g = mine(LA.oden, {
      characters: [{ card: HIYORI, rested: true }],
      costArea: { active: 3, rested: 2 },
    });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', HIYORI))).toHaveLength(1);
  });
});

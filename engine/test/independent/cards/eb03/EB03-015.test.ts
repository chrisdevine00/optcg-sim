/**
 * EB03-015 Camie (Character, Green, cost 2, 0 power, Counter +1000, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Give up to 1 rested DON!! card to 1 of your
 * {Fish-Man} or {Merfolk} type Leader or Character cards. Then, rest up to 1 of your opponent's
 * Characters with a cost of 2 or less."
 *
 * Rules: giving DON!! (CR 6-5-5, RL-35: only my own cards; rested DON!! from the cost area, +1000 on
 * my turn), CR 8-4-4-1 ("up to" allows 0), CR 4-10-2 (a "then" clause that cannot be resolved does
 * not stop the next one; only a failed "If" does). Camie is a {Merfolk} herself.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canUseAbility,
  chr,
  choiceCards,
  donOf,
  isRestedC,
  kind,
  LA,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  SA,
  useYes,
} from './kit-eb03a.ts';

const CAMIE = 'EB03-015';

function board(
  leader: string,
  own: string[],
  p2: (string | { card: string; rested?: boolean })[],
  don = { active: 3, rested: 2 },
) {
  return mine(leader, { characters: [CAMIE, ...own], costArea: don }, { characters: p2 });
}

describe('EB03-015 Camie: printed values', () => {
  it('cost 2, 0 power, Counter +1000', () => {
    const g = board(LA.croc, [], []);
    const c = chr(g, 'p1', CAMIE);
    expect(g.card(c).cost).toBe(2);
    expect(g.power(c)).toBe(0);
    expect(g.card(c).counter).toBe(1000);
  });
});

describe('EB03-015 Camie: [Activate: Main] rest this Character: give up to 1 rested DON!! to a {Fish-Man}/{Merfolk} Leader or Character, then rest an opposing cost-2-or-less Character', () => {
  it('gives the DON!! to a {Fish-Man} Character (+1000), then rests the opposing cost-2 Character', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.namule)]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(g.power(chr(g, 'p1', SA.namule))).toBe(6000);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    expect(isRestedC(g, 'p2', SA.sai)).toBe(true);
    expect(kind(g)).toBe('main');
  });

  it('offers my {Fish-Man} / {Merfolk} Leader and Characters (Camie herself included), nothing else', () => {
    const g = board(LA.merfolk, [SA.namule, SA.marco, SA.camieVan], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    need(g, 'choose', 'p1');
    // Shirahoshi (Merfolk Leader), Camie EB03-015, Namule (Fish-Man), Camie OP03-101 (Merfolk). Not Marco.
    expect(choiceCards(g)).toEqual([LA.merfolk, CAMIE, SA.namule, SA.camieVan].sort());
  });

  it('a {Fish-Man} Leader can receive the DON!!', () => {
    const g = board(LA.fishMan, [], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, given: 1 });
  });

  it('a {Merfolk} Leader can receive the DON!!', () => {
    const g = board(LA.merfolk, [], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('Camie may give the DON!! to herself', () => {
    const g = board(LA.croc, [], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    pickInst(g, [chr(g, 'p1', CAMIE)]);
    expect(g.power(chr(g, 'p1', CAMIE))).toBe(1000);
  });

  it("the opponent's {Fish-Man} Character is not a legal target", () => {
    const g = board(LA.croc, [], [SA.namule]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([CAMIE]);
  });

  it('gives only 1 DON!!, even with 4 rested DON!!', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai], { active: 1, rested: 4 });
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    pickInst(g, [chr(g, 'p1', SA.namule)]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, given: 1 });
  });

  it('only a RESTED DON!! is given: with only active DON!! none is given', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai], { active: 4, rested: 0 });
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) {
      if (offeredIds(g).includes(SA.sai)) break;
      if (offeredIds(g).includes(SA.namule)) pickInst(g, [chr(g, 'p1', SA.namule)]);
      else none(g);
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, given: 0 });
    expect(g.power(chr(g, 'p1', SA.namule))).toBe(5000);
  });

  it('boundary of the rest: cost 2 and cost 1 qualify, cost 3 does not', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai, SA.komachiyo, SA.marco]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    pickInst(g, [chr(g, 'p1', SA.namule)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SA.komachiyo, SA.sai].sort());
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    expect(isRestedC(g, 'p2', SA.marco)).toBe(false);
    expect(isRestedC(g, 'p2', SA.komachiyo)).toBe(false);
  });

  it('"up to 1" (the DON!!): giving none still lets the rest part resolve (CR 4-10-2)', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    need(g, 'choose', 'p1');
    none(g);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    expect(isRestedC(g, 'p2', SA.sai)).toBe(true);
  });

  it('"up to 1" (the rest): the opposing Character may be left alone', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai]);
    useYes(g, at(g, 'p1', 'characters', CAMIE));
    pickInst(g, [chr(g, 'p1', SA.namule)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(isRestedC(g, 'p2', SA.sai)).toBe(false);
    expect(g.power(chr(g, 'p1', SA.namule))).toBe(6000);
  });

  it('the cost: Camie is rested, and a rested Camie cannot activate', () => {
    const g = board(LA.croc, [SA.namule], [SA.sai]);
    const c = at(g, 'p1', 'characters', CAMIE);
    useYes(g, c);
    pickInst(g, [chr(g, 'p1', SA.namule)]);
    pickInst(g, [chr(g, 'p2', SA.sai)]);
    expect(g.card(c).rested).toBe(true);
    expect(canUseAbility(g, c)).toBe(false);
    const r = mine(LA.croc, { characters: [{ card: CAMIE, rested: true }] });
    expect(offeredAbilities(r, at(r, 'p1', 'characters', CAMIE))).toEqual([]);
  });

  it('a Camie played this turn can activate at once', () => {
    const g = mine(LA.croc, {
      characters: [{ card: CAMIE, playedThisTurn: true }],
      costArea: { active: 2, rested: 1 },
    });
    expect(canUseAbility(g, at(g, 'p1', 'characters', CAMIE))).toBe(true);
  });
});

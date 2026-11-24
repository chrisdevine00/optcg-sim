/**
 * EB03-012 Otama (Character, Green, cost 2, 0 power, Counter +2000, {Land of Wano}).
 *
 * Card text: "[Activate: Main] You may rest this Character: Rest up to 1 of your opponent's DON!! cards
 * or {Animal} or {SMILE} type Characters with a cost of 3 or less."
 *
 * Rules: CR 8-3-1 (a "you may" cost is optional and all-or-nothing), "cards" includes DON!! (E-Q3 /
 * M4b-1: a rest effect may rest a DON!! card), CR 8-4-4-1 ("up to" allows 0), CR 3-7-4 (summoning
 * sickness concerns attacking only). The cost limit is read on Characters (a DON!! card has no cost).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  canUseAbility,
  chr,
  choiceCards,
  donClassNames,
  donOf,
  kind,
  LA,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickDonClass,
  pickInst,
  SA,
  isRestedC,
  useYes,
} from './kit-eb03a.ts';

const OTAMA = 'EB03-012';

/** p1's Otama (and `own`) against p2's `theirs` Characters and `p2Don` DON!! (active, rested). */
function board(
  theirs: (string | { card: string; rested?: boolean })[],
  p2Don = { active: 4, rested: 0 },
  own: string[] = [],
) {
  return mine(
    LA.croc,
    { characters: [OTAMA, ...own], costArea: { active: 3, rested: 0 } },
    { characters: theirs, costArea: p2Don },
  );
}

describe('EB03-012 Otama: printed values', () => {
  it('cost 2, 0 power, Counter +2000', () => {
    const g = board([]);
    const o = chr(g, 'p1', OTAMA);
    expect(g.card(o).cost).toBe(2);
    expect(g.power(o)).toBe(0);
    expect(g.card(o).counter).toBe(2000);
  });
});

describe('EB03-012 Otama: [Activate: Main] rest this Character: rest up to 1 opposing DON!! or {Animal}/{SMILE} Character with cost 3 or less', () => {
  it('can rest an opposing active DON!! card', () => {
    const g = board([SA.sai]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    need(g, 'choose', 'p1');
    expect(donClassNames(g)).toContain('costActive');
    pickDonClass(g, 'costActive');
    expect(donOf(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
    expect(kind(g)).toBe('main');
  });

  it('offers the DON!! option and the {Animal} / {SMILE} Characters with cost 3 or less, nothing else', () => {
    const g = board([SA.holly, SA.solitaire, SA.komachiyo, SA.laboon, SA.sai]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    need(g, 'choose', 'p1');
    // Holly (Animal, 3), Solitaire (SMILE, 3), Komachiyo (Animal, 1) qualify. Laboon is Animal but costs 4.
    // Sai (2) has no Animal or SMILE type.
    expect(offeredIds(g)).toEqual([SA.holly, SA.komachiyo, SA.solitaire].sort());
    expect(donClassNames(g)).toContain('costActive');
  });

  it('boundary: an {Animal} Character with cost 3 is rested; cost 4 is not a legal target', () => {
    const g = board([SA.holly, SA.laboon]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    pickInst(g, [chr(g, 'p2', SA.holly)]);
    expect(isRestedC(g, 'p2', SA.holly)).toBe(true);
    expect(isRestedC(g, 'p2', SA.laboon)).toBe(false);
  });

  it('a {SMILE} Character with cost 3 is rested', () => {
    const g = board([SA.solitaire]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    pickInst(g, [chr(g, 'p2', SA.solitaire)]);
    expect(isRestedC(g, 'p2', SA.solitaire)).toBe(true);
  });

  it('the cost: Otama herself becomes rested, and a rested Otama cannot activate again', () => {
    const g = board([SA.holly]);
    const o = at(g, 'p1', 'characters', OTAMA);
    useYes(g, o);
    pickInst(g, [chr(g, 'p2', SA.holly)]);
    expect(g.card(o).rested).toBe(true);
    expect(canUseAbility(g, o)).toBe(false);
  });

  it('a rested Otama cannot pay the cost: the ability is not offered', () => {
    const g = mine(
      LA.croc,
      { characters: [{ card: OTAMA, rested: true }] },
      { characters: [SA.holly] },
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', OTAMA))).toEqual([]);
  });

  it('an Otama played this turn can activate at once (the cost is not an attack)', () => {
    const g = mine(
      LA.croc,
      { characters: [{ card: OTAMA, playedThisTurn: true }] },
      { characters: [SA.holly] },
    );
    expect(canUseAbility(g, at(g, 'p1', 'characters', OTAMA))).toBe(true);
  });

  it('the cost is paid on activation: Otama is rested before any target is picked', () => {
    const g = board([SA.holly]);
    const o = at(g, 'p1', 'characters', OTAMA);
    useYes(g, o);
    need(g, 'choose', 'p1');
    expect(g.card(o).rested).toBe(true);
  });

  it('"up to 1": after paying the cost, nothing need be rested', () => {
    const g = board([SA.holly]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    need(g, 'choose', 'p1');
    none(g);
    expect(isRestedC(g, 'p2', SA.holly)).toBe(false);
    expect(donOf(g, 'p2')).toMatchObject({ active: 4, rested: 0 });
  });

  it("only the opponent's cards: my own {Animal} Character is not offered, nor my own DON!!", () => {
    const g = board([SA.holly], { active: 0, rested: 0 }, [SA.komachiyo]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([SA.holly]);
    expect(donClassNames(g)).toEqual([]);
  });

  it('a Character with the right cost but no {Animal}/{SMILE} type cannot be rested', () => {
    const g = board([SA.sai, SA.marco]);
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    need(g, 'choose', 'p1');
    expect(choiceCards(g)).toEqual([]);
    pickDonClass(g, 'costActive');
    expect(isRestedC(g, 'p2', SA.sai)).toBe(false);
    expect(isRestedC(g, 'p2', SA.marco)).toBe(false);
  });

  it('only an ACTIVE DON!! card can be rested: with all opposing DON!! already rested the DON!! option is not offered', () => {
    const g = board([SA.holly], { active: 0, rested: 4 });
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    need(g, 'choose', 'p1');
    expect(donClassNames(g)).toEqual([]);
    expect(choiceCards(g)).toEqual([SA.holly]);
  });

  it('only 1 card is rested: after resting a DON!! the opposing {Animal} Character stays active', () => {
    const g = board([SA.holly], { active: 4, rested: 0 });
    useYes(g, at(g, 'p1', 'characters', OTAMA));
    pickDonClass(g, 'costActive');
    expect(donOf(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
    expect(isRestedC(g, 'p2', SA.holly)).toBe(false);
  });
});

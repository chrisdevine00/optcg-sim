/**
 * OP13-047 Fossa (Character, Blue, cost 2, 3000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "If your Character with a type including "Whitebeard Pirates" would be K.O.'d by your
 * opponent's effect, you may trash this Character instead."
 *
 * Rules: CR 8-1-3-4 (replacement effects; "may" makes it optional; the same replacement is not
 * applied twice to one event, 8-1-3-4-3), digest 109 (a trash is not a K.O.: no [On K.O.]).
 * Whether Fossa can replace its own K.O. is not settled by any ruling on file: the one test about
 * it asserts only the end state both readings share.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  decision,
  handOf,
  isMain,
  kind,
  mine,
  need,
  noDefence,
  opponentKOs,
  pickInst,
  SC2,
  theirs,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const FOSSA = 'OP13-047';
const CURIEL = 'OP13-044';

/** p2's turn; p1 has Fossa and `others`; p2 K.O.s `target` with Gum-Gum Lightning. */
function koTarget(others: string[], target: string, nth = 0): TestGame {
  const g = theirs(
    WL.croc,
    { characters: [FOSSA, ...others], deck: [WV.marco, BLUE, BLUE, BLUE] },
    { hand: [SC2.lightning] },
  );
  opponentKOs(g, g.find('p1', 'characters', target, nth));
  return g;
}

const onField = (g: TestGame, card: string) =>
  g.zone('p1', 'characters').some((c) => c.card === card);
const inTrash = (g: TestGame, card: string) => g.zone('p1', 'trash').some((c) => c.card === card);

describe('OP13-047 Fossa: trash this Character instead of a Whitebeard Pirates Character K.O.d by an opponent effect', () => {
  it('offers the replacement to me; accepting trashes Fossa and the target survives', () => {
    const g = koTarget([WV.jil], WV.jil);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    expect(onField(g, WV.jil)).toBe(true);
    expect(onField(g, FOSSA)).toBe(false);
    expect(inTrash(g, FOSSA)).toBe(true);
    expect(inTrash(g, WV.jil)).toBe(false);
  });

  it('"you may": declining lets the K.O. happen and keeps Fossa', () => {
    const g = koTarget([WV.jil], WV.jil);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    expect(onField(g, WV.jil)).toBe(false);
    expect(inTrash(g, WV.jil)).toBe(true);
    expect(onField(g, FOSSA)).toBe(true);
  });

  it('a Character whose type merely includes the words ({Former Whitebeard Pirates}) is covered', () => {
    const g = koTarget([WV.marco], WV.marco);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    expect(onField(g, WV.marco)).toBe(true);
    expect(inTrash(g, FOSSA)).toBe(true);
  });

  it('{Whitebeard Pirates Allies} is covered too', () => {
    const g = koTarget([WV.doma], WV.doma);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    expect(onField(g, WV.doma)).toBe(true);
  });

  it('a Character without the type is not protected: no prompt, it is K.O.d', () => {
    const g = koTarget([WV.mohji], WV.mohji);
    expect(decision(g)?.kind).not.toBe('optional');
    expect(isMain(g, 'p2')).toBe(true);
    expect(inTrash(g, WV.mohji)).toBe(true);
    expect(onField(g, FOSSA)).toBe(true);
  });

  it('only opponent effects: a battle K.O. is not replaced (no prompt)', () => {
    const g = theirs(
      WL.croc,
      { characters: [FOSSA, { card: WV.jil, rested: true }] },
      { characters: [WV.thatch] },
    );
    attack(g, g.find('p2', 'characters', WV.thatch), g.find('p1', 'characters', WV.jil));
    noDefence(g);
    expect(inTrash(g, WV.jil)).toBe(true);
    expect(onField(g, FOSSA)).toBe(true);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('the replaced Character is not K.O.d: its own [On K.O.] (Curiel draws 1) does not fire; if declined it does', () => {
    const accepted = koTarget([CURIEL], CURIEL);
    need(accepted, 'optional', 'p1');
    act(accepted, { type: 'optional', accept: true });
    expect(handOf(accepted)).toEqual([]);
    const declined = koTarget([CURIEL], CURIEL);
    need(declined, 'optional', 'p1');
    act(declined, { type: 'optional', accept: false });
    expect(handOf(declined)).toEqual([WV.marco]);
  });

  it('two Fossas: one K.O. is replaced once, only one Fossa is trashed', () => {
    const g = theirs(WL.croc, { characters: [FOSSA, FOSSA, WV.jil] }, { hand: [SC2.lightning] });
    opponentKOs(g, g.find('p1', 'characters', WV.jil));
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: false });
    expect(onField(g, WV.jil)).toBe(true);
    expect(g.zone('p1', 'trash').filter((c) => c.card === FOSSA)).toHaveLength(1);
    expect(g.zone('p1', 'characters').filter((c) => c.card === FOSSA)).toHaveLength(1);
  });

  it('Fossa K.O.d by an opponent effect itself: whatever is asked, it ends in the trash', () => {
    const g = theirs(WL.croc, { characters: [FOSSA] }, { hand: [SC2.lightning] });
    opponentKOs(g, g.find('p1', 'characters', FOSSA));
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    expect(onField(g, FOSSA)).toBe(false);
    expect(inTrash(g, FOSSA)).toBe(true);
  });

  it('an opposing Fossa protects its own side: my K.O. of their {Whitebeard Pirates} Character is offered to them', () => {
    const g = mine(WL.croc, { hand: [SC2.lightning] }, { characters: [FOSSA, WV.jil] });
    opponentKOs(g, g.find('p2', 'characters', WV.jil));
    need(g, 'optional', 'p2');
    act(g, { type: 'optional', accept: true });
    expect(g.zone('p2', 'characters').some((c) => c.card === WV.jil)).toBe(true);
    expect(g.zone('p2', 'trash').some((c) => c.card === FOSSA)).toBe(true);
    void pickInst;
  });
});

/**
 * OP15-041 Orlumbus (Character, Blue, cost 3, 4000, Counter +1000, {Dressrosa}/{Yonta Maria
 * Fleet}).
 *
 * Card text: "[On K.O.] Draw 1 card. [Activate: Main] [Once Per Turn] You may place 1 of your
 * Characters at the bottom of the owner's deck: This Character gains [Rush] during this turn."
 *
 * Rules: CR 10-2-17 ([On K.O.]), CR 10-1-1 ([Rush]: attack the turn it is played), CR 8-3-1 (a
 * cost), CR 8-4-3 ([Once Per Turn]), CR 8-4-2 (this turn).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from './kit-op15a.ts';
import {
  at,
  canHit,
  chars,
  choices,
  deck,
  hand,
  kind,
  kw,
  LD15,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickInst,
  SCN,
  theirs,
  toMyNextMain,
  trash,
  useAbility,
} from './kit-op15a.ts';
import { act } from './kit-op15a.ts';

const ORLUMBUS = 'OP15-041';

type P = string | { card: string; playedThisTurn?: boolean; rested?: boolean };

function board(chs: P[], p2chars: string[] = []) {
  return mine(LD15.luffy, { characters: chs }, { characters: p2chars });
}
const orl = (g: ReturnType<typeof board>) => at(g, 'p1', 'characters', ORLUMBUS);

/** Activate and place `which` at the bottom of the deck (the engine may skip a one-candidate pick). */
function activateWith(g: ReturnType<typeof board>, which: string) {
  useAbility(g, orl(g));
  if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
  if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'characters', which)]);
}

describe('OP15-041 Orlumbus: [Activate: Main] place a Character at the bottom of the deck: [Rush]', () => {
  it('a Character played this turn cannot attack without the ability (control)', () => {
    const g = board([{ card: ORLUMBUS, playedThisTurn: true }], [SCN.c3]);
    expect(canHit(g, orl(g), g.leader('p2'))).toBe(false);
  });

  it('placing another Character at the bottom gives [Rush]: it can attack the turn it was played', () => {
    const g = board([{ card: ORLUMBUS, playedThisTurn: true }, SCN.c2], [SCN.c3]);
    activateWith(g, SCN.c2);
    need(g, 'main', 'p1');
    expect(kw(g, orl(g))).toContain('Rush');
    expect(canHit(g, orl(g), g.leader('p2'))).toBe(true);
  });

  it('the placed Character goes to the bottom of my deck, not the trash', () => {
    const g = board([ORLUMBUS, SCN.c2]);
    const before = deck(g).length;
    activateWith(g, SCN.c2);
    expect(chars(g)).toEqual([ORLUMBUS]);
    expect(deck(g)).toHaveLength(before + 1);
    expect(deck(g)[deck(g).length - 1]).toBe(SCN.c2);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('the candidates are my own Characters, including Orlumbus itself, never the opponent ones', () => {
    const g = board([ORLUMBUS, SCN.c2], [SCN.c3]);
    useAbility(g, orl(g));
    if (kind(g) === 'optional') act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ORLUMBUS, SCN.c2].sort());
    expect(choices(g)).not.toContain(g.find('p2', 'characters', SCN.c3));
  });

  it('Orlumbus alone can pay the cost by placing itself (then there is no Orlumbus to gain [Rush])', () => {
    const g = board([ORLUMBUS]);
    activateWith(g, ORLUMBUS);
    need(g, 'main', 'p1');
    expect(chars(g)).toEqual([]);
    expect(deck(g)[deck(g).length - 1]).toBe(ORLUMBUS);
  });

  it('[Once Per Turn]: after one use the ability is not offered again this turn', () => {
    const g = board([ORLUMBUS, SCN.c2, SCN.c3]);
    expect(offeredAbilities(g, orl(g))).toHaveLength(1);
    activateWith(g, SCN.c2);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, orl(g))).toEqual([]);
  });

  it('[Rush] lasts only this turn: gone in my next turn, and the ability is available again', () => {
    const g = board([ORLUMBUS, SCN.c2]);
    activateWith(g, SCN.c2);
    expect(kw(g, orl(g))).toContain('Rush');
    toMyNextMain(g);
    expect(kw(g, orl(g))).not.toContain('Rush');
    expect(offeredAbilities(g, orl(g))).toHaveLength(1);
  });
});

describe('OP15-041 Orlumbus: [On K.O.] draw 1 card', () => {
  /** p2 attacks the rested Orlumbus (4000) with a 5000 Character. */
  function koOrlumbus() {
    const g = theirs(
      LD15.luffy,
      { characters: [{ card: ORLUMBUS, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', ORLUMBUS));
    passBlock(g);
    passCounter(g);
    return g;
  }

  it('drawing exactly 1 card when K.O.d in battle', () => {
    const g = theirs(
      LD15.luffy,
      { characters: [{ card: ORLUMBUS, rested: true }] },
      { characters: [SCN.c3] },
    );
    const before = deck(g).length;
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', ORLUMBUS));
    passBlock(g);
    passCounter(g);
    need(g, 'main', 'p2');
    expect(trash(g)).toEqual([ORLUMBUS]);
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)).toHaveLength(before - 1);
  });

  it('it does not draw when it is placed at the bottom of the deck by its own cost (not a K.O.)', () => {
    const g = board([ORLUMBUS]);
    const before = hand(g).length;
    activateWith(g, ORLUMBUS);
    expect(hand(g)).toHaveLength(before);
  });

  it('no draw while it survives', () => {
    const g = theirs(
      LD15.luffy,
      { characters: [{ card: ORLUMBUS, rested: true }] },
      { characters: [SCN.c1] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c1), at(g, 'p1', 'characters', ORLUMBUS));
    passBlock(g);
    passCounter(g);
    expect(hand(g)).toEqual([]);
    void koOrlumbus;
  });
});

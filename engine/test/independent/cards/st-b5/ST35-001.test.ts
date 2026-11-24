/**
 * ST35-001 Hack (Red Character, cost 4, 4000, Counter +1000, Strike, {Fish-Man}/{Revolutionary Army}/{Dressrosa},
 * printed [Blocker]).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the new
 * target of the attack.)
 * [On Play] K.O. up to 1 of your opponent's Characters with 2000 base power or less."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-4-4-1 ("up to"), "base power" ignores modifiers.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  blockers,
  BLUE,
  cardIds,
  choices,
  fill,
  kw,
  LDB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  playRaw,
  SB,
  T,
  theirs,
  trash,
} from './kit-stb5b.ts';

const HACK = T.hack;

function setup(opp: string[], hand_: string[] = []) {
  return mine(LDB.strike, { hand: [HACK, ...hand_], deck: fill(BLUE, 15) }, { characters: opp });
}

describe('ST35-001 Hack: [Blocker]; [On Play] K.O. up to 1 opposing Character with 2000 base power or less', () => {
  it('K.O.s the chosen Character of 2000 base power', () => {
    const g = setup([SB.c1p2, SB.c1p3]);
    playRaw(g, HACK);
    pickCards(g, [SB.c1p2]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p3]);
    expect(trash(g, 'p2')).toEqual([SB.c1p2]);
  });

  it('base power boundary: 2000 and 0 are offered, 3000 and 4000 are not', () => {
    const g = setup([SB.c1p2, SB.c2p0, SB.c1p3, SB.c2p4]);
    playRaw(g, HACK);
    expect(offeredIds(g)).toEqual([SB.c1p2, SB.c2p0].sort());
  });

  it('"up to 1": at most one, and choosing nobody K.O.s nobody', () => {
    const g = setup([SB.c1p2, SB.c2p0]);
    playRaw(g, HACK);
    expect(need(g, 'choose').max).toBe(1);
    none(g);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SB.c1p2, SB.c2p0].sort());
  });

  it('it is BASE power: a 4000 Character lowered to 1000 this turn (Lindbergh) is not a target', () => {
    const g = setup([SB.c2p4], [T.lindbergh]);
    playRaw(g, T.lindbergh);
    pickCards(g, [SB.c2p4]);
    expect(g.power(g.find('p2', 'characters', SB.c2p4))).toBe(1000);
    playRaw(g, HACK);
    expect(choices(g)).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c2p4]);
  });

  it('with no qualifying Character nothing happens', () => {
    const g = setup([SB.c1p3]);
    playRaw(g, HACK);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p3]);
  });

  it('only opposing Characters are candidates', () => {
    const g = mine(
      LDB.strike,
      { hand: [HACK], characters: [SB.c2p0], deck: fill(BLUE, 15) },
      { characters: [SB.c1p2] },
    );
    playRaw(g, HACK);
    expect(offeredIds(g)).toEqual([SB.c1p2]);
  });

  it('printed [Blocker]: the keyword is on the card', () => {
    const g = setup([]);
    const hack = playRaw(g, HACK);
    expect(kw(g, hack)).toContain('Blocker');
  });

  it('[Blocker]: an active Hack blocks an attack on the Leader and is K.O.ed by a stronger attacker', () => {
    const g = theirs(LDB.strike, { characters: [HACK] }, { characters: [SB.c5p7] });
    const hack = g.find('p1', 'characters', HACK);
    attack(g, g.find('p2', 'characters', SB.c5p7), g.leader('p1'));
    expect(blockers(g)).toEqual([hack]);
    act(g, { type: 'block', blocker: hack });
    passCounter(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(g.life('p1')).toBe(4);
  });

  it('[Blocker]: a rested Hack cannot block', () => {
    const g = theirs(
      LDB.strike,
      { characters: [{ card: HACK, rested: true }] },
      { characters: [SB.c5p7] },
    );
    attack(g, g.find('p2', 'characters', SB.c5p7), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });
});

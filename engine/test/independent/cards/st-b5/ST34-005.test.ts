/**
 * ST34-005 Baron Tamago & Pekoms (Purple Character, cost 3, 4000, Counter +2000, Strike, {Minks}/{Big Mom Pirates}).
 *
 * Card text: "[When Attacking] DON!! −1: K.O. up to 1 of your opponent's Characters with 2000 base power
 * or less."
 *
 * Rules: DON!! −1 returns 1 DON!! from the field (active or rested) to the DON!! deck (CR 10-2-?;
 * RL-24), RD 120 (an unpayable cost cannot be paid), CR 8-4-4-1 ("up to"), "base power" ignores
 * modifiers (so a Character reduced to 2000 or less is NOT a target and a printed 2000 raised is).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  BLUE,
  cardIds,
  choices,
  decision,
  don,
  fill,
  kind,
  LDB,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  payDon,
  pickCards,
  playRaw,
  SB,
  T,
  trash,
  unusable,
  yes,
} from './kit-stb5b.ts';
import type { PlayerSpec } from '@optcg/engine';

const TAM = T.tamago;

function setup(opp: string[], p1: Partial<PlayerSpec> = {}) {
  const g = mine(
    LDB.bmp,
    { characters: [TAM], deck: fill(BLUE, 15), costArea: { active: 5, rested: 0 }, ...p1 },
    { characters: opp },
  );
  attack(g, g.find('p1', 'characters', TAM), g.leader('p2'));
  return g;
}

describe('ST34-005 Tamago & Pekoms: [When Attacking] DON!! -1: K.O. up to 1 opposing Character with 2000 base power or less', () => {
  it('pay DON!! -1: the chosen 2000-power Character is K.O.ed and the DON!! goes to the DON!! deck', () => {
    const g = setup([SB.c1p2]);
    yes(g);
    payDon(g, 1);
    pickCards(g, [SB.c1p2]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SB.c1p2]);
    expect(don(g)).toMatchObject({ active: 4, deck: 6 });
  });

  it('base power boundary: 2000 and 0 qualify, 3000 does not', () => {
    const g = setup([SB.c1p2, SB.c2p0, SB.c1p3]);
    yes(g);
    payDon(g, 1);
    expect(offeredIds(g)).toEqual([SB.c1p2, SB.c2p0].sort());
  });

  it('"up to 1": at most one target', () => {
    const g = setup([SB.c1p2, SB.c2p0]);
    yes(g);
    payDon(g, 1);
    expect(need(g, 'choose').max).toBe(1);
  });

  it('"up to 1": choosing nobody K.O.s nothing, but the DON!! is already returned', () => {
    const g = setup([SB.c1p2]);
    yes(g);
    payDon(g, 1);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p2]);
    expect(don(g)).toMatchObject({ active: 4, deck: 6 });
  });

  it('declining the cost: no DON!! is returned and nothing is K.O.ed', () => {
    const g = setup([SB.c1p2]);
    no(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p2]);
    expect(don(g)).toMatchObject({ active: 5, deck: 5 });
    expect(kind(g)).toBe('block');
  });

  it('RD 120: with no DON!! on the field the cost cannot be paid', () => {
    const g = setup([SB.c1p2], { costArea: { active: 0, rested: 0 } });
    unusable(g, 'p1');
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c1p2]);
    expect(kind(g)).toBe('block');
  });

  it('DON!! -1 can be paid with a rested DON!!', () => {
    const g = setup([SB.c1p2], { costArea: { active: 0, rested: 1 } });
    yes(g);
    payDon(g, 1, 'costRested');
    pickCards(g, [SB.c1p2]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(don(g)).toMatchObject({ active: 0, rested: 0, deck: 10 });
  });

  it('it is BASE power: a 4000 Character lowered to 1000 this turn is not a target', () => {
    const g = mine(
      LDB.bmp,
      {
        hand: [T.lindbergh],
        characters: [TAM],
        deck: fill(BLUE, 15),
        costArea: { active: 8, rested: 0 },
      },
      { characters: [SB.c2p4] },
    );
    playRaw(g, T.lindbergh);
    pickCards(g, [SB.c2p4]);
    expect(g.power(g.find('p2', 'characters', SB.c2p4))).toBe(1000);
    attack(g, g.find('p1', 'characters', TAM), g.leader('p2'));
    yes(g);
    payDon(g, 1);
    expect(choices(g)).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SB.c2p4]);
  });

  it('only opposing Characters are candidates', () => {
    const g = setup([SB.c1p2], { characters: [TAM, SB.c2p0] });
    yes(g);
    payDon(g, 1);
    expect(offeredIds(g)).toEqual([SB.c1p2]);
  });

  it('the attack goes on after the K.O.: the attacked Leader can still be blocked and hit', () => {
    const g = setup([SB.c1p2]);
    yes(g);
    payDon(g, 1);
    pickCards(g, [SB.c1p2]);
    expect(decision(g)?.kind).toBe('block');
    passBlock(g);
  });
});

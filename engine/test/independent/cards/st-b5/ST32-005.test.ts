/**
 * ST32-005 Roronoa Zoro (Green Character, cost 1, 2000, Counter +2000, Slash, {Straw Hat Crew}/{Supernovas},
 * printed [Rush: Character]).
 *
 * Card text: "[Rush: Character]
 * [On Play] If your Leader has the <Slash> attribute, rest up to 1 of your opponent's Characters with a
 * cost of 2 or less."
 *
 * Rules: CR 10-1-6-1, CR 8-3-3 (text after a failed "if" does not resolve), CR 8-4-4-1 ("up to"),
 * CR 7-1-1-2 (only rested Characters can be attacked).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  attackers,
  attackTargets,
  BLUE,
  canAttack,
  fill,
  kw,
  LDB,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SB,
  T,
} from './kit-stb5b.ts';

const ZORO = T.zoro;

function setup(
  leader: string | { card: string; rested: boolean },
  opp: (string | { card: string; rested: boolean })[],
) {
  return mine(leader, { hand: [ZORO], deck: fill(BLUE, 15) }, { characters: opp });
}

describe('ST32-005 Zoro: [Rush: Character]; [On Play] Slash Leader: rest up to 1 opposing cost-2-or-less Character', () => {
  it('Slash Leader: the chosen Character is rested', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c1p2]);
    playRaw(g, ZORO);
    pickCards(g, [SB.c2p4]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', SB.c1p2)).rested).toBe(false);
  });

  it('cost boundary: cost 2 and 0 are offered, cost 3 is not', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c2p0, SB.c3p5]);
    playRaw(g, ZORO);
    expect(offeredIds(g)).toEqual([SB.c2p0, SB.c2p4].sort());
  });

  it('"up to 1": at most one target', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c1p2]);
    playRaw(g, ZORO);
    expect(need(g, 'choose').max).toBe(1);
  });

  it('"up to 1": choosing nobody rests nothing', () => {
    const g = setup(LDB.slash, [SB.c2p4]);
    playRaw(g, ZORO);
    none(g);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(false);
  });

  it('CR 8-3-3: a Leader without the Slash attribute: no question, nothing is rested', () => {
    const g = setup(LDB.strike, [SB.c2p4]);
    playRaw(g, ZORO);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(false);
  });

  it('a RESTED Slash Leader still has the Slash attribute: the effect works', () => {
    const g = setup({ card: LDB.slash, rested: true }, [SB.c2p4]);
    playRaw(g, ZORO);
    pickCards(g, [SB.c2p4]);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(true);
  });

  it('[Rush: Character] is printed: it attacks a rested Character the turn it is played even with a non-Slash Leader', () => {
    const g = setup(LDB.strike, [{ card: SB.c4p6, rested: true }]);
    const zoro = playRaw(g, ZORO);
    expect(kw(g, zoro)).toContain('Rush: Character');
    expect(attackers(g)).toContain(zoro);
    expect(attackTargets(g, zoro)).toEqual([g.find('p2', 'characters', SB.c4p6)]);
  });

  it('[Rush: Character] does not reach the Leader', () => {
    const g = setup(LDB.slash, [{ card: SB.c4p6, rested: true }]);
    const zoro = playRaw(g, ZORO);
    expect(canAttack(g, zoro, g.leader('p2'))).toBe(false);
  });

  it('an active (not rested) opposing Character is not an attack target', () => {
    const g = setup(LDB.strike, [SB.c4p6]);
    const zoro = playRaw(g, ZORO);
    expect(attackTargets(g, zoro)).toEqual([]);
  });

  it('only an opposing Character is a candidate: own cost-2 Characters are not', () => {
    const g = mine(
      LDB.slash,
      { hand: [ZORO], deck: fill(BLUE, 15), characters: [SB.c2p4] },
      { characters: [SB.c1p2] },
    );
    playRaw(g, ZORO);
    expect(offeredIds(g)).toEqual([SB.c1p2]);
  });
});

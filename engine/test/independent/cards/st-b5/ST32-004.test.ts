/**
 * ST32-004 Silvers Rayleigh (Green Character, cost 4, 5000, Counter +1000, Slash, {Former Roger Pirates}).
 *
 * Card text: "If your Leader has the <Slash> attribute, this Character gains [Rush: Character].
 * [On Play] Rest up to 2 of your opponent's Characters with a cost of 2 or less."
 *
 * Rules: CR 10-1-6-1 ([Rush: Character] attacks Characters, never the Leader, on the turn played),
 * CR 7-1-1-2 (only rested Characters can be attacked), CR 8-4-4-1 ("up to").
 * The Rush condition belongs to the continuous effect; the [On Play] has no condition.
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  attackers,
  attackTargets,
  atMain,
  cardIds,
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
  BLUE,
  noDefence,
  trash,
  canAttack,
} from './kit-stb5b.ts';

const RAY = T.rayleigh;

function setup(leader: string, opp: (string | { card: string; rested: boolean })[]) {
  return mine(leader, { hand: [RAY], deck: fill(BLUE, 15) }, { characters: opp });
}

describe('ST32-004 Rayleigh: Slash Leader gives [Rush: Character]; [On Play] rest up to 2 opposing cost-2-or-less Characters', () => {
  it('[On Play] rests the two chosen Characters', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c1p2]);
    playRaw(g, RAY);
    pickCards(g, [SB.c2p4, SB.c1p2]);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters').every((c) => c.rested)).toBe(true);
  });

  it('cost boundary: cost 2 and 0 are offered, cost 3 is not', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c2p0, SB.c3p5]);
    playRaw(g, RAY);
    expect(offeredIds(g)).toEqual([SB.c2p0, SB.c2p4].sort());
  });

  it('"up to 2": at most two, even with three eligible', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c1p2, SB.c2p0]);
    playRaw(g, RAY);
    expect(need(g, 'choose').max).toBe(2);
  });

  it('"up to 2": one is enough', () => {
    const g = setup(LDB.slash, [SB.c2p4, SB.c1p2]);
    playRaw(g, RAY);
    pickCards(g, [SB.c2p4]);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', SB.c1p2)).rested).toBe(false);
  });

  it('"up to 2": choosing nobody rests nothing', () => {
    const g = setup(LDB.slash, [SB.c2p4]);
    playRaw(g, RAY);
    none(g);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(false);
  });

  it('Slash Leader: Rayleigh has [Rush: Character] and may attack a rested opposing Character the turn it is played', () => {
    const g = setup(LDB.slash, [{ card: SB.c4p6, rested: true }, SB.c2p0]);
    const ray = playRaw(g, RAY);
    pickCards(g, [SB.c2p0]);
    expect(kw(g, ray)).toContain('Rush: Character');
    expect(attackers(g)).toContain(ray);
    expect(attackTargets(g, ray).sort()).toEqual(
      [g.find('p2', 'characters', SB.c4p6), g.find('p2', 'characters', SB.c2p0)].sort(),
    );
  });

  it('[Rush: Character] never reaches the Leader on the turn played', () => {
    const g = setup(LDB.slash, [SB.c2p0]);
    const ray = playRaw(g, RAY);
    pickCards(g, [SB.c2p0]);
    expect(canAttack(g, ray, g.leader('p2'))).toBe(false);
  });

  it('the Character it rested can be K.O.ed by Rayleigh in the same turn', () => {
    const g = setup(LDB.slash, [SB.c2p4]);
    const ray = playRaw(g, RAY);
    pickCards(g, [SB.c2p4]);
    attack(g, ray, g.find('p2', 'characters', SB.c2p4));
    noDefence(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SB.c2p4]);
  });

  it('a Leader without the Slash attribute: no [Rush: Character], so Rayleigh cannot attack when played', () => {
    const g = setup(LDB.strike, [{ card: SB.c4p6, rested: true }, SB.c2p0]);
    const ray = playRaw(g, RAY);
    pickCards(g, [SB.c2p0]);
    expect(kw(g, ray)).not.toContain('Rush: Character');
    expect(attackers(g)).not.toContain(ray);
  });

  it('the [On Play] has no Leader condition: a non-Slash Leader still rests the Characters', () => {
    const g = setup(LDB.strike, [SB.c2p4]);
    playRaw(g, RAY);
    pickCards(g, [SB.c2p4]);
    expect(g.card(g.find('p2', 'characters', SB.c2p4)).rested).toBe(true);
  });
});

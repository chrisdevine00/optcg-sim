/**
 * EB04-003 Smoker & Tashigi (Character, cost 8, 8000, no Counter, {Navy}/{Punk Hazard}).
 *
 * Card text: "[Rush] (This card can attack on the turn in which it is played.)
 * [Opponent's Turn] Your {Navy} type Leader's base power becomes 7000."
 *
 * Rules: [Rush]; "base power becomes" sets the base before DON!! and +/- effects (RL-14); the effect
 * exists only while this Character is on the field and only on the opponent's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canHit,
  endTurn,
  kind,
  LE,
  mine,
  noDefence,
  playCard,
  SN,
  theirs,
  theirsP,
} from './kit-eb04a.ts';

const SMOKER = 'EB04-003';
const power1 = (g: ReturnType<typeof theirs>) => g.power(g.leader('p1'));

describe('EB04-003 Smoker & Tashigi', () => {
  it('printed values: cost 8, 8000, [Rush]', () => {
    const g = mine(LE.luffy, { hand: [SMOKER] }, {});
    const c = g.card(g.find('p1', 'hand', SMOKER));
    expect(c.cost).toBe(8);
    expect(c.power).toBe(8000);
    expect(c.keywords).toContain('Rush');
  });

  it('[Rush]: played this turn it can attack the opponent Leader at once', () => {
    const g = mine(LE.navy, { hand: [SMOKER] }, {});
    playCard(g, SMOKER);
    expect(kind(g)).toBe('main');
    const smoker = at(g, 'p1', 'characters', SMOKER);
    expect(canHit(g, smoker, g.leader('p2'))).toBe(true);
  });

  it('opponent turn: a {Navy} Leader has base power 7000', () => {
    const g = theirs(LE.navy, { characters: [SMOKER] }, { characters: [SN.c4] });
    expect(power1(g)).toBe(7000);
  });

  it('a Leader with {Navy} among several types counts', () => {
    const g = theirs(LE.navyDress, { characters: [SMOKER] }, { characters: [SN.c4] });
    expect(power1(g)).toBe(7000);
  });

  it('must not happen: a non-{Navy} Leader keeps 5000', () => {
    const g = theirs(LE.luffy, { characters: [SMOKER] }, { characters: [SN.c4] });
    expect(power1(g)).toBe(5000);
  });

  it('must not happen: on my own turn the {Navy} Leader stays at 5000', () => {
    const g = mine(LE.navy, { characters: [SMOKER] }, {});
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not happen: without Smoker on the field the {Navy} Leader stays at 5000 on the opponent turn', () => {
    const g = theirs(LE.navy, { characters: [SN.c4] }, { characters: [SN.c4] });
    expect(power1(g)).toBe(5000);
  });

  it('DON!! given to the Leader add nothing on the opponent turn: still 7000 (the base is 7000, not more)', () => {
    const g = theirsP(
      { card: LE.navy, don: 2 },
      { characters: [SMOKER], costArea: { active: 0, rested: 0 } },
      { characters: [SN.c4] },
    );
    expect(power1(g)).toBe(7000);
  });

  it('two Smokers do not stack: still 7000', () => {
    const g = theirs(LE.navy, { characters: [SMOKER, SMOKER] }, { characters: [SN.c4] });
    expect(power1(g)).toBe(7000);
  });

  it('in force during the opponent battle: a 7000 attacker only ties the 7000 Leader, a 6000 one fails', () => {
    const g = theirs(
      LE.navy,
      { characters: [SMOKER], life: [SN.c1, SN.c1, SN.c1, SN.c1] },
      { characters: [SN.c4] },
    );
    attack(g, at(g, 'p2', 'characters', SN.c4), g.leader('p1'));
    noDefence(g);
    // Hajrudin 6000 < Leader 7000: the attack misses (it would have hit a 5000 Leader).
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
    endTurn(g);
  });
});

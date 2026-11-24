/**
 * EB04-005 Trafalgar Law (Character, cost 3, 5000, Counter +2000, {Heart Pirates}/{Supernovas}/
 * {The Seven Warlords of the Sea}).
 *
 * Card text: "This Character cannot attack unless your opponent has 2 or more Characters with a base
 * power of 5000 or more."
 *
 * Rules: "base power" ignores DON!! and +/- effects, rested Characters still count, the Leader is
 * not a Character.
 */
import { describe, expect, it } from 'vitest';
import { at, canAttackAnything, canHit, LE, mine, pickInst, SN, useAbility } from './kit-eb04a.ts';

const LAW = 'EB04-005';

function game(p2chars: Array<string | { card: string; rested?: boolean; don?: number }>) {
  return mine(LE.luffy, { characters: [LAW] }, { characters: p2chars });
}
const law = (g: ReturnType<typeof game>) => at(g, 'p1', 'characters', LAW);

describe('EB04-005 Trafalgar Law: cannot attack unless the opponent has 2+ Characters with base power 5000+', () => {
  it('printed values: cost 3, 5000, Counter +2000', () => {
    const g = game([]);
    const c = g.card(law(g));
    expect(c.cost).toBe(3);
    expect(c.power).toBe(5000);
    expect(c.counter).toBe(2000);
  });

  it('2 opposing Characters with base power 5000+ (5000 and 7000): Law can attack the Leader', () => {
    const g = game([SN.c3, SN.c5]);
    expect(canHit(g, law(g), g.leader('p2'))).toBe(true);
  });

  it('boundary: only 1 qualifying Character: Law cannot attack at all', () => {
    const g = game([SN.c3, SN.c2]);
    expect(canAttackAnything(g, law(g))).toBe(false);
  });

  it('boundary: 5000 is enough (2 Characters of exactly 5000)', () => {
    const g = game([SN.c3, SN.c3]);
    expect(canAttackAnything(g, law(g))).toBe(true);
  });

  it('boundary: Characters of 4000 do not count', () => {
    const g = game([SN.c2, SN.c2, SN.c1]);
    expect(canAttackAnything(g, law(g))).toBe(false);
  });

  it('"base" power: a printed 5000 Character reduced to 4000 this turn still counts', () => {
    const g = mine(
      'EB04-001',
      { characters: [LAW], life: [SN.c1] },
      { characters: [SN.c3, SN.c3] },
    );
    useAbility(g, g.leader('p1'));
    pickInst(g, [at(g, 'p2', 'characters', SN.c3, 0)]);
    expect(g.power(at(g, 'p2', 'characters', SN.c3, 0))).toBe(4000);
    expect(canAttackAnything(g, law(g))).toBe(true);
  });

  it('rested Characters count', () => {
    const g = game([
      { card: SN.c3, rested: true },
      { card: SN.c4, rested: true },
    ]);
    expect(canAttackAnything(g, law(g))).toBe(true);
  });

  it('with the condition met Law may also attack a rested opposing Character', () => {
    const g = game([
      { card: SN.c3, rested: true },
      { card: SN.c4, rested: true },
    ]);
    expect(canHit(g, law(g), at(g, 'p2', 'characters', SN.c3))).toBe(true);
  });

  it('must not happen: my own big Characters do not count, only the opponent has to have them', () => {
    const g = mine(LE.luffy, { characters: [LAW, SN.c5, SN.c6] }, { characters: [SN.c3] });
    expect(canAttackAnything(g, at(g, 'p1', 'characters', LAW))).toBe(false);
  });
});

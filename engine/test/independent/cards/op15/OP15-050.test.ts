/**
 * OP15-050 Bobby Funk (Character, Blue, cost 3, 3000, Counter +1000, {Dressrosa}/{Mogaro Kingdom}).
 *
 * Card text: "If you have [Kelly Funk], this Character gains +3000 power."
 *
 * Rules: CR 8-1-3-3 (permanent effects apply continuously while their condition holds), CR 8-3-3
 * (a condition), CR 4-9 (power modifiers), "you have" = on your field.
 * Scenery: OP15-043 Kelly Funk (Blue, cost 3, 3000, {Dressrosa}/{Mogaro Kingdom}); its [On Play] plays
 * a [Bobby Funk] from hand, so it is placed in the scenario instead of played unless a test says so.
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import {
  at,
  BLUE,
  inst,
  kind,
  LD15,
  mine,
  need,
  pickInst,
  playRaw,
  RED,
  SCN,
  side,
  theirTurn,
  theirs,
} from './kit-op15b.ts';

const BOBBY = 'OP15-050';
const KELLY = 'OP15-043';
const bobby = (g: Parameters<typeof inst>[0], who: 'p1' | 'p2' = 'p1', n = 0) =>
  at(g, who, 'characters', BOBBY, n);

describe('OP15-050 Bobby Funk: if you have [Kelly Funk], +3000 power', () => {
  it('with [Kelly Funk] on my field: 3000 + 3000 = 6000', () => {
    const g = mine(LD15.shc, { characters: [BOBBY, KELLY] });
    expect(g.power(bobby(g))).toBe(6000);
  });

  it('without [Kelly Funk]: 3000 (printed power)', () => {
    const g = mine(LD15.shc, { characters: [BOBBY, SCN.c3] });
    expect(g.power(bobby(g))).toBe(3000);
  });

  it('the bonus applies on the opponent’s turn too (not a [Your Turn] effect)', () => {
    const g = theirs(LD15.shc, { characters: [BOBBY, KELLY] }, {});
    expect(g.power(bobby(g))).toBe(6000);
  });

  it('a rested [Kelly Funk] still counts', () => {
    const g = mine(LD15.shc, { characters: [BOBBY, { card: KELLY, rested: true }] });
    expect(g.power(bobby(g))).toBe(6000);
  });

  it('boundary: 6000 power survives a 5000 attacker on the opponent’s turn; 3000 power does not', () => {
    const withKelly = theirTurn(
      side(LD15.shc, BLUE, { characters: [{ card: BOBBY, rested: true }, KELLY] }),
      side(LD15.neutral, RED, { characters: [SCN.c3] }),
    );
    attack(withKelly, inst(withKelly, 'p2', 'characters', SCN.c3), bobby(withKelly));
    passBlock(withKelly);
    passCounter(withKelly);
    expect(withKelly.zone('p1', 'characters').map((c) => c.card)).toContain(BOBBY);

    const without = theirTurn(
      side(LD15.shc, BLUE, { characters: [{ card: BOBBY, rested: true }] }),
      side(LD15.neutral, RED, { characters: [SCN.c3] }),
    );
    attack(without, inst(without, 'p2', 'characters', SCN.c3), bobby(without));
    passBlock(without);
    passCounter(without);
    expect(without.zone('p1', 'characters').map((c) => c.card)).not.toContain(BOBBY);
  });

  it('the opponent’s [Kelly Funk] does not count', () => {
    const g = mine(LD15.shc, { characters: [BOBBY] }, { characters: [KELLY] });
    expect(g.power(bobby(g))).toBe(3000);
  });

  it('[Kelly Funk] in my hand does not count', () => {
    const g = mine(LD15.shc, { characters: [BOBBY], hand: [KELLY] });
    expect(g.power(bobby(g))).toBe(3000);
  });

  it('two [Kelly Funk] still give +3000 once, not +6000', () => {
    const g = mine(LD15.shc, { characters: [BOBBY, KELLY, KELLY] });
    expect(g.power(bobby(g))).toBe(6000);
  });

  it('every Bobby Funk gets the bonus from one [Kelly Funk]', () => {
    const g = mine(LD15.shc, { characters: [BOBBY, BOBBY, KELLY] });
    expect(g.power(bobby(g, 'p1', 0))).toBe(6000);
    expect(g.power(bobby(g, 'p1', 1))).toBe(6000);
  });

  it('the bonus stacks with given DON!!: 6000 + 1000', () => {
    const g = mine(LD15.shc, {
      characters: [{ card: BOBBY, don: 1 }, KELLY],
      costArea: { active: 9, rested: 0 },
    });
    expect(g.power(bobby(g))).toBe(7000);
  });

  it('played Kelly Funk puts [Bobby Funk] into play from hand with the bonus at once', () => {
    const g = mine(LD15.shc, { hand: [KELLY, BOBBY] });
    playRaw(g, KELLY);
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', BOBBY)]);
    expect(kind(g)).toBe('main');
    expect(g.power(bobby(g))).toBe(6000);
  });
});

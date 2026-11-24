/** OP13-013 Higuma. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { boost, mk, ONE_THOUSAND, ZERO_POWER } from './helpers-op13g1.ts';

const ID = 'OP13-013';

describe('OP13-013 Higuma', () => {
  const start = (p2: string[]) => mk({ hand: [ID] }, { characters: p2 });
  const theirs = (g: ReturnType<typeof mk>) => g.zone('p2', 'characters').map((c) => c.card);

  it('[On Play]: K.O.s up to 1 opposing Character with 0 power or less', () => {
    const g = start([ZERO_POWER, V.c4]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', ZERO_POWER)]);
    expect(theirs(g)).toEqual([V.c4]);
  });

  it('boundary: 1000 power is not a candidate (nothing is offered), exactly 0 is', () => {
    const g = start([ONE_THOUSAND, V.c4]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(theirs(g)).toEqual([ONE_THOUSAND, V.c4]);
  });

  it('reads CURRENT power: a Character lowered to 0 or below qualifies, even below 0', () => {
    const g = start([V.c1, V.c2]);
    // Lower them to exactly 0 and to -1000 (a stand-in for opposing power effects).
    boost(g, g.find('p2', 'characters', V.c1), -3000);
    boost(g, g.find('p2', 'characters', V.c2), -5000);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(theirs(g)).toEqual([V.c1]);
  });

  it('a boosted 0-base Character (now above 0) is not a candidate', () => {
    const g = start([ZERO_POWER]);
    boost(g, g.find('p2', 'characters', ZERO_POWER), 1000);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(theirs(g)).toEqual([ZERO_POWER]);
  });

  it('"up to 1": may choose nothing; only ONE Character is K.O.\'d', () => {
    const g = start([ZERO_POWER]);
    play(g, ID);
    none(g);
    expect(theirs(g)).toEqual([ZERO_POWER]);
    const h = start([ZERO_POWER, ZERO_POWER]);
    play(h, ID);
    pick(h, [h.find('p2', 'characters', ZERO_POWER)]);
    expect(theirs(h)).toHaveLength(1);
  });

  it('only opposing Characters: your own 0 power Character is untouched', () => {
    const g = mk({ hand: [ID], characters: [ZERO_POWER] }, { characters: [V.c4] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ZERO_POWER);
  });
});

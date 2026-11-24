/** OP13-009 Curly.Dadan. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { V } from './helpers.ts';
import { DOGURA, mk } from './helpers-op13g1.ts';

const ID = 'OP13-009';

describe('OP13-009 Curly.Dadan', () => {
  const has = (g: ReturnType<typeof mk>, nth = 0) =>
    g.card(g.find('p1', 'characters', ID, nth)).keywords;

  it('with another {Mountain Bandits} Character, gains [Double Attack]', () => {
    const g = mk({ characters: [ID, DOGURA] });
    expect(has(g)).toContain('Double Attack');
  });

  it('without one, it has no [Double Attack]', () => {
    expect(has(mk({ characters: [ID] }))).not.toContain('Double Attack');
  });

  it('another Character of a different type does not count', () => {
    expect(has(mk({ characters: [ID, V.c3] }))).not.toContain('Double Attack');
  });

  it('"other than this card": a second copy of Dadan counts for both; the card itself never does', () => {
    const g = mk({ characters: [ID, ID] });
    expect(has(g, 0)).toContain('Double Attack');
    expect(has(g, 1)).toContain('Double Attack');
  });

  it("a rested Mountain Bandits Character still counts; the opponent's does not", () => {
    const g = mk({ characters: [ID, { card: DOGURA, rested: true }] });
    expect(has(g)).toContain('Double Attack');
    const h = mk({ characters: [ID] }, { characters: [DOGURA] });
    expect(has(h)).not.toContain('Double Attack');
  });

  it('is conditional on the board: it ends when the other Character leaves', () => {
    const g = mk({ characters: [ID, DOGURA] });
    expect(has(g)).toContain('Double Attack');
    g.state = applyOp(g.state, {
      op: 'ko',
      card: g.find('p1', 'characters', DOGURA),
      by: 'p2',
    }).state;
    expect(has(g)).not.toContain('Double Attack');
  });
});

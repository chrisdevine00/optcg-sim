/** OP11-065 Charlotte Anana. */
import { describe, expect, it } from 'vitest';
import { PURPLE, V } from './helpers.ts';
import { ANANA_Y, BM_P5, BM_Y4, mk } from './helpers-op11g2.ts';

const ID = 'OP11-065';
/** Does Anana have [Blocker] with these other Characters (p1) and opponent's Characters (p2)? */
const blocker = (p1: string[], p2: string[] = []): boolean => {
  const g = mk({ characters: [ID, ...p1] }, { characters: p2 });
  return g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');
};

describe('OP11-065 Charlotte Anana', () => {
  it('with another purple {Big Mom Pirates} Character she has [Blocker]', () => {
    expect(blocker([BM_P5])).toBe(true);
  });

  it('must not have [Blocker] alone', () => {
    expect(blocker([])).toBe(false);
  });

  it('a yellow {Big Mom Pirates} Character does not count (colour)', () => {
    expect(blocker([BM_Y4])).toBe(false);
  });

  it('a purple Character that is not {Big Mom Pirates} does not count (type)', () => {
    expect(blocker([PURPLE, V.c3])).toBe(false);
  });

  it('another copy of [Charlotte Anana] does not count (the name is excluded), purple or not', () => {
    expect(blocker([ID])).toBe(false);
    expect(blocker([ANANA_Y])).toBe(false);
  });

  it('a Character of your opponent does not count', () => {
    expect(blocker([], [BM_P5])).toBe(false);
  });

  it('it actually blocks: the Blocker is usable when attacked', () => {
    const g = mk(
      { characters: [ID, BM_P5] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});

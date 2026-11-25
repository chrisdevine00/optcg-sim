/** OP10-053 Bian. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk, TONT_LEO, TONT_MAN } from './helpers-a10g2.ts';

const ID = 'OP10-053';
/** Does Bian have [Blocker] with these other Characters (p1) and opponent's Characters (p2)? */
const blocker = (p1: string[], p2: string[] = []): boolean => {
  const g = mk({ characters: [ID, ...p1] }, { characters: p2 });
  return g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');
};

describe('OP10-053 Bian', () => {
  it('with another {The Tontattas} Character she has [Blocker]', () => {
    expect(blocker([TONT_LEO])).toBe(true);
    expect(blocker([V.c3, TONT_MAN])).toBe(true);
  });

  it('must not have [Blocker] alone or with only other types', () => {
    expect(blocker([])).toBe(false);
    expect(blocker([V.c1, V.c3])).toBe(false);
  });

  it('another copy of [Bian] does not count (the name is excluded)', () => {
    expect(blocker([ID])).toBe(false);
    expect(blocker([ID, V.c1])).toBe(false);
  });

  it('a {The Tontattas} Character of your opponent does not count', () => {
    expect(blocker([], [TONT_LEO])).toBe(false);
  });

  it('it actually blocks when attacked, and stops blocking once the other Character is gone', () => {
    const g = mk(
      { characters: [ID, TONT_LEO] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
    const h = mk({ characters: [ID] }, { characters: [V.c7] }, { turn: 4, activePlayer: 'p2' });
    h.act({ type: 'attack', attacker: h.find('p2', 'characters', V.c7), target: h.leader('p1') });
    expect(h.legal().some((a) => a.type === 'block' && a.blocker !== null)).toBe(false);
  });
});

/** OP14-011 Bartolomeo. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { mk5, withDon } from './helpers-op14g1.ts';

const ID = 'OP14-011';

const blocker = (g: ReturnType<typeof mk5>) =>
  g.card(g.find('p1', 'characters', ID)).keywords.includes('Blocker');

describe('OP14-011 Bartolomeo', () => {
  it('[DON!! x2]: with 2 DON!! given it has [Blocker]', () => {
    expect(blocker(mk5({ characters: [withDon(ID, 2)] }))).toBe(true);
  });

  it('boundary: 1 DON!! given is not enough; none either', () => {
    expect(blocker(mk5({ characters: [withDon(ID, 1)] }))).toBe(false);
    expect(blocker(mk5({ characters: [ID] }))).toBe(false);
  });

  it('3 DON!! (more than 2) still has [Blocker]', () => {
    expect(blocker(mk5({ characters: [withDon(ID, 3)] }))).toBe(true);
  });

  it('the Blocker can block an attack on the opponent turn (with DON!! x2)', () => {
    const g = mk5(
      { characters: [withDon(ID, 2)] },
      { characters: [V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });

  it('must not block without the DON!!', () => {
    const g = mk5({ characters: [ID] }, { characters: [V.c4] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    expect(g.legal().some((a) => a.type === 'block' && a.blocker !== null)).toBe(false);
  });
});

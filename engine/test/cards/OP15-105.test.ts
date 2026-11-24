/** OP15-105 Jewelry Bonney. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  expectDecision,
  game,
  hand,
  passBlock,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { canAccept, koOf, names, SHC_BASE8000, SHC_C4, SHC_C5_7000 } from './helpers-op15g3.ts';

const ID = 'OP15-105';

describe('OP15-105 Jewelry Bonney', () => {
  const removal = (target: string, life = [PURPLE, V.c1, V.c2]) => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID, target], life },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    koOf(g, target);
    return g;
  };

  it("your Character with exactly 7000 base power removed by your opponent's effect stays if you add the top Life card to your hand instead", () => {
    const g = removal(SHC_C5_7000);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID, SHC_C5_7000]);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(2);
  });

  it('declining lets it be K.O.d with Life untouched', () => {
    const g = removal(SHC_C4);
    decline(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
    expect(g.life('p1')).toBe(3);
  });

  it('8000 base power is not protected (the bound is 7000)', () => {
    const g = removal(SHC_BASE8000);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'trash')).toEqual([SHC_BASE8000]);
    expect(g.life('p1')).toBe(3);
  });

  it('with no Life cards the replacement cannot be used (RL-41)', () => {
    const g = removal(SHC_C4, []);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
  });

  it('a battle K.O. is not replaced', () => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        characters: [ID, { card: SHC_C4, rested: true }],
        life: [PURPLE, V.c1],
      },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', SHC_C4),
    });
    passBlock(g);
    endCounter(g);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
    expect(g.life('p1')).toBe(2);
  });
});

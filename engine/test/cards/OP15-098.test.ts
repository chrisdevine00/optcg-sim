/** OP15-098 Monkey.D.Luffy (Leader). */
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
import { canAccept, koOf, names, SI_HOLLY, SI_NOLA, SI_SETO, SI_WYPER } from './helpers-op15g3.ts';

const ID = 'OP15-098';

describe('OP15-098 Monkey.D.Luffy', () => {
  const removal = (target: string, life = [PURPLE, V.c1, V.c2]) => {
    const g = game(
      { leader: ID, characters: [target], life },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    koOf(g, target);
    return g;
  };

  it('a {Sky Island} Character with exactly 6000 base power is protected: take the top Life card into your hand instead', () => {
    const g = removal(SI_SETO);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(names(g, 'p1', 'characters')).toEqual([SI_SETO]);
    expect(hand(g, 'p1')).toEqual([PURPLE]);
    expect(g.life('p1')).toBe(2);
  });

  it('7000 base power is protected too, and declining lets it be K.O.d with Life untouched', () => {
    const g = removal(SI_NOLA);
    decline(g);
    expect(names(g, 'p1', 'characters')).toEqual([]);
    expect(names(g, 'p1', 'trash')).toEqual([SI_NOLA]);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('a {Sky Island} Character with 5000 base power (below the bound) is not protected', () => {
    const g = removal(SI_HOLLY);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'trash')).toEqual([SI_HOLLY]);
    expect(g.life('p1')).toBe(3);
  });

  it('a Character that is not {Sky Island} is not protected even with enough power', () => {
    const g = removal(V.c5);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'trash')).toEqual([V.c5]);
  });

  it('with no Life cards the replacement cannot be used (RL-41)', () => {
    const g = removal(SI_WYPER, []);
    if (dec(g)?.kind === 'optional') {
      expect(canAccept(g)).toBe(false);
      decline(g);
    }
    expect(names(g, 'p1', 'trash')).toEqual([SI_WYPER]);
  });

  it('a battle K.O. is not replaced (reading: "by your opponent" as "by your opponent\'s effect")', () => {
    const g = game(
      { leader: ID, characters: [{ card: SI_SETO, rested: true }], life: [PURPLE, V.c1] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.find('p1', 'characters', SI_SETO),
    });
    passBlock(g);
    endCounter(g);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(names(g, 'p1', 'trash')).toEqual([SI_SETO]);
    expect(g.life('p1')).toBe(2);
  });
});

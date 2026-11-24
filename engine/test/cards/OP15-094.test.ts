/** OP15-094 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { canAttack, koOf, names, SHC_C4, SHC_C5_7000 } from './helpers-op15g3.ts';

const ID = 'OP15-094';
const OTHER_NON_SHC = 'OP05-110'; // Holly, Yellow {Animal}{Sky Island}: not {Straw Hat Crew}

describe('OP15-094 Roronoa Zoro', () => {
  const removal = (target: string, extra: string[] = []) => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID, target, ...extra] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    koOf(g, target);
    return g;
  };

  it('has [Blocker]', () => {
    const g = game({ leader: PLAIN_BLUE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("if another {Straw Hat Crew} Character would be removed by your opponent's effect, you may trash this Character instead", () => {
    const g = removal(SHC_C4);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(names(g, 'p1', 'characters')).toEqual([SHC_C4]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining lets the other Character be K.O.d and Zoro stays', () => {
    const g = removal(SHC_C5_7000);
    decline(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C5_7000]);
  });

  it('a Character that is not {Straw Hat Crew} is not covered', () => {
    const g = removal(OTHER_NON_SHC);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([OTHER_NON_SHC]);
  });

  it('"other than this Character": Zoro himself being K.O.d by an effect is not replaced', () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID, SHC_C4] },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    koOf(g, ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'characters')).toEqual([SHC_C4]);
    expect(names(g, 'p1', 'trash')).toEqual([ID]);
  });

  it("a battle K.O. of another {Straw Hat Crew} Character is not replaced (only your opponent's effects)", () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID, { card: SHC_C4, rested: true }] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    expect(canAttack(g, g.find('p2', 'characters', V.c7), g.find('p1', 'characters', SHC_C4))).toBe(
      true,
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
  });
});

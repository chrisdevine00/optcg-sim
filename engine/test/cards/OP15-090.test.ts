/** OP15-090 Perona. */
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
  pick,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import {
  canAccept,
  names,
  plantOpponentEffect,
  SHC_BASE8000,
  SHC_C5_7000,
  SHC_C4,
} from './helpers-op15g3.ts';

const ID = 'OP15-090';

describe('OP15-090 Perona', () => {
  /** p2 plants a K.O. of p1's Character `target`; Perona is on p1's field with `hand` in hand. */
  const removal = (target: string, handCards: string[] = [V.c1, V.c2], chars: string[] = []) => {
    const g = game(
      {
        leader: PLAIN_BLUE,
        hand: handCards,
        characters: target === ID ? [ID] : [ID, target, ...chars],
      },
      { leader: PLAIN_BLUE },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, {
      ko: { from: 'characters', owner: 'opponent', filter: { name: nameOf[target] } },
    });
    return g;
  };
  const nameOf: Record<string, string> = {
    [SHC_C4]: 'Usopp',
    [SHC_C5_7000]: 'Nami',
    [SHC_BASE8000]: 'San-Gorou',
    [ID]: 'Perona',
  };

  it("a Character with 6000 base power removed by your opponent's effect stays if you trash 1 card from your hand instead", () => {
    const g = removal(SHC_C4);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c2)]);
    expect(names(g, 'p1', 'characters')).toEqual([ID, SHC_C4]);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(names(g, 'p1', 'trash')).toEqual([V.c2]);
  });

  it('declining lets the Character be K.O.d and keeps the hand', () => {
    const g = removal(SHC_C4);
    decline(g);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });

  it('the bound is inclusive: exactly 7000 base power is protected', () => {
    const g = removal(SHC_C5_7000);
    expectDecision(g, 'optional', 'p1');
  });

  it('8000 base power is not protected: no offer, the Character is K.O.d', () => {
    const g = removal(SHC_BASE8000);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_BASE8000]);
  });

  it('Perona herself (2000) is protected too', () => {
    const g = removal(ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('cannot be used with an empty hand', () => {
    const g = removal(SHC_C4, []);
    // Offered (so the opponent learns nothing about the hand), but accepting is not legal.
    expectDecision(g, 'optional', 'p1');
    expect(canAccept(g)).toBe(false);
    decline(g);
    expect(names(g, 'p1', 'trash')).toEqual([SHC_C4]);
  });

  it("a battle K.O. is not replaced (only your opponent's effects)", () => {
    const g = game(
      { leader: PLAIN_BLUE, hand: [V.c1], characters: [ID, { card: SHC_C4, rested: true }] },
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
  });
});

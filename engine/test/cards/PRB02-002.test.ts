/** PRB02-002 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, V } from './helpers.ts';
import { cardsIn, mk, plantLeaderEffect } from './helpers-prbst.ts';

const ID = 'PRB02-002';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };
const BOUNCE = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } },
    to: { zone: 'hand' },
  },
};

describe('PRB02-002 Trafalgar Law', () => {
  /** p2's Leader runs a planted effect on p1's board. */
  const byOpponent = (action: Record<string, unknown>, chars: string[] = [ID, V.c1]) => {
    const g = mk({ characters: chars }, {}, { turn: 4, activePlayer: 'p2' });
    plantLeaderEffect(g, action);
    return g;
  };
  const law = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);

  it("instead of being K.O.'d by the opponent's effect, it gets -2000 power this turn and stays", () => {
    const g = byOpponent(KO);
    pick(g, [law(g)]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID, V.c1]);
    expect(g.power(law(g))).toBe(5000);
  });

  it('a return to hand is a removal too and is replaced', () => {
    const g = byOpponent(BOUNCE);
    pick(g, [law(g)]);
    accept(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID, V.c1]);
    expect(g.power(law(g))).toBe(5000);
  });

  it('"you may": declined, the Character is removed and keeps no penalty', () => {
    const g = byOpponent(KO);
    pick(g, [law(g)]);
    decline(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([V.c1]);
  });

  it('Once Per Turn: the second removal in the same turn is not offered', () => {
    const g = byOpponent(KO);
    pick(g, [law(g)]);
    accept(g);
    plantLeaderEffect(g, KO);
    pick(g, [law(g)]);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([V.c1]);
  });

  it('must not fire: another Character being removed is not offered (this Character only)', () => {
    const g = byOpponent(KO);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.power(law(g))).toBe(7000);
  });

  it('[When Attacking]: -2000 power to up to 1 opponent Character this turn', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3, V.c1] });
    g.act({ type: 'attack', attacker: law(g), target: g.leader('p2') });
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": the attack trigger may pick nobody', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] });
    g.act({ type: 'attack', attacker: law(g), target: g.leader('p2') });
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });
});

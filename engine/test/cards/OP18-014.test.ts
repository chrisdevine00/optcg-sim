/** OP18-014 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle } from './helpers-op14g1.ts';
import { ALA1, ALA2, ANIMAL2, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-014';
const rush = (g: ReturnType<typeof mk>, card: string) =>
  g.card(g.find('p1', 'characters', card)).keywords.includes('Rush' as never);

describe('OP18-014 Portgas.D.Ace', () => {
  it('[When Attacking] up to 1 {Alabasta} Character gains [Rush] this turn', () => {
    const g = mk({ characters: [ID, ALA2] });
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', ALA2)]);
    expect(rush(g, ALA2)).toBe(true);
  });

  it('a Character played this turn can then attack', () => {
    const g = mk({ characters: [ID, { card: ALA1, playedThisTurn: true }] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p1', 'characters', ALA1)]);
    finishBattle(g);
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ALA1)),
    ).toBe(true);
  });

  it('Ace is {Alabasta} himself and can be chosen; a non-{Alabasta} Character cannot', () => {
    const g = mk({ characters: [ID, ANIMAL2] });
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ANIMAL2))).toBe(false);
  });

  it('"up to 1": nothing chosen, nothing gained', () => {
    const g = mk({ characters: [ID, ALA2] });
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(rush(g, ALA2)).toBe(false);
  });

  it('[Rush] lasts only this turn', () => {
    const g = mk({ characters: [ID, ALA2] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p1', 'characters', ALA2)]);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(rush(g, ALA2)).toBe(false);
  });
});

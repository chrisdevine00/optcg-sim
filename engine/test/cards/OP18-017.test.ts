/** OP18-017 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { accept, decline, expectDecision, none, pick } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { canPick } from './helpers-w3s.ts';
import { attack, finishBattle } from './helpers-op14g1.ts';
import { ALA2, ALA5, ANIMAL2, mk } from './helpers-op18-g1.ts';

const ID = 'OP18-017';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const theirs = { turn: 4, activePlayer: 'p2' } as const;
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

/** p2 uses a planted effect (an opposing K.O. effect) on one of p1's Characters. */
const byOpponent = (p1: Partial<PlayerSpec>, target: string) => {
  const g = mk(p1, {}, theirs);
  plantOpponentEffect(g, KO);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP18-017 Roronoa Zoro', () => {
  it("instead of your {Alabasta} Character being removed by the opponent's effect, your Leader gets -2000 power", () => {
    const g = byOpponent({ characters: [ID, ALA2] }, ALA2);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(chars(g)).toEqual([ID, ALA2]);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it("declined: the Character is K.O.'d and the Leader keeps its power", () => {
    const g = byOpponent({ characters: [ID, ALA2] }, ALA2);
    decline(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: a second removal in the same turn is not offered', () => {
    const g = byOpponent({ characters: [ID, ALA2, ALA5] }, ALA2);
    accept(g);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', ALA5)]);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).toEqual([ID, ALA2]);
  });

  it('a Character without the {Alabasta} type is not protected; Zoro covers himself (Q4)', () => {
    const g = byOpponent({ characters: [ID, ANIMAL2] }, ANIMAL2);
    expectDecision(g, 'main', 'p2');
    expect(chars(g)).toEqual([ID]);
    const h = byOpponent({ characters: [ID] }, ID);
    accept(h);
    expect(chars(h)).toEqual([ID]);
  });

  it('[When Attacking] up to 1 {Alabasta} Character gains [Rush] this turn', () => {
    const g = mk({ characters: [ID, ALA2, ANIMAL2] });
    attack(g, g.find('p1', 'characters', ID));
    expect(canPick(g, g.find('p1', 'characters', ALA2))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ANIMAL2))).toBe(false);
    pick(g, [g.find('p1', 'characters', ALA2)]);
    expect(g.card(g.find('p1', 'characters', ALA2)).keywords).toContain('Rush');
    finishBattle(g);
  });

  it('[When Attacking] may choose nothing', () => {
    const g = mk({ characters: [ID, ALA2] });
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.card(g.find('p1', 'characters', ALA2)).keywords).not.toContain('Rush');
  });
});

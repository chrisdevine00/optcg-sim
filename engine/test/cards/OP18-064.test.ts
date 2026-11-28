/** OP18-064 Saint Killingham (Purple). */
import { describe, expect, it } from 'vitest';
import { accept, decline, don, dec, none, payDon, pick, play, V } from './helpers.ts';
import { candidates, koByEffect } from './helpers-a10g1.ts';
import { canAttack } from './helpers-op16g1.ts';
import { mine } from './helpers-op18-g3.ts';

const ID = 'OP18-064';
const start = (opp: string[] = [V.c5, V.c3, V.c6, V.c1]) =>
  mine({ hand: [ID], costArea: { active: 5, rested: 0 } }, { characters: opp });
const played = (opp?: string[]) => {
  const g = start(opp);
  play(g, ID);
  accept(g);
  payDon(g);
  return g;
};
const attackable = (g: ReturnType<typeof start>, card: string) => {
  g.act({ type: 'endTurn' });
  return canAttack(g, g.find('p2', 'characters', card), g.leader('p1'));
};

describe('OP18-064 Saint Killingham (Purple)', () => {
  it("[On Play] DON!! −1: up to 1 Character with 7000 base power or less and up to 1 with 5000 or less cannot attack until the end of your opponent's next End Phase", () => {
    const g = played();
    expect(candidates(g).sort()).toEqual(
      [
        g.find('p2', 'characters', V.c5),
        g.find('p2', 'characters', V.c3),
        g.find('p2', 'characters', V.c1),
      ].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c5)]);
    // the second pick is limited to 5000 or less and cannot be the first card again
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c3), g.find('p2', 'characters', V.c1)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(don(g, 'p1').deck).toBe(6);
    expect(attackable(g, V.c5)).toBe(false);
    expect(canAttack(g, g.find('p2', 'characters', V.c3), g.leader('p1'))).toBe(false);
    expect(canAttack(g, g.find('p2', 'characters', V.c1), g.leader('p1'))).toBe(true);
    expect(canAttack(g, g.find('p2', 'characters', V.c6), g.leader('p1'))).toBe(true);
  });

  it('a Character with 8000 base power cannot be chosen; both picks are "up to"', () => {
    const g = played();
    expect(candidates(g)).not.toContain(g.find('p2', 'characters', V.c6));
    none(g);
    none(g);
    expect(attackable(g, V.c5)).toBe(true);
  });

  it('with a single Character of 5000 or less only one of the two slots is filled', () => {
    const g = played([V.c3, V.c6]);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(dec(g)?.kind).toBe('main');
    expect(attackable(g, V.c3)).toBe(false);
  });

  it('declining the DON!! −1 restricts nothing and returns no DON!!', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').deck).toBe(5);
    expect(attackable(g, V.c5)).toBe(true);
  });

  it('[On K.O.] DON!! −1: play this Character card from your trash', () => {
    const g = mine({ characters: [ID], costArea: { active: 3, rested: 0 } }, {});
    koByEffect(g, 'p1', ID);
    accept(g);
    payDon(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.zone('p1', 'trash')).toEqual([]);
    expect(don(g, 'p1').deck).toBe(8);
    // its own [On Play] (your turn) is offered again; decline it
    decline(g);
  });
});

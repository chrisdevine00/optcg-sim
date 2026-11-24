/** OP11-043 Vinsmoke Ichiji. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  none,
  passBlock,
  pick,
  takeDamage,
  times,
  trash,
  V,
} from './helpers.ts';
import { canPick, cardsOf, GERMA, mk } from './helpers-op11g2.ts';

const ID = 'OP11-043';
const deck = [V.c1, V.c2, V.c3, V.c4, ...times(4, V.c5)];
const under = (characters: string[], attackers: string[] = [V.c7]) =>
  mk({ characters, deck }, { characters: attackers }, { turn: 4, activePlayer: 'p2' });
const attack = (g: ReturnType<typeof mk>, c: string) =>
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', c), target: g.leader('p1') });

describe('OP11-043 Vinsmoke Ichiji', () => {
  it("[On Your Opponent's Attack] with only {GERMA} Characters: +1000 power to a Leader or Character during this battle, then trashes 2 cards from the top of the deck", () => {
    const g = under([ID, GERMA]);
    attack(g, V.c7);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', GERMA))).toBe(true);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c3);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000); // during this battle only
  });

  it('this Character is a {GERMA 66} itself: alone it satisfies "only {GERMA} Characters"', () => {
    const g = under([ID]);
    attack(g, V.c7);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(8000);
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('must not fire with a Character that is not a {GERMA} type: no prompt, no cards trashed', () => {
    const g = under([ID, V.c2]);
    attack(g, V.c7);
    expectDecision(g, 'block', 'p1');
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose no card to boost; the 2 cards are still trashed', () => {
    const g = under([ID]);
    attack(g, V.c7);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g, 'p1').sort()).toEqual([V.c1, V.c2].sort());
  });

  it('[Once Per Turn]: the second attack in the turn does not trigger it again', () => {
    const g = under([ID], [V.c7, V.c6]);
    attack(g, V.c7);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    attack(g, V.c6);
    expectDecision(g, 'block', 'p1');
    expect(trash(g, 'p1')).toHaveLength(2);
  });

  it('[Blocker]: printed', () => {
    const g = under([ID]);
    attack(g, V.c7);
    pick(g, [g.leader('p1')]);
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});

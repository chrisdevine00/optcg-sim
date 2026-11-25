/** OP10-034 Franky. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, passBlock, endCounter, V } from './helpers.ts';
import { ids, koByEffect, mk, OPP, rested } from './helpers-a10g1.ts';

const ID = 'OP10-034';
const LIFE = ['OP01-092', 'OP02-084', 'OP02-080'];

/** p2's turn: V.c7 attacks p1's rested Franky; stops at the first decision after the attack. */
const attackFranky = (life: string[] = LIFE, p2chars: string[] = [V.c7]) => {
  const g = mk({ characters: [rested(ID)], life }, { characters: p2chars }, OPP);
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', V.c7),
    target: g.find('p1', 'characters', ID),
  });
  return g;
};
const finish = (g: ReturnType<typeof attackFranky>) => {
  passBlock(g);
  endCounter(g);
};

describe('OP10-034 Franky', () => {
  it("instead of being K.O.'d in battle, you may add the top Life card to your hand", () => {
    const g = attackFranky();
    finish(g);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toEqual([LIFE[0]]);
    expect(g.zone('p1', 'life')).toHaveLength(2);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
    expectDecision(g, 'main', 'p2'); // not damage: no [Trigger] decision
  });

  it("declining lets Franky be K.O.'d and keeps the Life", () => {
    const g = attackFranky();
    finish(g);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.zone('p1', 'life')).toHaveLength(3);
  });

  it('[Once Per Turn]: a second battle K.O. in the same turn is not offered', () => {
    const g = attackFranky(LIFE, [V.c7, V.c7]);
    finish(g);
    accept(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7, 1),
      target: g.find('p1', 'characters', ID),
    });
    finish(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.zone('p1', 'life')).toHaveLength(2);
  });

  it('must not be offered with no Life cards', () => {
    const g = attackFranky([]);
    finish(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('must not apply to a K.O. by an effect (only "in battle")', () => {
    const g = mk({ characters: [ID], life: LIFE }, {}, OPP);
    koByEffect(g, 'p1', ID);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.zone('p1', 'life')).toHaveLength(3);
    expectDecision(g, 'main', 'p2');
  });
});

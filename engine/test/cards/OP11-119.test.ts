/** OP11-119 Koby. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, play, V } from './helpers.ts';
import { canHit, canPick, finishBattle, finishOrder, idsOf, mk } from './helpers-op11g3.ts';

const ID = 'OP11-119';

describe('OP11-119 Koby: [On Play]', () => {
  it('up to 1 of your Characters can also attack active Characters during this turn', () => {
    const g = mk(
      { hand: [ID], characters: [V.c3, V.c4], costArea: { active: 8, rested: 0 } },
      { characters: [V.c1] },
    );
    const mine = g.find('p1', 'characters', V.c3);
    const target = g.find('p2', 'characters', V.c1);
    expect(canHit(g, mine, target)).toBe(false);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(false); // Characters only
    expect(canPick(g, mine)).toBe(true);
    pick(g, [mine]);
    expect(canHit(g, mine, target)).toBe(true);
    expect(canHit(g, g.find('p1', 'characters', V.c4), target)).toBe(false);
  });

  it('"up to 1": may grant nothing', () => {
    const g = mk(
      { hand: [ID], characters: [V.c3], costArea: { active: 8, rested: 0 } },
      { characters: [V.c1] },
    );
    play(g, ID);
    none(g);
    expect(canHit(g, g.find('p1', 'characters', V.c3), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });
});

describe('OP11-119 Koby: [When Attacking]', () => {
  const start = (trash: string[] = [V.c1, V.c2, V.c3]) => {
    const g = mk({ characters: [ID, V.c4], trash }, { characters: [V.c1] });
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    return g;
  };

  it("place 2 cards from the trash at the deck bottom: up to 1 Leader or Character gains +1000 power until the end of your opponent's next turn", () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'trash', V.c1), g.find('p1', 'trash', V.c3)]);
    finishOrder(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'deck').slice(-2).sort()).toEqual([V.c1, V.c3].sort());
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(6000); // still +1000 on the opponent's turn
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('can target a Character', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'trash', V.c1), g.find('p1', 'trash', V.c2)]);
    finishOrder(g);
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(7000);
  });

  it('the cost is optional: declining places nothing and gives nothing', () => {
    const g = start();
    decline(g);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the power may go to nobody after the cost is paid', () => {
    const g = start([V.c1, V.c2]);
    accept(g);
    finishOrder(g);
    none(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with fewer than 2 cards in the trash the cost cannot be paid: no prompt', () => {
    const g = start([V.c1]);
    expect(dec(g)?.kind).not.toBe('optional');
    finishBattle(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c1]);
  });
});

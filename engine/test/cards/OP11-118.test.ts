/** OP11-118 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, don, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { canPick, finishBattle, idsOf, mk } from './helpers-op11g3.ts';

const ID = 'OP11-118';

describe('OP11-118 Monkey.D.Luffy', () => {
  const start = (
    p1: Parameters<typeof mk>[0] = {},
    p2: Parameters<typeof mk>[1] = { characters: [V.c4, V.c5] },
  ) => {
    const g = mk(
      { characters: [ID, V.c2], hand: [V.c1], costArea: { active: 6, rested: 2 }, ...p1 },
      p2,
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    return g;
  };

  it("[When Attacking]: trash 1 card from hand: return up to 1 Character with cost 4 or less to the owner's hand; then give up to 1 rested DON!! to your Leader or a Character", () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c1]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4: the boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true); // either player's Character
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(hand(g, 'p2')).toEqual([V.c4]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.card(g.find('p1', 'characters', V.c2)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 1 });
    finishBattle(g);
  });

  it('may return one of your own Characters (to your hand)', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });

  it('the cost is optional: declining trashes nothing and does nothing', () => {
    const g = start();
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 2 });
  });

  it('"Then" is not "if you do": with no Character returned the rested DON!! can still be given', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(dec(g)?.kind).toBe('choose');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('"up to 1" DON!!: may give nothing', () => {
    const g = start();
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    none(g);
    expect(don(g, 'p1')).toMatchObject({ rested: 2 });
  });

  it('with no card in hand the cost cannot be paid: accepting is not legal', () => {
    const g = start({ hand: [] });
    expectDecision(g, 'optional', 'p1');
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
    decline(g);
    finishBattle(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(2);
  });

  it('has [Rush]: it can attack the turn it is played', () => {
    const g = mk({ hand: [ID], costArea: { active: 8, rested: 0 } });
    play(g, ID);
    expect(
      g.isLegal({
        type: 'attack',
        attacker: g.find('p1', 'characters', ID),
        target: g.leader('p2'),
        player: 'p1',
      }),
    ).toBe(true);
  });
});

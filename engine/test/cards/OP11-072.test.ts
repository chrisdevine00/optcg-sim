/** OP11-072 Charlotte Mont-d'or. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, expectDecision, hand, payDon, pick, PURPLE, V } from './helpers.ts';
import { activate, canActivate, expectMain, idsOf, mk } from './helpers-op11g3.ts';

const ID = 'OP11-072';

describe("OP11-072 Charlotte Mont-d'or", () => {
  const start = (trash: string[], life: string[] = [BLUE, PURPLE, V.c1]) =>
    mk({ characters: [ID], life }, { trash });

  it('[Activate: Main] [Once Per Turn] DON!! -1, rest: the opponent places 2 trash cards at the bottom; then your top Life card goes to your hand', () => {
    const g = start([V.c1, V.c2, V.c3]);
    const me = g.find('p1', 'characters', ID);
    activate(g, me, 'activate');
    payDon(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 1 });
    expect(g.card(me).rested).toBe(true);
    // The opponent chooses which 2 cards and the order.
    expectDecision(g, 'choose', 'p2');
    pick(g, [g.find('p2', 'trash', V.c1), g.find('p2', 'trash', V.c3)]);
    expectMain(g);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c2]);
    expect(idsOf(g, 'p2', 'deck').slice(-2).sort()).toEqual([V.c1, V.c3].sort());
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.life('p1')).toBe(2);
  });

  it('with fewer than 2 cards in their trash they place what they have, and the Life card is still added ("Then" is not "if you do")', () => {
    const g = start([V.c1]);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    payDon(g);
    while (dec(g)?.kind === 'choose' || dec(g)?.kind === 'order') {
      const a = g.legal()[0]!;
      g.act(a);
    }
    expect(idsOf(g, 'p2', 'trash')).toEqual([]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('an empty opposing trash still gives you the Life card', () => {
    const g = start([]);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    payDon(g);
    expectMain(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.life('p1')).toBe(2);
  });

  it('once per turn: not offered a second time', () => {
    const g = start([V.c1, V.c2]);
    const me = g.find('p1', 'characters', ID);
    activate(g, me, 'activate');
    payDon(g);
    while (dec(g)?.kind !== 'main') g.act(g.legal()[0]!);
    expect(canActivate(g, me, 'activate')).toBe(false);
  });

  it('not offered when the Character is already rested (the rest cost cannot be paid)', () => {
    const g = mk({ characters: [{ card: ID, rested: true }] }, { trash: [V.c1, V.c2] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('not offered with no DON!! on the field (DON!! -1 cannot be paid)', () => {
    const g = mk({ characters: [ID], costArea: { active: 0, rested: 0 } }, { trash: [V.c1] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});

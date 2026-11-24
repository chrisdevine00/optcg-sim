/** OP15-041 Orlumbus. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { BLUE, hand, pick, V } from './helpers.ts';
import { canActivate, canAttack } from './helpers-op16g1.ts';
import { mk } from './helpers-op15g1.ts';

const ID = 'OP15-041';

describe('OP15-041 Orlumbus', () => {
  const field = (others: string[] = []) =>
    mk({ characters: [{ card: ID, playedThisTurn: true }, ...others] });
  const act = (g: ReturnType<typeof mk>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'rush' });

  it('[On K.O.]: draws 1 card', () => {
    const g = mk({ characters: [ID] });
    g.state = applyOp(g.state, { op: 'ko', card: g.find('p1', 'characters', ID), by: 'p2' }).state;
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(9);
  });

  it('[Activate: Main]: places 1 of your Characters at the bottom of the deck: this Character gains [Rush] this turn', () => {
    const g = field([V.c2, V.c3]);
    const orl = g.find('p1', 'characters', ID);
    expect(canAttack(g, orl, g.leader('p2'))).toBe(false); // played this turn, no [Rush]
    act(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, V.c3]);
    const deck = g.zone('p1', 'deck');
    expect(deck).toHaveLength(11);
    expect(deck[deck.length - 1]!.card).toBe(V.c2);
    expect(g.card(orl).keywords).toContain('Rush');
    expect(canAttack(g, orl, g.leader('p2'))).toBe(true);
  });

  it('Once Per Turn', () => {
    const g = field([V.c2, V.c3]);
    act(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'rush')).toBe(false);
  });

  it('[Rush] lasts this turn only', () => {
    const g = field([V.c2, V.c3]);
    act(g);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('it may place itself (its only Character option): it leaves the field and no [Rush] results', () => {
    const g = field();
    act(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    const deck = g.zone('p1', 'deck');
    expect(deck[deck.length - 1]!.card).toBe(ID);
  });

  it('cannot be activated by a player with no Characters except... it is itself a Character: stays legal; a rested Orlumbus can still pay', () => {
    const g = mk({ characters: [{ card: ID, rested: true }] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'rush')).toBe(true);
  });
});

/** OP11-050 Gotti. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, hand, option, pick, trash, V } from './helpers.ts';
import { canPick, cardsOf, FIRE3, mk } from './helpers-op11g2.ts';

const ID = 'OP11-050';
const attack = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
const start = (p1: object = {}, p2: string[] = [V.c1, V.c2]) =>
  mk({ characters: [ID], hand: [FIRE3, V.c3], ...p1 }, { characters: p2 });

describe('OP11-050 Gotti', () => {
  it("[When Attacking]: trash a {Firetank Pirates} card, then return a Character with cost 1 or less to its owner's hand", () => {
    const g = start();
    attack(g);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', FIRE3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'hand', FIRE3)]);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options![0]!.id);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // cost 1 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false); // cost 3
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(trash(g, 'p1')).toEqual([FIRE3]);
    expect(hand(g, 'p2')).toEqual([V.c1]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2]);
  });

  it("the other mode places the Character at the bottom of its owner's deck", () => {
    const g = start();
    const deckBefore = cardsOf(g, 'p2', 'deck').length;
    attack(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', FIRE3)]);
    const d = expectDecision(g, 'choose', 'p1');
    option(g, d.options![1]!.id);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c2]);
    const deck = cardsOf(g, 'p2', 'deck');
    expect(deck).toHaveLength(deckBefore + 1);
    expect(deck.at(-1)).toBe(V.c1);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('your own Character with cost 1 or less may be chosen too', () => {
    const g = start({ characters: [ID, V.c1] }, []);
    attack(g);
    accept(g);
    pick(g, [g.find('p1', 'hand', FIRE3)]);
    option(g, expectDecision(g, 'choose', 'p1').options![0]!.id);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(hand(g, 'p1')).toEqual([V.c3, V.c1]);
  });

  it('declining the optional trash: nothing is trashed or returned', () => {
    const g = start();
    attack(g);
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
    expect(dec(g)?.kind).toBe('block');
  });

  it('must not fire without a {Firetank Pirates} card in hand: the cost cannot be paid', () => {
    const g = start({ hand: [V.c3] });
    attack(g);
    if (dec(g)?.kind === 'optional') {
      expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
      decline(g);
    }
    expectDecision(g, 'block', 'p2');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c2]);
  });
});

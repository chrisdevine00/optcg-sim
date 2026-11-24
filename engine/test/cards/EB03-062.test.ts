/** EB03-062 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, none, pick, trash, V } from './helpers.ts';
import { canPick, cardsIn, LAW1, LAW7, mk } from './helpers-eb03g2.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'EB03-062';
const use = (g: TestGame) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'main' });
const offered = (g: TestGame) =>
  g.legal().some((a) => a.type === 'activate' && a.card === g.find('p1', 'characters', ID));

describe('EB03-062 Trafalgar Law', () => {
  it('[Activate: Main] trash 1 card from your hand and this Character: adds the top deck card to the top of Life, then plays a [Trafalgar Law] with a cost of 7 or less from your hand', () => {
    const g = mk({ characters: [ID], hand: [V.c1, LAW7], deck: [V.c5, V.c6, V.c7] });
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]); // Law is trashed as a cost
    accept(g); // "up to 1" card from the top of the deck
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c5);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', LAW7)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([LAW7]);
    expect(trash(g, 'p1').sort()).toEqual([ID, V.c1].sort());
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('boundary: a [Trafalgar Law] of cost 7 or less only: another cost-8 copy is not offered', () => {
    const g = mk({ characters: [ID], hand: [V.c1, ID, LAW1, LAW7], deck: [V.c5, V.c6] });
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    accept(g);
    expect(canPick(g, g.find('p1', 'hand', ID))).toBe(false); // cost 8
    expect(canPick(g, g.find('p1', 'hand', LAW1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', LAW7))).toBe(true);
    pick(g, [g.find('p1', 'hand', LAW1)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([LAW1]);
  });

  it('"Then" is independent: the Life card may be declined and the Law is still played', () => {
    const g = mk({ characters: [ID], hand: [V.c1, LAW7], deck: [V.c5, V.c6] });
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    decline(g);
    expect(g.life('p1')).toBe(3);
    pick(g, [g.find('p1', 'hand', LAW7)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([LAW7]);
  });

  it('"up to 1": the Law may be left in the hand', () => {
    const g = mk({ characters: [ID], hand: [V.c1, LAW7], deck: [V.c5, V.c6] });
    use(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    accept(g);
    none(g);
    expect(hand(g, 'p1')).toEqual([LAW7]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
  });

  it('the trashed card may be the other [Trafalgar Law]: nothing is left to play', () => {
    const g = mk({ characters: [ID], hand: [LAW7], deck: [V.c5, V.c6] });
    use(g);
    // The only card in hand is the one that must be trashed (still asked: a hand pick is secret).
    pick(g, [g.find('p1', 'hand', LAW7)]);
    accept(g);
    expect(trash(g, 'p1').sort()).toEqual([ID, LAW7].sort());
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([]);
  });

  it('the cost needs a card in hand: with an empty hand the ability cannot be used', () => {
    const g = mk({ characters: [ID], hand: [], deck: [V.c5, V.c6] });
    expect(offered(g)).toBe(false);
    const h = mk({ characters: [ID], hand: [V.c1], deck: [V.c5, V.c6] });
    expect(offered(h)).toBe(true);
  });

  it('has [Rush] and can use the ability the turn it is played', () => {
    const g = mk({ characters: [{ card: ID, playedThisTurn: true }], hand: [V.c1], deck: [V.c5] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(offered(g)).toBe(true);
  });
});

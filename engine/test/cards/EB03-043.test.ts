/** EB03-043 Stussy. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, cardsIn, CP2, CP3, CP4, CP5, costMod, mk } from './helpers-eb03g2.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'EB03-043';
const bottom = (g: TestGame, n: number) =>
  g
    .zone('p1', 'deck')
    .slice(-n)
    .map((c) => c.card);
const answer = (g: TestGame, card: string) =>
  g.act(g.legal().find((x) => x.type === 'order' && g.card(x.first).card === card)!);

describe('EB03-043 Stussy', () => {
  it('[On Play]: places 2 {CP} cards from the trash at the deck bottom (in the order chosen), then K.O.s a cost 4 or less Character', () => {
    const g = mk({ hand: [ID], trash: [CP4, CP5, V.c1] }, { characters: [V.c4, V.c5] });
    play(g, ID);
    accept(g);
    // The trash is public and holds exactly 2 {CP} cards: they are the cost, no pick is asked.
    expectDecision(g, 'order', 'p1');
    answer(g, CP5);
    expect(bottom(g, 2)).toEqual([CP5, CP4]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([V.c1]);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c5]);
  });

  it('with 3 {CP} cards the owner picks which 2 (a non-{CP} card is never offered)', () => {
    const g = mk({ hand: [ID], trash: [CP4, CP5, CP3, V.c1] }, { characters: [V.c4] });
    play(g, ID);
    accept(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', V.c1))).toBe(false);
    pick(g, [g.find('p1', 'trash', CP3), g.find('p1', 'trash', CP5)]);
    answer(g, CP3);
    expect(bottom(g, 2)).toEqual([CP3, CP5]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([CP4, V.c1]);
  });

  it('the other order puts the first named card above the second', () => {
    const g = mk({ hand: [ID], trash: [CP4, CP5] }, { characters: [V.c4] });
    play(g, ID);
    accept(g);
    answer(g, CP4);
    expect(bottom(g, 2)).toEqual([CP4, CP5]);
  });

  it('reads the current cost: a cost-5 Character lowered to 4 is a target', () => {
    const g = mk({ hand: [ID], trash: [CP4, CP5] }, { characters: [V.c5] });
    costMod(g, g.find('p2', 'characters', V.c5), -1);
    play(g, ID);
    accept(g);
    answer(g, CP4);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([]);
  });

  it('the cost is exactly 2 {CP} cards: with only 1 in the trash it cannot be paid', () => {
    const g = mk({ hand: [ID], trash: [CP4, V.c1, V.c2] }, { characters: [V.c4] });
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // the trash is public: nothing to offer
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([CP4, V.c1, V.c2]);
  });

  it('"a type including CP": CP0, CP6 and CP9 cards all count; the cost is optional', () => {
    const g = mk({ hand: [ID], trash: [CP2, CP3, CP4] }, { characters: [V.c4] });
    play(g, ID);
    decline(g);
    expect(cardsIn(g, 'p1', 'trash')).toEqual([CP2, CP3, CP4]);
    expect(cardsIn(g, 'p2', 'characters')).toEqual([V.c4]);
    const h = mk({ hand: [ID], trash: [CP2, CP3, CP4] }, { characters: [V.c4] });
    play(h, ID);
    accept(h);
    pick(h, [h.find('p1', 'trash', CP2), h.find('p1', 'trash', CP3)]);
    answer(h, CP3);
    none(h);
    expect(cardsIn(h, 'p2', 'characters')).toEqual([V.c4]); // "up to 1" may K.O. nothing
  });

  it('is a [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });
});

/** OP12-119 Bartholomew Kuma. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, hand, pick, play, trash, V } from './helpers.ts';
import { koBy } from './helpers-w3s.ts';
import { cardsIn, mk } from './helpers-op12g3.ts';

const ID = 'OP12-119';

const start = (deck: string[] = [V.c3, V.c4]) => mk({ hand: [ID, V.c1], deck });

describe('OP12-119 Bartholomew Kuma', () => {
  it('[On Play] trash 1 card from your hand: adds up to 1 card from the top of the deck to the top of the Life, then gains +2 cost', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    accept(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c3);
    expect(cardsIn(g, 'p1', 'deck')).toEqual([V.c4]);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
  });

  it("the +2 cost lasts through the opponent's next End Phase, then ends", () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    accept(g);
    const kuma = g.find('p1', 'characters', ID);
    g.act({ type: 'endTurn' });
    expectDecision(g, 'main', 'p2');
    expect(g.card(kuma).cost).toBe(8);
    g.act({ type: 'endTurn' });
    expect(g.card(kuma).cost).toBe(6);
  });

  it('"Then" is not "If you do": declining the Life card still gives +2 cost, with the hand card trashed', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
    expect(trash(g, 'p1')).toEqual([V.c1]);
  });

  it('declining the cost does nothing at all (no Life, no cost bonus)', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(hand(g, 'p1')).toEqual([V.c1]);
    expect(g.life('p1')).toBe(3);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(6);
  });

  it("[Opponent's Turn] [On K.O.] adds up to 1 card from the top of the deck to the top of your Life", () => {
    const g = mk({ characters: [ID], deck: [V.c3, V.c4] }, {}, { turn: 4, activePlayer: 'p2' });
    koBy(g, 'p1', ID, 'p2');
    accept(g);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c3);
  });

  it("must not fire when K.O.'d on your own turn", () => {
    const g = mk({ characters: [ID], deck: [V.c3, V.c4] });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'main', 'p1');
    expect(g.life('p1')).toBe(3);
  });
});

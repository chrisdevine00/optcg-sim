/**
 * OP13-041 Izo (Character, Blue, cost 6, 6000, Counter +1000, {Land of Wano}/{Whitebeard Pirates}).
 *
 * Card text: "[On Play] Draw 2 cards."
 *
 * Rules: RL-26 (a deck with 0 cards loses at once, even in the middle of an effect: "draw 2" with
 * 2 cards left empties the deck and loses; with 3 cards it does not), CR 8-1-2 (mandatory).
 */
import { describe, expect, it } from 'vitest';
import { BLUE, dons, handOf, isMain, mine, need, playRaw, result, WL, WV } from './kit-op13b.ts';

const IZO = 'OP13-041';

describe('OP13-041 Izo: [On Play] draw 2 cards', () => {
  it('draws exactly the top two cards of the deck', () => {
    const g = mine(WL.croc, { hand: [IZO], deck: [WV.marco, WV.sai, WV.thatch, BLUE, BLUE] });
    playRaw(g, IZO);
    expect(isMain(g)).toBe(true);
    expect(handOf(g)).toEqual([WV.marco, WV.sai].sort());
    expect(g.zone('p1', 'deck').map((c) => c.card)).toEqual([WV.thatch, BLUE, BLUE]);
  });

  it('is mandatory and asks nothing', () => {
    const g = mine(WL.croc, { hand: [IZO] });
    playRaw(g, IZO);
    need(g, 'main', 'p1');
    expect(handOf(g)).toHaveLength(2);
  });

  it('the opponent draws nothing and the opponent hand is untouched', () => {
    const g = mine(WL.croc, { hand: [IZO] }, { hand: [WV.marco] });
    playRaw(g, IZO);
    expect(handOf(g, 'p2')).toEqual([WV.marco]);
    expect(g.zone('p2', 'deck')).toHaveLength(15);
  });

  it('draws two even with a full hand (no hand limit)', () => {
    const g = mine(WL.croc, { hand: [IZO, ...Array.from({ length: 9 }, () => BLUE)] });
    playRaw(g, IZO);
    expect(handOf(g)).toHaveLength(11);
  });

  it('Izo costs 6 and has 6000 power on the field', () => {
    const g = mine(WL.croc, { hand: [IZO] });
    playRaw(g, IZO);
    expect(dons(g).rested).toBe(6);
    expect(g.power(g.find('p1', 'characters', IZO))).toBe(6000);
  });

  it('boundary: with 3 cards in the deck, drawing 2 leaves 1 and the game goes on', () => {
    const g = mine(WL.croc, { hand: [IZO], deck: [BLUE, BLUE, BLUE] });
    playRaw(g, IZO);
    expect(result(g)).toBeNull();
    expect(g.zone('p1', 'deck')).toHaveLength(1);
  });

  it('boundary: with exactly 2 cards in the deck, drawing them empties the deck and loses', () => {
    const g = mine(WL.croc, { hand: [IZO], deck: [BLUE, BLUE] });
    playRaw(g, IZO);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('with 1 card in the deck: draws it, the deck is empty, and I lose', () => {
    const g = mine(WL.croc, { hand: [IZO], deck: [BLUE] });
    playRaw(g, IZO);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('the played Izo stays on the field (it is not removed by its own effect)', () => {
    const g = mine(WL.croc, { hand: [IZO] });
    playRaw(g, IZO);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([IZO]);
    expect(g.zone('p1', 'trash')).toEqual([]);
  });
});

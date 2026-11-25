/**
 * OP10-038 Roronoa Zoro (Character, Blue, cost 5, 6000, Counter +1000, {Straw Hat Crew}/{Supernovas}/{ODYSSEY}).
 *
 * Card text: "[Opponent's Turn] If you have 2 or more rested Characters, this Character gains +2000 power."
 *
 * Rules: "[Opponent's Turn]" is the opponent's turn only (CR 10-2-4... timing keyword), the condition is
 * checked continuously (CR 8-3-1 permanent effects), "you have" counts my own Characters, rested ones
 * include this Character if it is rested, CR 6-5-5-2 (rested Characters attacked in battle).
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, noDefence } from '../../helpers.ts';
import { C10, inst, L10, mine, need, pickRaw, playRaw, theirs, trash, X10 } from './kit-op10b.ts';

const ZORO = 'OP10-038';
const R = (card: string) => ({ card, rested: true });

describe("OP10-038 Roronoa Zoro: [Opponent's Turn] +2000 power with 2 or more rested Characters", () => {
  it("on the opponent's turn with 2 other rested Characters: 8000", () => {
    const g = theirs(L10.luffy, { characters: [ZORO, R(C10.marco), R(C10.mohji)] }, {});
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(8000);
  });

  it('with only 1 rested Character (another): 6000', () => {
    const g = theirs(L10.luffy, { characters: [ZORO, R(C10.marco), C10.mohji] }, {});
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
  });

  it('with no rested Character: 6000', () => {
    const g = theirs(L10.luffy, { characters: [ZORO, C10.marco, C10.mohji] }, {});
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
  });

  it('Zoro rested himself counts as one of the 2: rested Zoro and one other rested Character give 8000', () => {
    const g = theirs(L10.luffy, { characters: [R(ZORO), R(C10.marco)] }, {});
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(8000);
  });

  it('rested Zoro alone is only 1 rested Character: 6000', () => {
    const g = theirs(L10.luffy, { characters: [R(ZORO), C10.marco] }, {});
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
  });

  it('only my Characters count: 2 rested opposing Characters give nothing', () => {
    const g = theirs(
      L10.luffy,
      { characters: [ZORO, C10.marco] },
      { characters: [R(C10.mohji), R(C10.sai)] },
    );
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
  });

  it("only on the opponent's turn: on my own turn with 2 rested Characters Zoro stays 6000", () => {
    const g = mine(L10.luffy, { characters: [ZORO, R(C10.marco), R(C10.mohji)] });
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
  });

  it('the bonus follows the condition: an opposing effect that rests my second Character raises Zoro from 6000 to 8000', () => {
    const g = theirs(
      L10.luffy,
      { characters: [ZORO, R(C10.marco), C10.mohji] },
      { hand: [X10.camie] },
    );
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p1', 'characters', C10.mohji));
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(8000);
  });

  it('in battle the +2000 matters: a rested Zoro with another rested Character (8000) survives a 7000 attacker', () => {
    const g = theirs(
      L10.luffy,
      { characters: [R(ZORO), R(C10.marco)] },
      { characters: [C10.kingdew] },
    );
    attack(g, inst(g, 'p2', 'characters', C10.kingdew), inst(g, 'p1', 'characters', ZORO));
    noDefence(g);
    expect(trash(g)).toEqual([]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(ZORO);
  });

  it('without the bonus (only Zoro rested, 6000) a 7000 attacker K.O.s him', () => {
    const g = theirs(
      L10.luffy,
      { characters: [R(ZORO), C10.marco] },
      { characters: [C10.kingdew] },
    );
    attack(g, inst(g, 'p2', 'characters', C10.kingdew), inst(g, 'p1', 'characters', ZORO));
    noDefence(g);
    expect(trash(g)).toEqual([ZORO]);
  });

  it("Characters rested on my turn stay rested through the opponent's turn (8000), and the bonus is gone on my next turn: 6000", () => {
    const g = mine(L10.luffy, { characters: [ZORO, R(C10.marco), R(C10.mohji)] });
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(8000);
    endTurn(g);
    need(g, 'main', 'p1');
    expect(g.power(inst(g, 'p1', 'characters', ZORO))).toBe(6000);
  });
});

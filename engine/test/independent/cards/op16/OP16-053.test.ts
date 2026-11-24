/**
 * OP16-053 Roronoa Zoro (Character, Blue, cost 7, 9000, no Counter, {Straw Hat Crew}/{Supernovas}/{Dressrosa}).
 *
 * Card text: "[When Attacking] If you have 6 or less cards in your hand, draw 1 card."
 *
 * Rules: RD 89 ([When Attacking] activates in the Attack Step, before the Block Step), CR 8-1-2 (no
 * "may": mandatory), CR 8-3-3 (condition), CR 4-5-3 (draw X).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from '../../helpers.ts';
import { at, BLUE, block, deck, fill, inst, kind, LDR, mine, n, need, SCN } from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ZORO = 'OP16-053';
const TOP = [SCN.c7, SCN.c8, ...fill(BLUE, 8)];

function start(
  handSize: number,
  p2: (string | { card: string; rested: boolean })[] = [],
): TestGame {
  return mine(
    LDR.luffy,
    { characters: [ZORO, SCN.c3], hand: fill(SCN.c1, handSize), deck: TOP },
    { characters: p2 },
  );
}
const zoro = (g: TestGame) => at(g, 'p1', 'characters', ZORO);

describe('OP16-053 Roronoa Zoro: [When Attacking] if you have 6 or less cards in hand, draw 1', () => {
  it('with 6 cards in hand (boundary): draws 1 as soon as the attack is declared', () => {
    const g = start(6);
    attack(g, zoro(g), g.leader('p2'));
    expect(n(g, 'p1', 'hand')).toBe(7);
    expect(deck(g)).toHaveLength(9);
    expect(deck(g)[0]).toBe(SCN.c8);
  });

  it('boundary: with 7 cards in hand nothing is drawn', () => {
    const g = start(7);
    attack(g, zoro(g), g.leader('p2'));
    expect(n(g, 'p1', 'hand')).toBe(7);
    expect(deck(g)).toHaveLength(10);
  });

  it('an empty hand: draws 1', () => {
    const g = start(0);
    attack(g, zoro(g), g.leader('p2'));
    expect(n(g, 'p1', 'hand')).toBe(1);
  });

  it('it is mandatory: the attack goes straight to the Block Step with no question', () => {
    const g = start(3);
    attack(g, zoro(g), g.leader('p2'));
    expect(kind(g)).toBe('block');
    expect(n(g, 'p1', 'hand')).toBe(4);
  });

  it('draws exactly 1 card', () => {
    const g = start(2);
    attack(g, zoro(g), g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(n(g, 'p1', 'hand')).toBe(3);
    expect(deck(g)).toHaveLength(9);
  });

  it('also when attacking a rested Character', () => {
    const g = start(2, [{ card: SCN.c4, rested: true }]);
    attack(g, zoro(g), inst(g, 'p2', 'characters', SCN.c4));
    expect(n(g, 'p1', 'hand')).toBe(3);
  });

  it('the draw happens before the opponent blocks: still drawn when the attack is blocked', () => {
    const g = start(1, ['OP09-072']);
    attack(g, zoro(g), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(n(g, 'p1', 'hand')).toBe(2);
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', 'OP09-072')]);
    block(g, inst(g, 'p2', 'characters', 'OP09-072'));
    expect(n(g, 'p1', 'hand')).toBe(2);
  });

  it('only when Zoro attacks: another Character attacking draws nothing', () => {
    const g = start(1);
    attack(g, at(g, 'p1', 'characters', SCN.c3), g.leader('p2'));
    expect(n(g, 'p1', 'hand')).toBe(1);
  });

  it('with a 6-card hand the draw makes 7, and a second attack by another Zoro would not draw (7 > 6)', () => {
    const g = mine(LDR.luffy, { characters: [ZORO, ZORO], hand: fill(SCN.c1, 6), deck: TOP });
    attack(g, at(g, 'p1', 'characters', ZORO, 0), g.leader('p2'));
    passBlock(g);
    passCounter(g);
    expect(n(g, 'p1', 'hand')).toBe(7);
    attack(g, at(g, 'p1', 'characters', ZORO, 1), g.leader('p2'));
    expect(n(g, 'p1', 'hand')).toBe(7);
  });
});

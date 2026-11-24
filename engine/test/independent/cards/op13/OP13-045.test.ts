/**
 * OP13-045 Haruta (Character, Blue, cost 1, 2000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[When Attacking] If you have 4 or less cards in your hand, draw 1 card."
 *
 * Rules: CR 8-1-2 (mandatory), conditions are read as the effect resolves, RL-26 (deck-out).
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  BLUE,
  decision,
  handOf,
  mine,
  need,
  noDefence,
  result,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HARUTA = 'OP13-045';

function board(handSize: number, deck: string[] = [WV.marco, BLUE, BLUE, BLUE]): TestGame {
  return mine(WL.croc, {
    characters: [HARUTA, WV.thatch],
    hand: Array.from({ length: handSize }, () => WV.mohji),
    deck,
  });
}

describe('OP13-045 Haruta: [When Attacking] with 4 or less cards in hand, draw 1', () => {
  it('4 cards in hand (boundary): draws 1', () => {
    const g = board(4);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    expect(handOf(g)).toHaveLength(5);
  });

  it('5 cards in hand (boundary): draws nothing', () => {
    const g = board(5);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    expect(handOf(g)).toHaveLength(5);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });

  it('0 cards in hand: draws 1', () => {
    const g = board(0);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    expect(handOf(g)).toEqual([WV.marco]);
  });

  it('6 cards in hand: draws nothing', () => {
    const g = board(6);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    expect(handOf(g)).toHaveLength(6);
  });

  it('draws the top card of the deck, one card only', () => {
    const g = board(2);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    expect(handOf(g)).toEqual([WV.marco, WV.mohji, WV.mohji].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('it resolves at once: the battle waits at the Block Step with no prompt in between', () => {
    const g = board(3);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    expect(decision(g)?.kind).toBe('block');
    expect(decision(g)?.player).toBe('p2');
  });

  it('does not fire when another Character attacks', () => {
    const g = board(3);
    attack(g, g.find('p1', 'characters', WV.thatch), g.leader('p2'));
    expect(handOf(g)).toHaveLength(3);
  });

  it('also fires when attacking a rested Character', () => {
    const g = mine(
      WL.croc,
      {
        characters: [HARUTA],
        hand: [WV.mohji],
        deck: [WV.marco, BLUE],
      },
      { characters: [{ card: WV.sai, rested: true }] },
    );
    attack(g, g.find('p1', 'characters', HARUTA), g.find('p2', 'characters', WV.sai));
    expect(handOf(g)).toEqual([WV.marco, WV.mohji].sort());
  });

  it('fires on every attack that Haruta makes (once per attack declaration)', () => {
    const g = board(2);
    attack(g, g.find('p1', 'characters', HARUTA), g.leader('p2'));
    noDefence(g);
    need(g, 'main', 'p1');
    expect(handOf(g)).toHaveLength(3);
  });

  it('deck-out: with 1 card in the deck and a small hand the draw empties it and I lose; with 5 in hand I do not', () => {
    const lose = board(2, [BLUE]);
    attack(lose, lose.find('p1', 'characters', HARUTA), lose.leader('p2'));
    expect(result(lose)).toMatchObject({ winner: 'p2' });
    const keep = board(5, [BLUE]);
    attack(keep, keep.find('p1', 'characters', HARUTA), keep.leader('p2'));
    expect(result(keep)).toBeNull();
  });
});

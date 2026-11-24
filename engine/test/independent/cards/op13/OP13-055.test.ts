/**
 * OP13-055 Rakuyo (Character, Blue, cost 3, 4000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[When Attacking] If you have 4 or less cards in your hand, all of your Characters with
 * a type including "Whitebeard Pirates" gain +1000 power during this turn."
 *
 * Rules: digest 72 ("during this turn" modifiers expire in the End Phase), "type including" is a
 * substring test, only Characters (not the Leader) are named, the condition is read when the
 * effect resolves.
 */
import { describe, expect, it } from 'vitest';
import { attack, mine, need, noDefence, toMyNextMain, WL, WV } from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const RAKUYO = 'OP13-055';

function board(handSize: number, chars: string[] = [WV.thatch], p2Chars: string[] = []): TestGame {
  return mine(
    WL.ace,
    {
      characters: [RAKUYO, ...chars],
      hand: Array.from({ length: handSize }, () => WV.mohji),
    },
    { characters: p2Chars },
  );
}

const pow = (g: TestGame, card: string, who: 'p1' | 'p2' = 'p1') =>
  g.power(g.find(who, 'characters', card));

describe('OP13-055 Rakuyo: [When Attacking] with 4 or less cards in hand, my {Whitebeard Pirates} Characters get +1000 this turn', () => {
  it('4 cards in hand (boundary): every {Whitebeard Pirates} Character gets +1000, Rakuyo included', () => {
    const g = board(4);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    expect(pow(g, WV.thatch)).toBe(9000);
    expect(pow(g, RAKUYO)).toBe(5000);
  });

  it('5 cards in hand (boundary): no boost', () => {
    const g = board(5);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    expect(pow(g, WV.thatch)).toBe(8000);
    expect(pow(g, RAKUYO)).toBe(4000);
  });

  it('0 cards in hand: boosted', () => {
    const g = board(0);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    expect(pow(g, WV.thatch)).toBe(9000);
  });

  it('types that merely include the words count; other Characters do not', () => {
    const g = board(2, [WV.marco, WV.doma, WV.mohji]);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    expect(pow(g, WV.marco)).toBe(6000); // {Former Whitebeard Pirates}
    expect(pow(g, WV.doma)).toBe(4000); // {Whitebeard Pirates Allies}
    expect(pow(g, WV.mohji)).toBe(3000); // {Buggy Pirates}
  });

  it('the Leader is not a Character: a {Whitebeard Pirates} Leader gets nothing', () => {
    const g = board(2);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the opponent Characters are not boosted', () => {
    const g = board(2, [WV.thatch], [WV.thatch]);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    expect(pow(g, WV.thatch, 'p2')).toBe(8000);
  });

  it('lasts through the whole turn, past the battle', () => {
    const g = board(2);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    noDefence(g);
    need(g, 'main', 'p1');
    expect(pow(g, WV.thatch)).toBe(9000);
  });

  it('ends with the turn: back to 8000 on my next turn', () => {
    const g = board(2);
    attack(g, g.find('p1', 'characters', RAKUYO), g.leader('p2'));
    noDefence(g);
    toMyNextMain(g);
    need(g, 'main', 'p1');
    expect(pow(g, WV.thatch)).toBe(8000);
  });

  it('does not fire when another Character attacks', () => {
    const g = board(2);
    attack(g, g.find('p1', 'characters', WV.thatch), g.leader('p2'));
    expect(pow(g, WV.thatch)).toBe(8000);
  });

  it('two Rakuyos attacking in one turn stack: +2000', () => {
    const g = mine(WL.ace, { characters: [RAKUYO, RAKUYO, WV.thatch], hand: [WV.mohji] });
    attack(g, g.find('p1', 'characters', RAKUYO, 0), g.leader('p2'));
    noDefence(g);
    need(g, 'main', 'p1');
    attack(g, g.find('p1', 'characters', RAKUYO, 1), g.leader('p2'));
    expect(pow(g, WV.thatch)).toBe(10000);
  });
});

/**
 * OP13-056 LittleOars Jr. (Character, Blue, cost 7, 7000, Counter +1000, {Giant}/{Whitebeard
 * Pirates Allies}).
 *
 * Card text: "[When Attacking] If your Leader's type includes "Whitebeard Pirates", draw 1 card."
 *
 * Rules: CR 8-1-2 (mandatory), "type includes" is a substring test on my Leader's types (the
 * Character's own types do not count), RL-26 (deck-out).
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

const OARS = 'OP13-056';

function board(
  leader: string,
  hand: string[] = [],
  deck: string[] = [WV.marco, WV.sai, BLUE, BLUE],
): TestGame {
  return mine(leader, { characters: [OARS, WV.thatch], hand, deck });
}

const swing = (g: TestGame, who: string = OARS) =>
  attack(g, g.find('p1', 'characters', who), g.leader('p2'));

describe('OP13-056 LittleOars Jr.: [When Attacking] with a {Whitebeard Pirates} Leader, draw 1', () => {
  it('{Whitebeard Pirates} Leader: draws exactly the top card', () => {
    const g = board(WL.ace);
    swing(g);
    expect(handOf(g)).toEqual([WV.marco]);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });

  it('a Leader without the type (Crocodile): draws nothing', () => {
    const g = board(WL.croc);
    swing(g);
    expect(handOf(g)).toEqual([]);
  });

  it('a Leader with another Whitebeard-free type (FILM / Red-Haired Pirates): draws nothing', () => {
    const g = board(WL.shanks);
    swing(g);
    expect(handOf(g)).toEqual([]);
  });

  it('a multicoloured {Whitebeard Pirates} Leader (OP13-002 Ace) also qualifies', () => {
    const g = board('OP13-002');
    swing(g);
    expect(handOf(g)).toEqual([WV.marco]);
  });

  it('there is no hand-size condition: draws with a big hand too', () => {
    const g = board(
      WL.ace,
      Array.from({ length: 8 }, () => WV.mohji),
    );
    swing(g);
    expect(handOf(g)).toHaveLength(9);
  });

  it("my own Characters' types do not matter, only the Leader: Whitebeard Characters with a Croc Leader draw nothing", () => {
    const g = board(WL.croc);
    swing(g, OARS);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([OARS, WV.thatch].sort());
    expect(handOf(g)).toEqual([]);
  });

  it('it resolves with no prompt: the battle waits at the Block Step', () => {
    const g = board(WL.ace);
    swing(g);
    expect(decision(g)).toMatchObject({ kind: 'block', player: 'p2' });
  });

  it('does not fire when another Character attacks', () => {
    const g = board(WL.ace);
    swing(g, WV.thatch);
    expect(handOf(g)).toEqual([]);
  });

  it('draws on each attack: a second attack in the same turn needs another attacker', () => {
    const g = mine(WL.ace, { characters: [OARS], deck: [WV.marco, WV.sai, BLUE, BLUE] });
    swing(g);
    noDefence(g);
    need(g, 'main', 'p1');
    expect(handOf(g)).toEqual([WV.marco]);
  });

  it('deck-out: attacking with a 1-card deck draws it and loses; with a non-matching Leader it does not', () => {
    const lose = board(WL.ace, [], [BLUE]);
    swing(lose);
    expect(result(lose)).toMatchObject({ winner: 'p2' });
    const keep = board(WL.croc, [], [BLUE]);
    swing(keep);
    expect(result(keep)).toBeNull();
  });
});

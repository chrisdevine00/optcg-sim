/**
 * OP13-043 Otama (Character, Blue, cost 1, 0 power, Counter +2000, {Land of Wano}).
 *
 * Card text: "[On Play] If you have 3 or less Life cards, draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-1-2 (mandatory), RL-26 (deck-out), CR 8-3-... conditions are checked as the effect
 * resolves; "draw 2 cards and trash 1" is one unit.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  choices,
  dons,
  handOf,
  isMain,
  mine,
  need,
  pickInst,
  playRaw,
  result,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const OTAMA = 'OP13-043';

function board(
  life: number,
  deck: string[] = [WV.marco, WV.sai, BLUE, BLUE, BLUE, BLUE],
): TestGame {
  return mine(WL.croc, {
    hand: [OTAMA, WV.mohji],
    deck,
    life: Array.from({ length: life }, () => BLUE),
  });
}

describe('OP13-043 Otama: [On Play] with 3 or less Life, draw 2 and trash 1', () => {
  it('3 Life (boundary): draws 2, then asks to trash exactly 1', () => {
    const g = board(3);
    playRaw(g, OTAMA);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    expect(handOf(g)).toEqual([WV.marco, WV.mohji, WV.sai].sort());
  });

  it('4 Life (boundary): nothing happens and nothing is asked', () => {
    const g = board(4);
    playRaw(g, OTAMA);
    expect(isMain(g)).toBe(true);
    expect(handOf(g)).toEqual([WV.mohji]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
  });

  it('5 Life: nothing happens', () => {
    const g = board(5);
    playRaw(g, OTAMA);
    expect(isMain(g)).toBe(true);
    expect(handOf(g)).toEqual([WV.mohji]);
  });

  it('0 Life: the effect still works (0 is "3 or less")', () => {
    const g = board(0);
    playRaw(g, OTAMA);
    need(g, 'choose', 'p1');
    expect(handOf(g)).toHaveLength(3);
  });

  it('the trashed card is the chosen one, a just-drawn card among the candidates', () => {
    const g = board(2);
    playRaw(g, OTAMA);
    need(g, 'choose', 'p1');
    expect(
      choices(g)
        .map((i) => g.card(i).card)
        .sort(),
    ).toEqual([WV.marco, WV.mohji, WV.sai].sort());
    pickInst(g, [g.find('p1', 'hand', WV.sai)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([WV.sai]);
    expect(handOf(g)).toEqual([WV.marco, WV.mohji].sort());
    expect(isMain(g)).toBe(true);
  });

  it('the trash is mandatory: no way to skip it', () => {
    const g = board(3);
    playRaw(g, OTAMA);
    need(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
  });

  it('the Life cards are not touched', () => {
    const g = board(3);
    playRaw(g, OTAMA);
    need(g, 'choose', 'p1');
    expect(g.life('p1')).toBe(3);
  });

  it('with 4 Life and a 1-card deck there is no draw, so no deck-out', () => {
    const g = board(4, [BLUE]);
    playRaw(g, OTAMA);
    expect(result(g)).toBeNull();
  });

  it('with 3 Life and a 1-card deck, "draw 2" empties the deck and I lose (RL-26)', () => {
    const g = board(3, [BLUE]);
    playRaw(g, OTAMA);
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('Otama costs 1 and has 0 power', () => {
    const g = board(4);
    playRaw(g, OTAMA);
    expect(dons(g).rested).toBe(1);
    expect(g.power(g.find('p1', 'characters', OTAMA))).toBe(0);
  });
});

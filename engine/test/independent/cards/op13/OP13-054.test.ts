/**
 * OP13-054 Yamato (Character, Blue, cost 5, 6000, Counter +1000, {Land of Wano}).
 *
 * Card text: "[On Play] If you have 3 or less Life cards, draw 2 cards. Then, give up to 1 rested
 * DON!! card to your Leader."
 *
 * Rules: digest 122 / CR 4-10-1 and M6b-Q13 (answered): a "Then" after a failed "If" does not
 * resolve, so with 4 or more Life nothing happens at all. Digest 55 (only rested cost-area DON!!
 * can be given), CR 8-4-4-1 ("up to"), RL-26 (deck-out).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  decision,
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

const YAMATO = 'OP13-054';

function board(
  life: number,
  deck: string[] = [WV.marco, WV.sai, BLUE, BLUE, BLUE],
  costArea = { active: 10, rested: 0 },
): TestGame {
  return mine(WL.ace, {
    hand: [YAMATO],
    deck,
    life: Array.from({ length: life }, () => BLUE),
    characters: [WV.thatch],
    costArea,
  });
}

/** Play Yamato and, when the condition holds, answer the "give up to 1 DON!! to my Leader" pick. */
function playGive(g: TestGame): void {
  playRaw(g, YAMATO);
  need(g, 'choose', 'p1');
  pickInst(g, [g.leader('p1')]);
}

describe('OP13-054 Yamato: [On Play] with 3 or less Life, draw 2, then give up to 1 rested DON!! to my Leader', () => {
  it('3 Life (boundary): draws 2 and gives the Leader 1 rested DON!!', () => {
    const g = board(3);
    playGive(g);
    expect(isMain(g)).toBe(true);
    expect(handOf(g)).toEqual([WV.marco, WV.sai].sort());
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('4 Life (boundary): nothing is drawn and, because the "Then" follows a failed "If", no DON!! is given', () => {
    const g = board(4);
    playRaw(g, YAMATO);
    expect(isMain(g)).toBe(true);
    expect(handOf(g)).toEqual([]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(dons(g)).toMatchObject({ rested: 5, given: 0 });
  });

  it('0 Life: works (0 is "3 or less")', () => {
    const g = board(0);
    playGive(g);
    expect(handOf(g)).toHaveLength(2);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('5 Life: nothing at all', () => {
    const g = board(5);
    playRaw(g, YAMATO);
    expect(handOf(g)).toEqual([]);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('the DON!! comes from the rested cost-area DON!!: 5 rested by the cost, one is given', () => {
    const g = board(2);
    playGive(g);
    expect(dons(g)).toMatchObject({ active: 5, rested: 4, given: 1 });
  });

  it('"up to 1": never more than one DON!!, even with many rested', () => {
    const g = board(2, undefined, { active: 5, rested: 5 });
    playGive(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(dons(g)).toMatchObject({ rested: 9, given: 1 });
  });

  it('the DON!! goes to the Leader, not to a Character', () => {
    const g = board(2);
    playRaw(g, YAMATO);
    need(g, 'choose', 'p1');
    // only the Leader is a candidate
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pickInst(g, [g.leader('p1')]);
    expect(g.card(g.find('p1', 'characters', WV.thatch)).don).toBe(0);
    expect(g.card(g.find('p1', 'characters', YAMATO)).don).toBe(0);
  });

  it('"up to 1": the DON!! may be declined; the draw still happened', () => {
    const g = board(3);
    playRaw(g, YAMATO);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(handOf(g)).toHaveLength(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(isMain(g)).toBe(true);
  });

  it('the Leader gains +1000 power from the given DON!!', () => {
    const g = board(2);
    playGive(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the Life cards are not touched', () => {
    const g = board(3);
    playGive(g);
    expect(g.life('p1')).toBe(3);
    expect(decision(g)?.kind).toBe('main');
  });

  it('deck-out: 2 cards in the deck and 3 Life draws them and loses; with 4 Life nothing is drawn', () => {
    const lose = board(3, [BLUE, BLUE]);
    playRaw(lose, YAMATO);
    expect(result(lose)).toMatchObject({ winner: 'p2' });
    const keep = board(4, [BLUE, BLUE]);
    playRaw(keep, YAMATO);
    expect(result(keep)).toBeNull();
  });
});

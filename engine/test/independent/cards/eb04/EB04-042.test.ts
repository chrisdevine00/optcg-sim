/**
 * EB04-042 Alpha (Character, Black, cost 1, 2000, Counter +2000, {CP8}).
 *
 * Card text: "[On Play] You may trash 3 cards from the top of your deck: Give up to 1 of your
 * opponent's Characters −1 cost during this turn."
 *
 * Rules: the cost is trashing the top 3 cards of the deck; it cannot be paid with fewer than 3
 * cards. "Up to 1" may be none. A cost modification "during this turn" ends at the end of the turn.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  costOf,
  decision,
  deck,
  endTurn,
  fill,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickRaw,
  playRaw,
  result,
  trash,
  unusable,
  yes,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-042';
const SAI = 'OP01-012'; // Red, cost 2, 4000
const KINGDEW = 'OP02-006'; // Red, cost 5, 7000
const MARCO = 'OP01-023'; // Red, cost 3, 5000
const MOHJI = 'OP02-060'; // Blue, cost 1, 3000

function play(deckCards: string[], foes: string[] = [KINGDEW, SAI], own: string[] = []): TestGame {
  const g = mine(
    LB.navy,
    { hand: [ID], deck: deckCards, characters: own },
    { characters: foes, deck: fill(BLUE, 10) },
  );
  playRaw(g, ID);
  return g;
}

const DECK = [SAI, MARCO, KINGDEW, ...fill(BLUE, 7)];

describe('EB04-042 Alpha: [On Play] trash 3 from the top of your deck: an opposing Character gets -1 cost this turn', () => {
  it('trashes the top 3 cards and lowers the chosen Character cost by 1', () => {
    const g = play(DECK);
    yes(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SAI, MARCO, KINGDEW].sort());
    expect(deck(g)).toHaveLength(7);
    expect(costOf(g, at(g, 'p2', 'characters', KINGDEW))).toBe(4);
    expect(costOf(g, at(g, 'p2', 'characters', SAI))).toBe(2);
  });

  it('offers only the opponent Characters', () => {
    const g = play(DECK, [KINGDEW, SAI], [MOHJI]);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KINGDEW, SAI].sort());
  });

  it('"up to 1": may choose nobody; the cards are still trashed', () => {
    const g = play(DECK);
    yes(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(trash(g)).toHaveLength(3);
    expect(costOf(g, at(g, 'p2', 'characters', KINGDEW))).toBe(5);
  });

  it('declining the "you may" cost: nothing is trashed and no cost changes', () => {
    const g = play(DECK);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(10);
    expect(costOf(g, at(g, 'p2', 'characters', KINGDEW))).toBe(5);
  });

  it('boundary: 4 cards in the deck can pay the cost and leave 1', () => {
    const g = play([SAI, MARCO, KINGDEW, MOHJI]);
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', SAI));
    expect(deck(g)).toHaveLength(1);
    expect(trash(g)).toHaveLength(3);
    expect(costOf(g, at(g, 'p2', 'characters', SAI))).toBe(1);
  });

  it('boundary: paying with exactly 3 cards empties the deck, which loses the game at once (CR 9-2-1-2)', () => {
    const g = play([SAI, MARCO, KINGDEW]);
    yes(g);
    expect(result(g)).not.toBeNull();
    expect(trash(g)).toHaveLength(3);
  });

  it('boundary: with only 2 cards in the deck the cost cannot be paid and nothing happens', () => {
    const g = play([SAI, MARCO]);
    unusable(g);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(2);
    expect(costOf(g, at(g, 'p2', 'characters', KINGDEW))).toBe(5);
  });

  it('with no opposing Character the cost can still be paid and the pick has no candidates', () => {
    const g = play(DECK, []);
    yes(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toHaveLength(3);
  });

  it('the -1 cost ends at the end of the turn', () => {
    const g = play(DECK);
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(costOf(g, at(g, 'p2', 'characters', KINGDEW))).toBe(4);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(costOf(g, at(g, 'p2', 'characters', KINGDEW))).toBe(5);
  });

  it('Alpha stays on the field and its own cost is unchanged', () => {
    const g = play(DECK);
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', SAI));
    expect(costOf(g, at(g, 'p1', 'characters', ID))).toBe(1);
    expect(decision(g)?.kind).toBe('main');
  });
});

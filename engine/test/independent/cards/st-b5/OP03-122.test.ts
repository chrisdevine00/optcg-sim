/**
 * OP03-122 Sogeking (Character, Blue, cost 7, 6000, Counter +1000, {Sniper Island}).
 *
 * Card text: "Also treat this card's name as [Usopp] according to the rules. [On Play] Return up to 1
 * Character with a cost of 6 or less to the owner's hand. Then, draw 2 cards and trash 2 cards
 * from your hand."
 *
 * Rules: "a cost of 6 or less" is the current cost and includes 6 (CR 4-9-2 for base only when
 * stated); either player's Character may be chosen and goes to its OWNER's hand; "up to 1" allows
 * 0; "Then" clauses run on their own (CR 4-10-2); "draw 2 and trash 2" are exact; DON!! given to a
 * returned Character go to the cost area rested (CR 6-5-5-4).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  choices,
  deck,
  don,
  hand,
  kind,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  pickInst,
  playCardRaw,
  SL,
  trash,
} from './kit-stb5a.ts';

const ID = 'OP03-122';
const THATCH = 'OP02-006'; // Kingdew: Red, cost 5, 7000
const SIX = 'OP02-007'; // Thatch: Red, cost 6, 8000
const SEVEN = 'OP02-020'; // LittleOars Jr.: Red, cost 7, 9000
const SAI = 'OP01-012'; // Red, cost 2, 4000
const MARCO = 'OP01-023'; // Red, cost 3, 5000
const DECK = ['OP01-010', 'OP01-043', 'OP01-053', ...Array(10).fill(BLUE)];

function played(
  p1chars: (string | { card: string; don?: number })[] = [],
  p2chars: (string | { card: string; don?: number })[] = [],
  inHand: string[] = [SAI, MARCO],
  costArea = { active: 10, rested: 0 },
  p2extra: Record<string, unknown> = {},
) {
  const g = mine(
    SL.croc,
    { hand: [ID, ...inHand], characters: p1chars, deck: DECK, costArea },
    { characters: p2chars, ...p2extra },
  );
  playCardRaw(g, ID);
  return g;
}

describe("OP03-122 Sogeking: [On Play] return up to 1 Character with cost 6 or less to its owner's hand", () => {
  it('offers Characters of both players with cost 6 or less (6 included), not cost 7', () => {
    const g = played([SAI], [SIX, SEVEN, MARCO]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI, SIX, MARCO].sort());
  });

  it("returns the opponent's Character to the OPPONENT's hand", () => {
    const g = played([], [THATCH]);
    pickInst(g, [g.find('p2', 'characters', THATCH)]);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'hand').map((c) => c.card)).toEqual([THATCH]);
  });

  it('returns my own Character to my hand', () => {
    const g = played([MARCO], []);
    pickInst(g, [g.find('p1', 'characters', MARCO)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(g)).toContain(MARCO);
  });

  it('"up to 1": may return nothing, and the draw and trash still happen', () => {
    const g = played([], [THATCH]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(4);
  });

  it('returns only one Character even with several candidates', () => {
    const g = played([SAI], [THATCH, SIX]);
    pickInst(g, [g.find('p2', 'characters', SIX)]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([SAI, ID].sort());
  });

  it('Sogeking itself (cost 7) is not a candidate', () => {
    const g = played([], [SAI]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAI]);
    expect(choices(g)).toHaveLength(1);
  });

  it("DON!! given to a returned Character go to its owner's cost area rested", () => {
    const g = played(
      [],
      [{ card: THATCH, don: 2 }],
      [SAI, MARCO],
      { active: 10, rested: 0 },
      {
        costArea: { active: 4, rested: 0 },
      },
    );
    pickInst(g, [g.find('p2', 'characters', THATCH)]);
    expect(don(g, 'p2')).toMatchObject({ given: 0, rested: 2, active: 4 });
  });
});

describe('OP03-122 Sogeking: then draw 2 cards and trash 2 cards from my hand', () => {
  it('draws the top 2 cards then trashes exactly 2 chosen hand cards', () => {
    const g = played([], [THATCH]);
    pickInst(g, [g.find('p2', 'characters', THATCH)]);
    need(g, 'choose', 'p1');
    expect(hand(g)).toEqual([SAI, MARCO, 'OP01-010', 'OP01-043'].sort());
    pickCards(g, [SAI, 'OP01-010']);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SAI, 'OP01-010'].sort());
    expect(hand(g)).toEqual([MARCO, 'OP01-043'].sort());
    expect(deck(g)).toHaveLength(DECK.length - 2);
  });

  it('the trash is exactly 2 and comes from the whole hand, my own Character return included', () => {
    const g = played([MARCO], []);
    pickInst(g, [g.find('p1', 'characters', MARCO)]);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    expect(offeredIds(g)).toContain(MARCO);
  });

  it('happens even with no Character to return (no targets)', () => {
    const g = played([], []);
    if (kind(g) === 'choose' && choices(g).length === 0) none(g);
    need(g, 'choose', 'p1');
    expect(hand(g)).toHaveLength(4);
    pickCards(g, [SAI, MARCO]);
    expect(trash(g)).toEqual([SAI, MARCO].sort());
    expect(hand(g)).toEqual(['OP01-010', 'OP01-043'].sort());
  });

  it('may trash the Character that was just returned to my hand', () => {
    const g = played([MARCO], [], [SAI]);
    pickInst(g, [g.find('p1', 'characters', MARCO)]);
    pickCards(g, [MARCO, SAI]);
    expect(trash(g)).toEqual([MARCO, SAI].sort());
  });

  it("the opponent's hand and deck are untouched by the draw and the trash", () => {
    const g = played([], [THATCH]);
    pickInst(g, [g.find('p2', 'characters', THATCH)]);
    pickCards(g, [SAI, MARCO]);
    expect(g.zone('p2', 'hand')).toHaveLength(1);
    expect(g.zone('p2', 'deck')).toHaveLength(15);
    expect(trash(g, 'p2')).toEqual([]);
  });
});

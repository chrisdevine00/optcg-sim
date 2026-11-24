/**
 * OP16-118 Portgas.D.Ace (Character, Red, cost 5, 6000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "The counter of all of your Character cards with 8000 power in your hand becomes +2000.
 * [On Play]/[On K.O.] Look at 5 cards from the top of your deck; reveal up to 1 [Monkey.D.Luffy] or
 * up to 1 card with a type including "Whitebeard Pirates" and add it to your hand. Then, place the
 * rest at the bottom of your deck in any order."
 *
 * Scenery: OP02-007 Thatch (8000, Counter +1000, {Whitebeard Pirates}), OP12-025 Kin'emon (8000,
 * Counter +1000), OP16-089 Mihawk (8000, no Counter), OP01-092 Urashima (9000), OP01-023 Marco (5000,
 * {Former Whitebeard Pirates}), OP16-016 Ramba ({Whitebeard Pirates Allies}), ST09-011 Monkey.D.Luffy
 * (Character named [Monkey.D.Luffy], vanilla).
 *
 * Rules: CR 2-10-4 (Counter value), CR 6-6 (continuous effects apply while the source is on the
 * field), CR 8-4-4-1 ("up to"), CR 11-2-1 (reveal), CR 7-1-2 (a Character's Counter in the Counter
 * Step), CR 10-2-1 ([On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  BLUE,
  choices,
  cardIds,
  deck,
  hand,
  hasEvent,
  kind,
  LD16,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playIt,
  reachablePickSets,
  SC16,
  SCN,
  settleOrders,
  takeDamage,
  tail,
  theirs,
  theyKo,
  trash,
  useCounter,
} from './kit-op16c.ts';

const ID = 'OP16-118';
const LUFFY = 'ST09-011'; // [Monkey.D.Luffy]
const THATCH = SC16.wb6; // 8000
const MARCO = 'OP01-023'; // {Former Whitebeard Pirates}
const RAMBA = SC16.wbAllies6; // {Whitebeard Pirates Allies}
const KIN6 = SC16.wano6; // 8000, Counter +1000
const MIHAWK = 'OP16-089'; // 8000, no Counter
const URASHIMA = SC16.wano7; // 9000
const EVENT = 'OP16-099';

function counterOf(g: ReturnType<typeof mine>, card: string, who: 'p1' | 'p2' = 'p1') {
  return g.card(g.find(who, 'hand', card)).counter;
}

describe('OP16-118 Portgas.D.Ace: my 8000-power Characters in hand have Counter +2000', () => {
  it('with Ace on the field: 8000-power Characters in hand show +2000 (printed +1000 and no printed Counter alike)', () => {
    const g = mine(LD16.plain, { characters: [ID], hand: [THATCH, KIN6, MIHAWK] });
    expect(counterOf(g, THATCH)).toBe(2000);
    expect(counterOf(g, KIN6)).toBe(2000);
    expect(counterOf(g, MIHAWK)).toBe(2000);
  });

  it('boundary: 9000 and 5000 power Characters and Events keep their own Counter', () => {
    const g = mine(LD16.plain, { characters: [ID], hand: [URASHIMA, MARCO, EVENT] });
    expect(counterOf(g, URASHIMA)).toBe(1000);
    expect(counterOf(g, MARCO)).toBe(1000);
    expect(counterOf(g, EVENT) ?? 0).not.toBe(2000);
  });

  it('without Ace on the field the value is the printed one', () => {
    const g = mine(LD16.plain, { hand: [THATCH, ID] });
    expect(counterOf(g, THATCH)).toBe(1000);
    expect(counterOf(g, ID)).toBe(1000);
  });

  it("it is my Characters only: the opponent's 8000-power Character in hand keeps +1000", () => {
    const g = mine(LD16.plain, { characters: [ID] }, { hand: [THATCH] });
    expect(counterOf(g, THATCH, 'p2')).toBe(1000);
  });

  it('the +2000 is real in battle: a 6000 attacker is stopped by a 5000 Leader countered with Thatch (7000), not with +1000 (6000)', () => {
    const g = theirs(LD16.plain, { characters: [ID], hand: [THATCH] }, { characters: [SCN.c4] });
    attack(g, at(g, 'p2', 'characters', SCN.c4), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', THATCH), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    act(g, { type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });
});

describe('OP16-118 Portgas.D.Ace: [On Play] look at 5, add up to 1 [Monkey.D.Luffy] or "Whitebeard Pirates" card, rest to the bottom', () => {
  const top = () => [LUFFY, THATCH, MARCO, RAMBA, BLUE];
  const start = (cards: string[], extra: string[] = []) => {
    const g = mine(LD16.plain, { hand: [ID], deck: [...cards, ...extra, ...Array(10).fill(BLUE)] });
    playIt(g, ID);
    return g;
  };

  it('offers exactly [Monkey.D.Luffy] and the cards whose type includes "Whitebeard Pirates" (Former and Allies too)', () => {
    const g = start(top());
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUFFY, THATCH, MARCO, RAMBA].sort());
  });

  it('the pick goes to hand (revealed); the other four go to the bottom of the deck, the deck below the five is now on top', () => {
    const g = start(top(), ['OP01-043']);
    pickCards(g, [THATCH]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([THATCH]);
    expect(hasEvent(g, 'CardRevealed', { card: THATCH })).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: RAMBA })).toBe(false);
    expect(deck(g)[0]).toBe('OP01-043');
    expect(tail(deck(g), 4)).toEqual([LUFFY, MARCO, RAMBA, BLUE].sort());
  });

  it('"or": at most one card in total, never one of each', () => {
    const g = start(top());
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.has([LUFFY, THATCH].sort().join('+'))).toBe(false);
  });

  it('"up to": may add nothing; all five go to the bottom', () => {
    const g = start(top(), ['OP01-043']);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe('OP01-043');
    expect(tail(deck(g), 5)).toEqual([...top()].sort());
  });

  it('only the top 5 are looked at: a match in position 6 is not offered', () => {
    const g = start([BLUE, BLUE, BLUE, BLUE, BLUE, THATCH]);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(THATCH);
  });

  it('a card that does not match (a Character of another type) is not offered', () => {
    const g = start([SC16.wano3, SCN.c4, THATCH, BLUE, BLUE]);
    expect(offeredIds(g)).toEqual([THATCH]);
  });

  it('the cards are placed at the bottom, not the top and not the trash', () => {
    const g = start(top());
    pickCards(g, [LUFFY]);
    settleOrders(g);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(choices(g)).toEqual([]);
  });
});

describe('OP16-118 Portgas.D.Ace: [On K.O.] the same look-at-5 effect', () => {
  it("K.O.'d on the opponent's turn: look at 5, add a [Monkey.D.Luffy] to hand", () => {
    const g = theirs(
      LD16.plain,
      {
        characters: [{ card: ID, rested: true }],
        deck: [LUFFY, BLUE, BLUE, BLUE, BLUE, ...Array(10).fill(BLUE)],
      },
      { characters: [SCN.c7] },
    );
    theyKo(g, at(g, 'p1', 'characters', ID), at(g, 'p2', 'characters', SCN.c7));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LUFFY]);
    pickCards(g, [LUFFY]);
    settleOrders(g, 'p1');
    expect(hand(g)).toEqual([LUFFY]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ID]);
  });
});

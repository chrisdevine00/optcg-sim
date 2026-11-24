/**
 * OP12-014 Boa Hancock (Character, Red, cost 2, 3000, no Counter, {Kuja Pirates} {The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Monkey.D.Luffy] or
 * red Event and add it to your hand. Then, place the rest at the bottom of your deck in any order.
 * [Activate: Main] You may trash this Character: Give up to 2 rested DON!! cards to your Leader or
 * 1 of your Characters."
 *
 * Rules: "[Monkey.D.Luffy]" is a card name (any colour, Characters of that name); "red Event" is an
 * Event card of colour red; "up to 1" may be 0 and "or" means one card in all (CR 4-8-1); only the
 * top 5 are looked at; the rest go to the bottom (CR 8-4-4-2). The trash cost removes Hancock
 * before the DON!! are given; given DON!! are +1000 power each on the owner's turn.
 */
import { describe, expect, it } from 'vitest';
import {
  chr,
  deckTop,
  donOf,
  finishLook,
  giveDonFlow,
  kind,
  LD12,
  mine,
  need,
  offeredCardIds,
  offeredOn,
  playRaw,
  S12,
  settleEmpty,
  sorted,
  startActivate,
} from './kit-op12a.ts';

const HAN = 'OP12-014';
const E = S12.event;
const FILL_BLUE = S12.mohji;

/** Top 5: Luffy (green), red Event, black Event, red Sai, blue Mohji; position 6 is a red Luffy. */
const TOP5 = [S12.luffyGreen, E, S12.iceAge, S12.sai, S12.mohji];

function start(top: string[] = TOP5) {
  const g = mine(LD12.luffy, {
    hand: [HAN],
    deck: [...top, S12.luffyRed, ...Array.from({ length: 8 }, () => FILL_BLUE)],
  });
  playRaw(g, HAN);
  return g;
}

function onBoard(rested: number, chars: string[] = []) {
  return mine(LD12.luffy, {
    characters: [HAN, ...chars],
    costArea: { active: 3, rested },
  });
}

describe('OP12-014 Boa Hancock: [On Play] look at 5 for Luffy or a red Event', () => {
  it('printed values: cost 2, 3000, no Counter', () => {
    const g = onBoard(0);
    const c = g.card(chr(g, 'p1', HAN));
    expect([c.cost, c.power, c.counter]).toEqual([2, 3000, null]);
  });

  it('offers exactly [Monkey.D.Luffy] of any colour and red Events among the top 5', () => {
    const g = start();
    need(g, 'choose', 'p1');
    // green Luffy and the red Event; not the black Event, the red Sai or the blue Mohji
    expect(offeredCardIds(g)).toEqual([E, S12.luffyGreen].sort());
  });

  it('a red [Monkey.D.Luffy] Character and a non-red Luffy are both offered; a red Character of another name is not', () => {
    const g = start([S12.luffyRed, S12.luffyGreen, S12.sai, S12.iceAge, S12.mohji]);
    expect(offeredCardIds(g)).toEqual([S12.luffyGreen, S12.luffyRed].sort());
  });

  it('adds the chosen card to the hand and puts the other 4 at the bottom; the 6th card is now on top', () => {
    const g = start();
    finishLook(g, E);
    expect(sorted(g, 'p1', 'hand')).toEqual([E]);
    const deck = deckTop(g);
    expect(deck).toHaveLength(13);
    expect(deck[0]).toBe(S12.luffyRed);
    expect(deck.slice(-4).sort()).toEqual([S12.luffyGreen, S12.iceAge, S12.sai, S12.mohji].sort());
  });

  it('"up to 1": adding nothing puts all 5 at the bottom', () => {
    const g = start();
    finishLook(g, null);
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
    const deck = deckTop(g);
    expect(deck[0]).toBe(S12.luffyRed);
    expect(deck.slice(-5).sort()).toEqual([...TOP5].sort());
  });

  it('adds only one card even when two qualify', () => {
    const g = start();
    finishLook(g, S12.luffyGreen);
    expect(sorted(g, 'p1', 'hand')).toEqual([S12.luffyGreen]);
    expect(deckTop(g).slice(-4)).toContain(E);
  });

  it('only the top 5 are looked at: a matching card in position 6 is not offered', () => {
    const g = start([S12.sai, S12.sai, S12.sai, S12.sai, S12.sai]);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      finishLook(g, null);
    }
    expect(sorted(g, 'p1', 'hand')).toEqual([]);
    expect(deckTop(g)[0]).toBe(S12.luffyRed);
  });
});

describe('OP12-014 Boa Hancock: [Activate: Main] trash this, give up to 2 rested DON!!', () => {
  it('trashes Hancock as the cost and gives 2 rested DON!! to the Leader (+2000 this turn)', () => {
    const g = onBoard(2);
    startActivate(g, chr(g, 'p1', HAN));
    giveDonFlow(g, 2, g.leader('p1'));
    expect(sorted(g, 'p1', 'characters')).toEqual([]);
    expect(sorted(g, 'p1', 'trash')).toEqual([HAN]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('can give them to one of the other Characters instead', () => {
    const g = onBoard(2, [S12.sai]);
    startActivate(g, chr(g, 'p1', HAN));
    giveDonFlow(g, 2, chr(g, 'p1', S12.sai));
    expect(g.power(chr(g, 'p1', S12.sai))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 2": giving 1 leaves 1 rested', () => {
    const g = onBoard(2);
    startActivate(g, chr(g, 'p1', HAN));
    giveDonFlow(g, 1, g.leader('p1'));
    expect(donOf(g, 'p1')).toMatchObject({ rested: 1, given: 1 });
  });

  it('Hancock is not a target of her own effect: the targets are the Leader and the others', () => {
    const g = onBoard(2, [S12.sai]);
    startActivate(g, chr(g, 'p1', HAN));
    need(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: { option: '2' } });
    expect(offeredCardIds(g)).toEqual([LD12.luffy, S12.sai].sort());
  });

  it('with no rested DON!! no DON!! is given and active DON!! stay active', () => {
    const g = onBoard(0);
    if (offeredOn(g, chr(g, 'p1', HAN)).length > 0) {
      startActivate(g, chr(g, 'p1', HAN));
      settleEmpty(g);
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('is offered the turn she is played (no rest or attack needed)', () => {
    const g = mine(LD12.luffy, {
      hand: [HAN],
      deck: Array.from({ length: 10 }, () => FILL_BLUE),
      costArea: { active: 5, rested: 2 },
    });
    playRaw(g, HAN);
    if (kind(g) === 'choose') finishLook(g, null);
    expect(offeredOn(g, chr(g, 'p1', HAN))).toHaveLength(1);
  });
});

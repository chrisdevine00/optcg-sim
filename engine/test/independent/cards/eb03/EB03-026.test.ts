/**
 * EB03-026 Boa Hancock (Character, Blue, cost 6, 8000, no Counter, {Kuja Pirates}/{The Seven Warlords
 * of the Sea}).
 *
 * Card text: "[On Play] If your opponent has 5 or more cards in their hand, your opponent places 1 card
 * from their hand at the bottom of their deck.
 * [Activate: Main] [Once Per Turn] You may place 1 of your Characters at the bottom of the owner's
 * deck: Give your Leader and 1 Character up to 1 rested DON!! card each."
 *
 * Rules: CR 8-3-3 (conditions; the opponent's hand size is public). The text says the opponent places
 * the card, so the opponent chooses it. CR 8-3-1 (a "you may" cost), CR 8-1-3-2 ([Once Per Turn]),
 * giving DON!! (CR 6-5-5: rested DON!! from the cost area, +1000 on its owner's turn). Placing at the
 * bottom of the deck is not a K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  canUseAbility,
  chr,
  deck,
  decision,
  donOf,
  fill,
  hand,
  kind,
  LA,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  SA,
  trash,
  useYes,
  zoneIds,
} from './kit-eb03a.ts';
import { act } from '../../helpers.ts';
import { giveMostEach } from '../../../cards/helpers.ts';

const HANCOCK = 'EB03-026';

describe('EB03-026 Boa Hancock: printed values', () => {
  it('cost 6, 8000, no Counter', () => {
    const g = mine(LA.croc, { characters: [HANCOCK] });
    const h = chr(g, 'p1', HANCOCK);
    expect(g.card(h).cost).toBe(6);
    expect(g.power(h)).toBe(8000);
    expect(g.card(h).counter ?? 0).toBe(0);
  });
});

describe('EB03-026 Boa Hancock: [On Play] if your opponent has 5 or more cards in hand, they place 1 card from hand at the bottom of their deck', () => {
  const play = (p2Hand: string[]) => {
    const g = mine(
      LA.croc,
      { hand: [HANCOCK] },
      { hand: p2Hand, deck: [SA.mohji, SA.mohji, SA.mohji, SA.mohji, SA.mohji, SA.mohji] },
    );
    playRaw(g, HANCOCK);
    return g;
  };
  const five = [SA.marco, SA.sai, SA.kingdew, SA.thatch, SA.hajrudin];

  it('with exactly 5 cards (boundary) the opponent places 1 card: it is their choice and goes to the bottom of their deck', () => {
    const g = play(five);
    need(g, 'choose', 'p2');
    expect(decision(g)?.player).toBe('p2');
    pickInst(g, [g.find('p2', 'hand', SA.thatch)]);
    expect(hand(g, 'p2')).toEqual([SA.hajrudin, SA.kingdew, SA.marco, SA.sai].sort());
    expect(deck(g, 'p2')).toHaveLength(7);
    expect(deck(g, 'p2').at(-1)).toBe(SA.thatch);
    expect(kind(g)).toBe('main');
    expect(decision(g)?.player).toBe('p1');
  });

  it('with 6 or more cards exactly 1 card is placed', () => {
    const g = play([...five, SA.oars]);
    need(g, 'choose', 'p2');
    pickInst(g, [g.find('p2', 'hand', SA.oars)]);
    expect(hand(g, 'p2')).toHaveLength(5);
    expect(deck(g, 'p2')).toHaveLength(7);
  });

  it('boundary: with 4 cards nothing is asked and nothing is placed', () => {
    const g = play(five.slice(0, 4));
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toHaveLength(4);
    expect(deck(g, 'p2')).toHaveLength(6);
  });

  it("the card is not trashed: the opponent's trash stays empty", () => {
    const g = play(five);
    need(g, 'choose', 'p2');
    pickInst(g, [g.find('p2', 'hand', SA.sai)]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it("the opponent's hand count is read at resolution, not mine: my own hand size does not matter", () => {
    const g = mine(LA.croc, { hand: [HANCOCK, ...five] }, { hand: five.slice(0, 4) });
    playRaw(g, HANCOCK);
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toHaveLength(4);
  });
});

describe("EB03-026 Boa Hancock: [Activate: Main] [Once Per Turn] place 1 of your Characters at the bottom of its owner's deck: give your Leader and 1 Character up to 1 rested DON!! each", () => {
  const board = (extra: string[], rested = 3) =>
    mine(
      LA.croc,
      { characters: [HANCOCK, ...extra], costArea: { active: 4, rested }, deck: fill(BLUE, 10) },
      { characters: [SA.holly] },
    );

  it('pays with another Character, then the Leader and the chosen Character each receive 1 rested DON!!', () => {
    const g = board([SA.marco, SA.sai]);
    useYes(g, at(g, 'p1', 'characters', HANCOCK));
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.marco)]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    giveMostEach(g); // "up to 1 ... each": 1 or none per target (OP-18 review R8)
    expect(zoneIds(g, 'p1', 'characters')).toEqual([HANCOCK, SA.sai].sort());
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 1, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(g.power(chr(g, 'p1', SA.sai))).toBe(5000);
  });

  it("the cost goes to the bottom of MY deck and is not K.O.'d or trashed", () => {
    const g = board([SA.marco, SA.sai]);
    useYes(g, at(g, 'p1', 'characters', HANCOCK));
    pickInst(g, [chr(g, 'p1', SA.marco)]);
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    expect(deck(g, 'p1')).toHaveLength(11);
    expect(deck(g, 'p1').at(-1)).toBe(SA.marco);
    expect(trash(g, 'p1')).toEqual([]);
  });

  it('Hancock may place herself as the cost; the other Character still receives a DON!!', () => {
    const g = board([SA.marco, SA.sai]);
    useYes(g, at(g, 'p1', 'characters', HANCOCK));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HANCOCK, SA.marco, SA.sai].sort());
    pickInst(g, [chr(g, 'p1', HANCOCK)]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    giveMostEach(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([SA.marco, SA.sai].sort());
    expect(deck(g, 'p1').at(-1)).toBe(HANCOCK);
    expect(donOf(g, 'p1')).toMatchObject({ given: 2 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('offers only my own Characters for the cost', () => {
    const g = board([SA.marco]);
    useYes(g, at(g, 'p1', 'characters', HANCOCK));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HANCOCK, SA.marco].sort());
  });

  it('only RESTED DON!! is given: with 1 rested DON!! only 1 card in total receives it', () => {
    const g = board([SA.marco, SA.sai], 1);
    useYes(g, at(g, 'p1', 'characters', HANCOCK));
    pickInst(g, [chr(g, 'p1', SA.marco)]);
    need(g, 'choose', 'p1');
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (pick) g.act(pick);
      else act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, given: 1 });
  });

  it('with no rested DON!! nothing is given (the cost may still be paid)', () => {
    const g = board([SA.marco], 0);
    useYes(g, at(g, 'p1', 'characters', HANCOCK));
    for (let i = 0; i < 4 && kind(g) === 'choose'; i++) {
      const d = decision(g)!;
      const pick = g.legal().find((a) => a.type === 'pick');
      if (d.purpose === 'cost' && pick) g.act(pick);
      else if (pick && d.min !== 0) g.act(pick);
      else act(g, { type: 'done' });
    }
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Once Per Turn]: after one use it is not offered again', () => {
    const g = board([SA.marco, SA.sai]);
    const h = at(g, 'p1', 'characters', HANCOCK);
    useYes(g, h);
    pickInst(g, [chr(g, 'p1', SA.marco)]);
    pickInst(g, [chr(g, 'p1', SA.sai)]);
    giveMostEach(g);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, h)).toEqual([]);
  });

  it('a Hancock played this turn can use it at once', () => {
    const g = mine(LA.croc, {
      characters: [{ card: HANCOCK, playedThisTurn: true }, SA.marco],
      costArea: { active: 4, rested: 3 },
    });
    expect(canUseAbility(g, at(g, 'p1', 'characters', HANCOCK))).toBe(true);
  });
});

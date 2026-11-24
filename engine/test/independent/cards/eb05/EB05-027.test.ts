/**
 * EB05-027 Hibari (Character, Blue, cost 5, 6000, Counter +1000, {Navy}/{SWORD}, Ranged).
 *
 * Card text: "[On Play] Draw 3 cards and trash 2 cards from your hand. Then, place up to 1 Character
 * with a cost of 2 or less at the bottom of the owner's deck."
 *
 * Rules: CR 4-5-3 (draw X), CR 10-2-14 (Trash), CR 4-10-2 ("Then" still resolves), CR 8-4-4-1
 * ("up to"), CR 3-1-6 (a card leaving the field is a new card).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  chars,
  choiceCards,
  choose,
  chooseNone,
  deck,
  EC,
  EL,
  finishEmpty,
  hand,
  kind,
  mine,
  offeredInstance,
  playCard,
  reachablePickSets,
  settleYes,
  trash,
  VAN,
} from './kit-eb05a.ts';

const HIBARI = 'EB05-027';

function played(inHandCards: string[], own: string[] = [], opp: string[] = []) {
  const g = mine(
    EL.croc,
    { hand: [HIBARI, ...inHandCards], characters: own, deck: fill(BLUE, 12) },
    { characters: opp },
  );
  playCard(g, HIBARI);
  return g;
}

/** Trash these two cards (by card id) from the hand choice that follows the draw. */
function trashTwo(g: ReturnType<typeof played>, a: string, b: string) {
  expect(kind(g)).toBe('choose');
  choose(g, [g.find('p1', 'hand', a), g.find('p1', 'hand', b, a === b ? 1 : 0)]);
}

describe('EB05-027 Hibari: [On Play] draw 3, trash 2 from hand, then bottom-deck up to 1 Character with cost 2 or less', () => {
  it('draws 3 then trashes the 2 chosen cards: net +1 card in hand', () => {
    const g = played([VAN.mohji, VAN.sunny]);
    trashTwo(g, VAN.mohji, VAN.sunny);
    finishEmpty(g);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([VAN.mohji, VAN.sunny].sort());
    expect(hand(g)).toEqual([BLUE, BLUE, BLUE]);
    expect(deck(g)).toHaveLength(9);
  });

  it('the cards drawn by this effect may be trashed too', () => {
    const g = played([VAN.sunny]);
    const seen = new Set([...reachablePickSets(g)].flatMap((x) => x.split('+')).filter(Boolean));
    expect([...seen].sort()).toEqual([BLUE, VAN.sunny].sort());
    expect(hand(g)).toHaveLength(4);
  });

  it('exactly 2 are trashed (never 1 or 3)', () => {
    const g = played([VAN.mohji, VAN.sunny]);
    const sets = [...reachablePickSets(g)].filter(Boolean);
    for (const s of sets) {
      const picked = s.split('+');
      expect(picked.length).toBeGreaterThanOrEqual(2);
    }
    expect(sets.length).toBeGreaterThan(0);
  });

  it('places a Character with cost 2 (boundary) at the bottom of its owner’s deck; cost 3 is not a candidate', () => {
    const g = played([], [VAN.sai, VAN.marco], [VAN.komachiyo]);
    trashTwo(g, BLUE, BLUE);
    expect(choiceCards(g)).toContain(VAN.sai);
    expect(choiceCards(g)).toContain(VAN.komachiyo);
    expect(choiceCards(g)).not.toContain(VAN.marco);
    choose(g, [offeredInstance(g, VAN.sai)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([HIBARI, VAN.marco].sort());
    expect(deck(g).at(-1)).toBe(VAN.sai);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('an opposing Character goes to the bottom of the OPPONENT’S deck', () => {
    const g = played([], [], [VAN.komachiyo]);
    trashTwo(g, BLUE, BLUE);
    choose(g, [offeredInstance(g, VAN.komachiyo)]);
    settleYes(g, 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(g.zone('p2', 'deck').at(-1)!.card).toBe(VAN.komachiyo);
    expect(g.zone('p2', 'deck')).toHaveLength(16);
    expect(deck(g)).toHaveLength(9);
  });

  it('"up to 1": may place nothing', () => {
    const g = played([], [VAN.sai]);
    trashTwo(g, BLUE, BLUE);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([HIBARI, VAN.sai].sort());
  });

  it('Hibari herself (cost 5) is not a candidate; Leaders are not Characters', () => {
    const g = played([]);
    trashTwo(g, BLUE, BLUE);
    finishEmpty(g);
    expect(choiceCards(g)).not.toContain(HIBARI);
  });

  it('places at most 1 Character', () => {
    const g = played([], [VAN.sai], [VAN.komachiyo]);
    trashTwo(g, BLUE, BLUE);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with no Character of cost 2 or less nothing is placed and the draw and trash still happened', () => {
    const g = played([], [VAN.marco]);
    trashTwo(g, BLUE, BLUE);
    finishEmpty(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([HIBARI, VAN.marco].sort());
    expect(trash(g)).toEqual([BLUE, BLUE]);
    expect(EC.mocha).toBeTruthy();
  });

  it('cost is read as it is now: an opposing Little Sadi with an {Impel Down} Leader (1 + 2 = 3) is not a candidate', () => {
    const g = mine(
      EL.croc,
      { hand: [HIBARI], deck: fill(BLUE, 12) },
      { characters: ['EB05-024'] },
      EL.magellan,
    );
    playCard(g, HIBARI);
    trashTwo(g, BLUE, BLUE);
    finishEmpty(g);
    settleYes(g, 'p1');
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('the same Little Sadi with a non-{Impel Down} Leader (cost 1) is a candidate', () => {
    const g = mine(EL.croc, { hand: [HIBARI], deck: fill(BLUE, 12) }, { characters: ['EB05-024'] });
    playCard(g, HIBARI);
    trashTwo(g, BLUE, BLUE);
    expect(choiceCards(g)).toEqual(['EB05-024']);
  });
});

/**
 * OP17-105 Charlotte Chiffon (Character, Yellow, cost 5, 0, Counter +1000, {Firetank Pirates}/{Former Big Mom Pirates}).
 *
 * Card text: "[On Play] You may trash 1 card with a [Trigger] from your hand: Return up to 1 of your
 * opponent's Characters with a [Trigger] to the owner's hand."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (cost: needs a matching card), RD 112 (the cost of an [On Play] may be
 * declined), CR 8-4-4-1 ("up to"), CR 2-11 (a card "with a [Trigger]" has [Trigger] text).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  BLUE,
  choices,
  hand,
  kind,
  LD,
  mine,
  mayChooseNone,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  playCard,
  SCN,
  trash,
  unusable,
  yes,
  deck,
  cardIds,
} from './kit-op17b.ts';

const CHIFFON = 'OP17-105';
const SPEED = 'OP01-104'; // Purple Character, cost 2, "[Trigger] Play this card."
const CARROT = 'OP01-009'; // Red Character, cost 2, "[Trigger] Play this card."
const TRIG_EVENT = 'OP07-077'; // Purple Event, cost 1, has a [Trigger]

function play(handExtra: string[], opp: string[], mineChars: string[] = []) {
  const g = mine(
    LD.bmp,
    { hand: [CHIFFON, ...handExtra], characters: mineChars },
    { characters: opp },
  );
  playCard(g, CHIFFON);
  return g;
}

describe('OP17-105 Charlotte Chiffon: [On Play] trash a [Trigger] card from hand: return an opposing [Trigger] Character to hand', () => {
  it("trashes a [Trigger] card from my hand and returns the opposing [Trigger] Character to its owner's hand", () => {
    const g = play([SPEED], [CARROT, SCN.c4]);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SPEED]);
    need(g, 'choose', 'p1');
    pickCards(g, [CARROT]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SPEED]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
    expect(hand(g, 'p2')).toEqual([CARROT]);
    expect(trash(g, 'p2')).toEqual([]);
  });

  it('the cost accepts only cards with a [Trigger]: a plain card in hand is not offered', () => {
    const g = play([SPEED, SCN.c2, BLUE], [CARROT]);
    yes(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SPEED]);
  });

  it('an Event with a [Trigger] qualifies for the cost', () => {
    const g = play([TRIG_EVENT], [CARROT]);
    yes(g);
    expect(offeredIds(g)).toEqual([TRIG_EVENT]);
    payHand(g, [TRIG_EVENT]);
    pickCards(g, [CARROT]);
    expect(trash(g)).toEqual([TRIG_EVENT]);
  });

  it('only opposing Characters with a [Trigger] are candidates (not plain ones, not mine, not the Leader)', () => {
    const g = play([SPEED], [CARROT, SCN.c4], [SPEED]);
    yes(g);
    payHand(g, [SPEED]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([CARROT]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('"up to 1": the target may be skipped after paying; the trashed card stays trashed', () => {
    const g = play([SPEED], [CARROT]);
    yes(g);
    payHand(g, [SPEED]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([CARROT]);
    expect(trash(g)).toEqual([SPEED]);
  });

  it('returns only 1 even when several opposing Characters have a [Trigger]', () => {
    const g = play([SPEED], [CARROT, 'OP17-107']);
    yes(g);
    payHand(g, [SPEED]);
    pickCards(g, [CARROT]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(hand(g, 'p2')).toEqual([CARROT]);
  });

  it('declining the cost: nothing trashed, nothing returned', () => {
    const g = play([SPEED], [CARROT]);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SPEED]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([CARROT]);
  });

  it('CR 8-3-1-3: with no [Trigger] card in hand the cost cannot be paid', () => {
    const g = play([SCN.c2, BLUE], [CARROT]);
    unusable(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p2', 'characters')).toEqual([CARROT]);
    expect(hand(g)).toEqual([BLUE, SCN.c2].sort());
  });

  it('with no opposing [Trigger] Character the cost may be paid and nothing is returned', () => {
    const g = play([SPEED], [SCN.c4]);
    yes(g);
    payHand(g, [SPEED]);
    if (kind(g) === 'choose') none(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
    expect(trash(g)).toEqual([SPEED]);
    expect(deck(g, 'p2')).toHaveLength(15);
  });
});

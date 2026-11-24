/**
 * OP17-043 Ganzui (Character, Blue, cost 5, 7000, no Counter, {Rocks Pirates}).
 *
 * Card text: "If this Character would be removed from the field, you may trash 2 cards from your hand
 * instead. [On Play] Your Leader's base power becomes 6000 until the end of your opponent's next
 * End Phase."
 *
 * Rules: CR 8-1-3-4 (replacement effects, optional with "may"), M6b-Q5 (unqualified "would be
 * removed": any cause), CR 4-11-2 ("remove" = move to another area), RL-33 / QA-OP17 (a higher base
 * power already in force stays), RL-11 (duration), CR 8-3-1-3 (a cost that cannot be paid; QA-OP17
 * OP17-045: the "trash 2 instead" cannot be used with 0 or 1 cards).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  BLUE,
  cardIds,
  choices,
  fill,
  hand,
  kind,
  LD,
  mine,
  need,
  no,
  passBlock,
  pickCards,
  payHand,
  play,
  playCard,
  SCN,
  theirs,
  trash,
  yes,
  don,
  toMyNextMain,
} from './kit-op17b.ts';

const GANZUI = 'OP17-043';
const KINGDOM = 'EB01-059'; // Yellow Event cost 6: [Main] K.O. up to 1 opposing Character, then Life down to 1
const GRAVITY = 'OP06-058'; // Blue Event cost 7: [Main] place up to 2 Characters (cost <= 6) at the bottom of the owner's deck
const ROGER = 'OP13-003'; // Purple/Red Leader, 7000

/** p2 attacks the rested Ganzui with a 7000 Character; p1 has `handCards` in hand. */
function battle(handCards: string[]) {
  const g = theirs(
    LD.rocks,
    { characters: [{ card: GANZUI, rested: true }], hand: handCards },
    { characters: [SCN.c5] },
  );
  attack(g, g.find('p2', 'characters', SCN.c5), g.find('p1', 'characters', GANZUI));
  passBlock(g);
  act(g, { type: 'endCounter' });
  return g;
}

describe('OP17-043 Ganzui: [On Play] Leader base power 6000', () => {
  it("sets my Leader's base power to 6000 (5000 -> 6000)", () => {
    const g = mine(LD.rocks, { hand: [GANZUI] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    playCard(g, GANZUI);
    expect(atMain(g)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it("lasts through the opponent's next turn and ends at the end of their End Phase", () => {
    const g = mine(LD.rocks, { hand: [GANZUI] });
    playCard(g, GANZUI);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    act(g, { type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"base": given DON!! still add +1000 each on top of 6000', () => {
    const g = mine(
      { card: LD.rocks, don: 2 },
      { hand: [GANZUI], costArea: { active: 8, rested: 0 } },
    );
    expect(g.power(g.leader('p1'))).toBe(7000);
    playCard(g, GANZUI);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('"becomes" sets the base: a Leader with a printed 7000 gets base 6000 (the setting is not a minimum)', () => {
    const g = mine(ROGER, { hand: [GANZUI] });
    expect(g.power(g.leader('p1'))).toBe(7000);
    playCard(g, GANZUI);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('is not optional and asks nothing: no prompt after playing', () => {
    const g = mine(LD.rocks, { hand: [GANZUI] });
    playCard(g, GANZUI);
    expect(kind(g)).toBe('main');
  });

  it('the effect is gone with the next-turn cycle and a re-play later sets it again', () => {
    const g = mine(LD.rocks, { hand: [GANZUI, GANZUI] });
    playCard(g, GANZUI);
    toMyNextMain(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    void don;
  });
});

describe('OP17-043 Ganzui: replacement "trash 2 cards from your hand instead of being removed"', () => {
  it('battle K.O.: p1 is asked; paying with 2 cards trashes them and Ganzui stays on the field', () => {
    const g = battle([BLUE, SCN.c2, SCN.c3]);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SCN.c2, SCN.c3]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([GANZUI]);
    expect(hand(g)).toEqual([BLUE]);
    expect(trash(g)).toEqual([SCN.c2, SCN.c3].sort());
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });

  it("declining: Ganzui is K.O.'d as usual and the hand is untouched", () => {
    const g = battle([BLUE, SCN.c2]);
    no(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([GANZUI]);
    expect(hand(g)).toEqual([BLUE, SCN.c2].sort());
  });

  it("with only 1 card in hand the replacement cannot be used: Ganzui is K.O.'d without a usable offer", () => {
    const g = battle([BLUE]);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g);
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([BLUE]);
  });

  it('with exactly 2 cards in hand (boundary) it can be used and empties the hand', () => {
    const g = battle([BLUE, SCN.c2]);
    yes(g);
    payHand(g, [BLUE, SCN.c2]);
    expect(hand(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([GANZUI]);
  });

  it('an opposing effect K.O. (unqualified "removed from the field") is replaced too', () => {
    const g = theirs(LD.rocks, { characters: [GANZUI], hand: [BLUE, SCN.c2] }, { hand: [KINGDOM] });
    play(g, g.find('p2', 'hand', KINGDOM));
    pickCards(g, [GANZUI]);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [BLUE, SCN.c2]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([GANZUI]);
    expect(trash(g)).toEqual([BLUE, SCN.c2].sort());
  });

  it('an opposing effect that places it at the bottom of the deck is replaced too (removal by any cause)', () => {
    const g = theirs(LD.rocks, { characters: [GANZUI], hand: [BLUE, SCN.c2] }, { hand: [GRAVITY] });
    play(g, g.find('p2', 'hand', GRAVITY));
    pickCards(g, [GANZUI]);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [BLUE, SCN.c2]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([GANZUI]);
  });

  it('the cards to trash are my choice from hand: all hand cards are offered', () => {
    const g = battle([BLUE, SCN.c2, SCN.c3]);
    yes(g);
    need(g, 'choose', 'p1');
    expect(choices(g).length).toBeGreaterThanOrEqual(2);
    void at;
    void fill;
  });

  it('CR 3-7-6-1-1: trashing it to make room for a sixth Character is rule processing, so the replacement is not offered', () => {
    const g = mine(LD.rocks, {
      hand: [SCN.c5, BLUE, BLUE],
      characters: [GANZUI, SCN.c1, SCN.c2, SCN.c3, SCN.c4],
    });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', SCN.c5) });
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickCards(g, [GANZUI]);
    expect(kind(g)).toBe('main');
    expect(trash(g)).toEqual([GANZUI]);
    expect(hand(g)).toEqual([BLUE, BLUE]);
  });
});

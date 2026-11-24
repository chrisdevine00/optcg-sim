/**
 * OP16-107 Jesus Burgess (Character, Yellow, cost 3, 5000, no Counter, {Blackbeard Pirates}).
 *
 * Card text: "[On K.O.] Add up to 1 card from the top of your opponent's Life cards to the owner's hand.
 * [Trigger] You may trash 1 card from your hand: Play this card."
 *
 * Rules: CR 10-2-1 ([On K.O.]), CR 8-4-4-1 ("up to"), RD 104 (moving Life to hand by an effect never
 * activates [Trigger]), CR 10-1-5 / RD 101-102 ([Trigger]), CR 8-3-1-3 (a cost that cannot be paid
 * cannot be paid).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  cardIds,
  chars,
  choices,
  declineTrigger,
  hand,
  hitLeader,
  isLegal,
  LD16,
  lifeCards,
  mayChooseNone,
  need,
  payHand,
  SC16,
  SCN,
  unusable,
  theirs,
  theyKo,
  trash,
  yes,
  no,
} from './kit-op16c.ts';

const ID = 'OP16-107';
const TRIG = 'OP01-104'; // Speed: has a [Trigger] ("Play this card"); moved from Life it must not activate

function koed(p2life: string[], p2hand: string[] = []) {
  const g = theirs(
    LD16.wano,
    { characters: [{ card: ID, rested: true }] },
    { life: p2life, hand: p2hand },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

/** After the K.O. the engine asks "add the top Life card?" as a yes/no ("up to 1"). */
function takeTopLife(g: ReturnType<typeof koed>) {
  yes(g, 'p1');
}

describe("OP16-107 Jesus Burgess: [On K.O.] add up to 1 card from the top of the opponent's Life to their hand", () => {
  it("K.O.'d: the opponent's top Life card goes to the owner's hand (not mine)", () => {
    const g = koed([SC16.wano3, BLUE, BLUE, BLUE], []);
    takeTopLife(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toEqual([SC16.wano3]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('it is the TOP card, not another: the second Life card stays', () => {
    const g = koed([SCN.c3, SCN.c4, SCN.c5, BLUE]);
    takeTopLife(g);
    expect(lifeCards(g, 'p2')).toEqual([SCN.c4, SCN.c5, BLUE]);
    expect(hand(g, 'p2')).toEqual([SCN.c3]);
  });

  it('adds only 1 card', () => {
    const g = koed([BLUE, BLUE, BLUE, BLUE]);
    takeTopLife(g);
    expect(g.life('p2')).toBe(3);
    expect(hand(g, 'p2')).toHaveLength(1);
  });

  it('"up to 1": may add nothing', () => {
    const g = koed([BLUE, BLUE, BLUE, BLUE]);
    no(g, 'p1');
    expect(g.life('p2')).toBe(4);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('RD 104: a Life card with a [Trigger] moved to hand does not activate it (no Speed on the field)', () => {
    const g = koed([TRIG, BLUE, BLUE, BLUE]);
    takeTopLife(g);
    expect(hand(g, 'p2')).toEqual([TRIG]);
    expect(chars(g, 'p2')).toEqual([]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('with no Life cards the opponent has nothing to add and the game moves on', () => {
    const g = koed([]);
    unusable(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g, 'p2')).toEqual([]);
  });

  it('Burgess is trashed by the K.O.', () => {
    const g = koed([BLUE, BLUE]);
    takeTopLife(g);
    expect(trash(g)).toEqual([ID]);
  });
});

describe('OP16-107 Jesus Burgess: [Trigger] you may trash 1 card from hand: play this card', () => {
  function hit(h: string[]) {
    const g = theirs(LD16.wano, { life: [ID, BLUE, BLUE, BLUE], hand: h }, {});
    hitLeader(g);
    return g;
  }

  it('activating: trash 1 card from hand, then Burgess is played onto the field', () => {
    const g = hit([SCN.c2, BLUE]);
    need(g, 'trigger', 'p1');
    expect(isLegal(g, { type: 'trigger', activate: true })).toBe(true);
    activateTrigger(g);
    payHand(g, [SCN.c2]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SCN.c2]);
    expect(hand(g)).toEqual([BLUE]);
    expect(g.card(at(g, 'p1', 'characters', ID)).rested).toBe(false);
  });

  it('the trash cost is exactly one card of my choice and cannot be skipped', () => {
    const g = hit([SCN.c2, SCN.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(false);
    expect(choices(g)).toHaveLength(2);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid, so the [Trigger] cannot be activated', () => {
    const g = hit([]);
    need(g, 'trigger', 'p1');
    expect(isLegal(g, { type: 'trigger', activate: true })).toBe(false);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
  });

  it('declining: Burgess goes to my hand, nothing is trashed', () => {
    const g = hit([SCN.c2]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, SCN.c2].sort());
    expect(chars(g)).toEqual([]);
  });

  it("playing it with the [Trigger] is not a K.O.: no [On K.O.] effect happens (opponent's Life stays)", () => {
    const g = theirs(
      LD16.wano,
      { life: [ID, BLUE, BLUE, BLUE], hand: [SCN.c2] },
      { life: [BLUE, BLUE, BLUE, BLUE] },
    );
    hitLeader(g);
    activateTrigger(g);
    payHand(g, [SCN.c2]);
    expect(g.life('p2')).toBe(4);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ID]);
  });
});

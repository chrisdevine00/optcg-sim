/**
 * EB05-053 Charlotte Praline (Character, Yellow, cost 4, 5000, Counter +1000, {The Sun Pirates}/
 * {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "[When Attacking] [Once Per Turn] If your opponent has 9 or more cards in their hand, add
 * up to 1 card from your hand to the top of your Life cards.
 * [Trigger] You may trash 1 card from your hand: If you have 2 or less Life cards, play this card."
 *
 * Rules: CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"), CR 8-3-1-3/-4 (the optional trash cost; with
 * an empty hand it cannot be paid), RL-25 (the [Trigger] card is in no area while it resolves, and
 * the damage has already removed a Life card when the condition is read), CR 3-7-4 (a Character
 * played earlier may attack).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  CH,
  chars,
  choose,
  chooseNone,
  declineTrigger,
  decision,
  drive,
  fill,
  hand,
  hitLeader,
  kind,
  LD,
  mine,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-053';

function attackWith(oppHand: number, own: string[] = [CH.mohji, CH.sai]) {
  const g = mine(LD.shc, { characters: [ID], hand: own }, { hand: fill(RED, oppHand) });
  attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
  return g;
}

describe('EB05-053 Praline [When Attacking] [Once Per Turn]: opponent has 9+ cards in hand: add up to 1 hand card to the top of my Life', () => {
  it('9 cards: a hand card goes to the top of my Life face-down', () => {
    const g = attackWith(9);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', CH.mohji)]);
    expect(g.life('p1')).toBe(5);
    expect(g.zone('p1', 'life')[0]!.card).toBe(CH.mohji);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(hand(g)).toEqual([CH.sai]);
  });

  it('boundary: 8 cards is not enough (no question, Life unchanged)', () => {
    const g = attackWith(8);
    expect(decision(g)?.player).not.toBe('p1');
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toHaveLength(2);
  });

  it('10 cards also works (9 or more)', () => {
    const g = attackWith(10);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', CH.sai)]);
    expect(g.life('p1')).toBe(5);
  });

  it('"up to 1": adding nothing leaves Life and hand as they are', () => {
    const g = attackWith(9);
    chooseNone(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toHaveLength(2);
  });

  it('never more than 1 card, even with several in hand', () => {
    const g = attackWith(9, [CH.mohji, CH.sai, CH.marco]);
    choose(g, [g.find('p1', 'hand', CH.sai)]);
    expect(g.life('p1')).toBe(5);
    expect(hand(g)).toHaveLength(2);
  });

  it('with an empty hand nothing can be added', () => {
    const g = attackWith(9, []);
    drive(g, 'p1', {});
    expect(g.life('p1')).toBe(4);
  });

  it('the opponent’s hand size is read when the attack is declared: counting my own hand instead would not do (my 9 cards, their 0)', () => {
    const g = mine(LD.shc, { characters: [ID], hand: fill(BLUE, 9) }, { hand: [] });
    attack(g, g.find('p1', 'characters', ID), g.leader('p2'));
    expect(decision(g)?.player).not.toBe('p1');
    expect(g.life('p1')).toBe(4);
  });
});

describe('EB05-053 Praline [Trigger]: you may trash 1 from hand: if 2 or less Life cards, play this card', () => {
  function hit(lifeBefore: number, handCards: string[] = [CH.mohji]) {
    const g = theirTurn(
      side(LD.shc, BLUE, { life: [ID, ...fill(BLUE, lifeBefore - 1)], hand: handCards }),
      side(LD.shc, RED),
    );
    hitLeader(g, g.leader('p2'));
    return g;
  }

  it('3 Life before the hit, 2 after: Praline is played (the trashed card is the cost)', () => {
    const g = hit(3);
    activateTrigger(g);
    drive(g, 'p1', {});
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([CH.mohji]);
    expect(g.life('p1')).toBe(2);
  });

  it('boundary: 4 Life before the hit, 3 after: not played (the trash cost may have been paid)', () => {
    const g = hit(4);
    activateTrigger(g);
    drive(g, 'p1', {});
    expect(chars(g)).toEqual([]);
  });

  it('the card to trash is my choice from the hand; the others stay', () => {
    const g = hit(3, [CH.mohji, CH.sai]);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', CH.sai)]);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([CH.sai]);
    expect(hand(g)).toEqual([CH.mohji]);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid, so the Trigger cannot be activated', () => {
    const g = hit(3, []);
    expect(kind(g)).toBe('trigger');
    expect(g.legal().some((a) => a.type === 'trigger' && a.activate)).toBe(false);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('declining the Trigger altogether puts Praline in hand', () => {
    const g = hit(3);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID, CH.mohji].sort());
  });
});

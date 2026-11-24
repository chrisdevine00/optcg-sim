/**
 * EB03-058 Lilith (Character, Yellow, cost 5, 6000, Counter +1000, {Scientist}/{Egghead}).
 *
 * Card text: "[Your Turn] [On Play] If you have 2 or less Life cards, draw 1 card.
 * [Trigger] If your Leader is [Vegapunk], play this card."
 *
 * Rules: CR 8-1-3 ([Your Turn] limits the trigger to my own turn), CR 10-1-5 ([Trigger]: the
 * card is in no area during activation; a failed condition makes it unusable), CR 2-4-2 (the Leader
 * must be named Vegapunk, an {Egghead} type is not enough).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  chars,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  kind,
  LB,
  mine,
  put,
  theirs,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-058';

function play(life: number) {
  return mine(LB.vegapunk, {
    hand: [ID],
    life: Array.from({ length: life }, () => BLUE),
    costArea: { active: 10, rested: 0 },
  });
}

/** p2 attacks my Leader; the top Life card is Lilith. Stops at the [Trigger] decision. */
function hitWithLilith(leader: string, lifeBelow = 2) {
  const g = theirs(leader, { life: [ID, ...Array.from({ length: lifeBelow }, () => BLUE)] });
  hitLeader(g);
  return g;
}

const canActivate = (g: ReturnType<typeof play>) =>
  g.legal().some((a) => a.type === 'trigger' && a.activate);

describe('EB03-058 Lilith: [Your Turn] [On Play] with 2 or less Life, draw 1; [Trigger] with a [Vegapunk] Leader, play this card', () => {
  it('played from hand with exactly 2 Life cards: draws 1 card', () => {
    const g = play(2);
    const top = deck(g)[0];
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([top]);
  });

  it('with 3 Life cards (one above the limit): nothing is drawn', () => {
    const g = play(3);
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('with 1 Life card: draws 1', () => {
    const g = play(1);
    put(g, ID);
    expect(hand(g)).toHaveLength(1);
  });

  it('with 0 Life cards: draws 1', () => {
    const g = play(0);
    put(g, ID);
    expect(hand(g)).toHaveLength(1);
  });

  it('draws exactly one card and asks nothing', () => {
    const g = play(2);
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(14);
  });

  it("[Trigger] with a [Vegapunk] Leader: the card is played from the Life, and it does not draw on the opponent's turn ([Your Turn])", () => {
    const g = hitWithLilith(LB.vegapunk);
    expect(kind(g)).toBe('trigger');
    expect(canActivate(g)).toBe(true);
    const deckBefore = deck(g).length;
    activateTrigger(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(deckBefore);
    expect(trash(g)).toEqual([]);
  });

  it('[Trigger] declined: Lilith goes to my hand and is not played', () => {
    const g = hitWithLilith(LB.vegapunk);
    declineTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([ID]);
  });

  it('[Trigger] with another Leader (even an {Egghead} one): the card is not played, whether the engine lets it be activated or not', () => {
    const g = hitWithLilith(LB.eggheadLuffy);
    expect(kind(g)).toBe('trigger');
    // Every reading shares: the unmet "If" plays nothing. (Whether activating is legal with an unmet
    // "If" is not asserted: see API-GAPS-b.md.)
    act(g, { type: 'trigger', activate: canActivate(g) });
    expect(chars(g)).toEqual([]);
    expect(hand(g).length + trash(g).length).toBe(1);
  });

  it('[Trigger] play comes in active and is a normal Character afterwards (a fresh Lilith, not removed from the game)', () => {
    const g = hitWithLilith(LB.vegapunk);
    activateTrigger(g);
    const lilith = g.find('p1', 'characters', ID);
    expect(g.card(lilith).rested).toBe(false);
    expect(g.power(lilith)).toBe(6000);
  });
});

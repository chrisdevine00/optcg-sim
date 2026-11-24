/**
 * EB03-062 Trafalgar Law (Character, Yellow, cost 8, 6000, Counter +1000, {Heart Pirates}).
 *
 * Card text: "[Rush] [Activate: Main] You may trash 1 card from your hand and trash this
 * Character: Add up to 1 card from the top of your deck to the top of your Life cards. Then, play
 * up to 1 [Trafalgar Law] with a cost of 7 or less from your hand."
 *
 * Rules: CR 8-3-1 (the cost is all or nothing: the hand card and this Character), CR 4-8-1 ("up
 * to"), CR 2-4-2 (card name: only cards named Trafalgar Law), CR 3-10 (Life added face-down),
 * [Rush] (CR 10-1-1: may attack the turn it is played), CR 4-10-2 (a "Then" runs even if the
 * add was declined).
 * Scenery: OP04-087 Trafalgar Law (Black, cost 5, 7000, vanilla), OP10-119 Trafalgar Law (cost 7),
 * OP16-030 Trafalgar Law (cost 8), OP14-009 Trafalgar Law (cost 9).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  abilities,
  atMain,
  BLUE,
  C14,
  canActivate,
  canAttackAny,
  canFinish,
  chars,
  deck,
  hand,
  kind,
  LB,
  mine,
  need,
  none,
  offeredIds,
  payHand,
  pickCards,
  put,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-062';
const LAW5 = 'OP04-087'; // [Trafalgar Law], cost 5, 7000, vanilla
const LAW7 = 'OP10-119'; // [Trafalgar Law], cost 7
const LAW8 = 'OP16-030'; // [Trafalgar Law], cost 8
const LAW9 = 'OP14-009'; // [Trafalgar Law], cost 9
const MARCO = C14.marco; // another name
const TOP = 'OP01-018'; // distinctive deck-top card

function start(o: { hand?: string[]; life?: number }) {
  return mine(LB.luffy, {
    characters: [ID],
    hand: o.hand ?? [MARCO, LAW5],
    life: Array.from({ length: o.life ?? 2 }, () => BLUE),
    deck: [TOP, BLUE, BLUE, BLUE],
  });
}

/** Activate the ability and pay the hand card; the add-to-Life question is pending. */
function activateAndPay(g: ReturnType<typeof start>, trashCard: string) {
  const law = g.find('p1', 'characters', ID);
  const [ability] = abilities(g, law);
  act(g, { type: 'activate', card: law, ability: ability! });
  payHand(g, [trashCard]);
}

describe('EB03-062 Trafalgar Law: [Rush]; [Activate: Main] trash a hand card and this Character: add the top deck card to Life, then play a [Trafalgar Law] of cost 7 or less from hand', () => {
  it('trashes the hand card and itself, adds the top card of the deck to the top of my Life, and plays a [Trafalgar Law] from hand', () => {
    const g = start({});
    activateAndPay(g, MARCO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW5]);
    pickCards(g, [LAW5]);
    expect(atMain(g)).toBe(true);
    expect(trash(g).sort()).toEqual([ID, MARCO].sort());
    expect(chars(g)).toEqual([LAW5]);
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(TOP);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(3);
    expect(hand(g)).toEqual([]);
  });

  it('the play offers only cards named Trafalgar Law with cost 7 or less: cost 7 yes, cost 8 and 9 no, other names no', () => {
    const g = start({ hand: [MARCO, LAW5, LAW7, LAW8, LAW9] });
    activateAndPay(g, MARCO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([LAW5, LAW7].sort());
  });

  it('a second copy of this Law (cost 8) is not playable by it', () => {
    const g = start({ hand: [MARCO, ID] });
    activateAndPay(g, MARCO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
  });

  it('"up to 1": the card from the deck may be left out of the Life, and the Law is still played ("Then")', () => {
    const g = start({});
    activateAndPay(g, MARCO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: false });
    need(g, 'choose', 'p1');
    pickCards(g, [LAW5]);
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(4);
    expect(chars(g)).toEqual([LAW5]);
  });

  it('"up to 1": the play may be skipped, and the Life card stays added', () => {
    const g = start({});
    activateAndPay(g, MARCO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    none(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([]);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([LAW5]);
  });

  it('the play pick is asked even when the hand holds no [Trafalgar Law] (the prompt must not reveal the hidden hand)', () => {
    const g = start({ hand: [MARCO, BLUE] });
    activateAndPay(g, MARCO);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
  });

  it('the hand card for the cost may itself be a [Trafalgar Law]; it is then no longer there to be played', () => {
    const g = start({ hand: [LAW5] });
    activateAndPay(g, LAW5);
    need(g, 'optional', 'p1');
    act(g, { type: 'optional', accept: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    act(g, { type: 'done' });
    expect(trash(g).sort()).toEqual([ID, LAW5].sort());
  });

  it('with an empty hand the cost cannot be paid: the ability is not offered', () => {
    const g = start({ hand: [] });
    expect(canActivate(g, g.find('p1', 'characters', ID))).toBe(false);
  });

  it('[Rush]: played from hand it can attack the turn it comes in', () => {
    const g = mine(LB.luffy, { hand: [ID], costArea: { active: 10, rested: 0 } });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(canAttackAny(g, g.find('p1', 'characters', ID))).toBe(true);
    void kind;
  });
});

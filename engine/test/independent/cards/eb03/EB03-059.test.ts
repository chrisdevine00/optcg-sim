/**
 * EB03-059 S-Snake (Character, Yellow, cost 6, 7000, Counter +1000, {Egghead}/{Seraphim}).
 *
 * Card text: "[On Play] If your Leader has the {Egghead} type and you have 2 or more Life cards, add
 * up to 1 Character card with a [Trigger] from your hand to the top of your Life cards face-up.
 * [Trigger] Up to 1 of your opponent's Characters with a cost of 6 or less other than
 * [Monkey.D.Luffy] cannot attack during this turn."
 *
 * Rules: CR 4-8-1 ("up to"), CR 3-10-2 (face-up Life), CR 10-1-5 ([Trigger]), "cannot attack
 * during this turn" ends with the turn; exclusion by name ("other than [Monkey.D.Luffy]").
 * Scenery: OP01-104 Speed (Purple Character, cost 2, has a [Trigger]), OP01-009 Carrot (Red
 * Character, cost 2, has a [Trigger]), OP15-115 Impact Dial (Event with a [Trigger]: not a
 * Character), ST09-011 Monkey.D.Luffy (cost 3, vanilla).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, canAttack, noDefence } from '../../helpers.ts';
import {
  activateTrigger,
  atMain,
  BLUE,
  C14,
  canFinish,
  hand,
  hitLeader,
  kind,
  LB,
  mine,
  need,
  offeredIds,
  pickCards,
  put,
  theirs,
} from './kit-eb03b.ts';

const ID = 'EB03-059';
const SPEED = 'OP01-104';
const CARROT = 'OP01-009';
const IMPACT = 'OP15-115'; // Event with a [Trigger]
const MARCO = C14.marco; // Character without a [Trigger]
const LUFFY = 'ST09-011'; // [Monkey.D.Luffy], cost 3, vanilla
const HAJRUDIN = C14.hajrudin; // cost 4
const KINGDEW = C14.kingdew; // cost 5
const THATCH = C14.thatch; // cost 6
const OARS = C14.littleOars; // cost 7

function play(o: { leader?: string; life?: number; hand?: string[] }) {
  return mine(o.leader ?? LB.vegapunk, {
    hand: [ID, ...(o.hand ?? [])],
    life: Array.from({ length: o.life ?? 3 }, () => BLUE),
    costArea: { active: 10, rested: 0 },
  });
}

const lifeCards = (g: ReturnType<typeof play>) => g.zone('p1', 'life');

describe('EB03-059 S-Snake: [On Play] with an {Egghead} Leader and 2+ Life, add a [Trigger] Character from hand to the top of Life face-up; [Trigger] an opposing Character cannot attack', () => {
  it('adds a Character with a [Trigger] from hand to the top of my Life, face-up', () => {
    const g = play({ hand: [SPEED, MARCO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SPEED]);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toHaveLength(4);
    expect(lifeCards(g)[0]!.card).toBe(SPEED);
    expect(lifeCards(g)[0]!.faceUp).toBe(true);
    expect(hand(g)).toEqual([MARCO]);
  });

  it('offers only Characters with a [Trigger]: not a Character without one, not an Event with one', () => {
    const g = play({ hand: [SPEED, CARROT, MARCO, IMPACT] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([CARROT, SPEED].sort());
  });

  it('exactly 2 Life cards is enough (boundary)', () => {
    const g = play({ life: 2, hand: [SPEED] });
    put(g, ID);
    need(g, 'choose', 'p1');
    pickCards(g, [SPEED]);
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('with 1 Life card nothing is added and nothing is asked', () => {
    const g = play({ life: 1, hand: [SPEED] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toHaveLength(1);
    expect(hand(g)).toEqual([SPEED]);
  });

  it('with a Leader that is not {Egghead} nothing is added and nothing is asked', () => {
    const g = play({ leader: LB.luffy, hand: [SPEED] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toHaveLength(3);
    expect(hand(g)).toEqual([SPEED]);
  });

  it('"up to 1": may add nothing', () => {
    const g = play({ hand: [SPEED, CARROT] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(lifeCards(g)).toHaveLength(3);
    expect(hand(g).sort()).toEqual([CARROT, SPEED].sort());
  });

  it('adds at most one card', () => {
    const g = play({ hand: [SPEED, CARROT] });
    put(g, ID);
    pickCards(g, [SPEED]);
    expect(lifeCards(g)).toHaveLength(4);
    expect(hand(g)).toEqual([CARROT]);
  });

  it('the pick is asked even when the hand holds no candidate (the prompt must not reveal the hidden hand)', () => {
    const g = play({ hand: [MARCO] });
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(lifeCards(g)).toHaveLength(3);
  });

  it('[Trigger]: an opposing Character with cost 6 or less (not [Monkey.D.Luffy]) cannot attack this turn; cost 7 and [Monkey.D.Luffy] are not offered', () => {
    const g = theirs(
      LB.vegapunk,
      { life: [ID, BLUE, BLUE] },
      { characters: [HAJRUDIN, LUFFY, OARS, KINGDEW, THATCH] },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJRUDIN, KINGDEW, THATCH].sort());
    pickCards(g, [HAJRUDIN]);
    expect(kind(g)).toBe('main');
    expect(canAttack(g, g.find('p2', 'characters', HAJRUDIN), g.leader('p1'))).toBe(false);
    expect(canAttack(g, g.find('p2', 'characters', LUFFY), g.leader('p1'))).toBe(true);
    expect(canAttack(g, g.find('p2', 'characters', OARS), g.leader('p1'))).toBe(true);
    expect(canAttack(g, g.find('p2', 'characters', KINGDEW), g.leader('p1'))).toBe(true);
  });

  it('[Trigger] "up to 1": the opposing Character may be left alone', () => {
    const g = theirs(LB.vegapunk, { life: [ID, BLUE, BLUE] }, { characters: [HAJRUDIN, KINGDEW] });
    hitLeader(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(canAttack(g, g.find('p2', 'characters', HAJRUDIN), g.leader('p1'))).toBe(true);
    void attack;
    void noDefence;
  });
});

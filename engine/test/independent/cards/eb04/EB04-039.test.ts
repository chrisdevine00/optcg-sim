/**
 * EB04-039 Eustass"Captain"Kid (Character, Purple, cost 7, 8000, no Counter, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[On Play] Add up to 1 DON!! card from your DON!! deck and set it as active.
 * [Activate: Main] You may trash this Character: Play up to 1 {Kid Pirates} type Character card with
 * a cost of 5 or less from your hand."
 *
 * Rules: "Add up to 1 DON!!" asks a count (most first). The Activate cost is trashing this
 * Character; the played card comes from the hand only and enters active. An "up to" pick over the
 * hand with a filter is asked even when nothing matches, so the prompt does not reveal the hand.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  BLUE,
  chars,
  decision,
  donCost,
  donDeckN,
  donTotal,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredAbilities,
  offeredIds,
  pickRaw,
  playRaw,
  trash,
  useAbility,
  yes,
  atMain,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-039';
/** OP01-053 Wire: Green, cost 2, 4000, {Kid Pirates}. Vanilla. */
const WIRE = 'OP01-053';
/** OP05-074 Eustass"Captain"Kid: Purple, cost 5, 6000, {Kid Pirates}. */
const KID5 = 'OP05-074';
/** ST02-013 Eustass"Captain"Kid: Green, cost 7, 7000, {Kid Pirates}/{Supernovas}. */
const KID7 = 'ST02-013';
const SAI = 'OP01-012'; // Red, cost 2, no Kid Pirates type

describe('EB04-039 Eustass"Captain"Kid: [On Play] add up to 1 DON!! and set it as active', () => {
  function played(donDeck?: number): TestGame {
    const g = mine(LB.kid, {
      hand: [ID],
      deck: fill(BLUE, 10),
      costArea: { active: donDeck === 0 ? 10 : 8, rested: 0 },
      donDeck,
    });
    playRaw(g, ID);
    return g;
  }

  it('asks a count and adds the DON!! active', () => {
    const g = played();
    const total = donTotal(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: '1' } });
    expect(atMain(g)).toBe(true);
    expect(donTotal(g)).toBe(total + 1);
    // 8 active, 7 rested for the cost leaves 1 active; the added DON!! is active: 2 active
    expect(donCost(g)).toEqual([2, 7]);
    expect(donDeckN(g)).toBe(1);
  });

  it('"up to 1": may add none', () => {
    const g = played();
    const total = donTotal(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: { option: '0' } });
    expect(donTotal(g)).toBe(total);
    expect(donDeckN(g)).toBe(2);
  });

  it('with an empty DON!! deck nothing is added', () => {
    const g = played(0);
    expect(kind(g)).not.toBe('optional');
    if (decision(g)?.kind === 'choose') act(g, { type: 'pick', choice: { option: '0' } });
    expect(donTotal(g)).toBe(10);
  });
});

describe('EB04-039 Eustass"Captain"Kid: [Activate: Main] trash this Character: play a {Kid Pirates} Character (cost 5 or less) from hand', () => {
  function board(hnd: string[]): TestGame {
    return mine(LB.kid, {
      characters: [ID],
      hand: hnd,
      deck: fill(BLUE, 10),
      trash: [KID5],
    });
  }

  function start(g: TestGame): void {
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') yes(g);
  }

  it('offers only {Kid Pirates} Characters of cost 5 or less from the hand', () => {
    const g = board([WIRE, KID5, KID7, SAI]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KID5, WIRE].sort());
  });

  it('trashes this Character and plays the chosen card, active', () => {
    const g = board([WIRE, SAI]);
    start(g);
    pickRaw(g, g.find('p1', 'hand', WIRE));
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([WIRE]);
    expect(trash(g)).toEqual([ID, KID5].sort());
    expect(isRestedInst(g, at(g, 'p1', 'characters', WIRE))).toBe(false);
    expect(hand(g)).toEqual([SAI]);
  });

  it('boundary: a cost-5 Kid Pirates is playable, a cost-7 one is not', () => {
    const g = board([KID5, KID7]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KID5]);
    pickRaw(g, g.find('p1', 'hand', KID5));
    expect(chars(g)).toEqual([KID5]);
  });

  it('the card is played for free (no DON!! is rested)', () => {
    const g = board([KID5]);
    const before = donCost(g);
    start(g);
    pickRaw(g, g.find('p1', 'hand', KID5));
    expect(donCost(g)).toEqual(before);
  });

  it('"up to 1": may play nothing; this Character is still trashed', () => {
    const g = board([WIRE]);
    start(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, KID5].sort());
    expect(hand(g)).toEqual([WIRE]);
  });

  it('with no qualifying card in hand the prompt is still asked (it must not reveal the hand), with nothing to pick', () => {
    const g = board([SAI, KID7]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(chars(g)).toEqual([]);
  });

  it('a {Kid Pirates} card in the trash is not offered (hand only)', () => {
    const g = board([SAI]);
    start(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(KID5);
  });

  it('declining the "you may" cost keeps this Character on the field', () => {
    const g = board([WIRE]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'optional') {
      no(g);
      expect(chars(g)).toEqual([ID]);
      expect(hand(g)).toEqual([WIRE]);
    } else {
      // no separate question: the activation itself was the choice
      none(g);
    }
  });

  it('can be used again with another copy; and is offered on a Character that was played this turn', () => {
    const g = board([]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
  });
});

/**
 * OP13-117 Gum-Gum Dawn Stamp (Event, Yellow, cost 5, {Straw Hat Crew}/{The Four Emperors}/{Egghead}).
 *
 * Card text: "[Main] You may turn 1 card from the top of your Life cards face-up: K.O. up to 1 of your
 * opponent's Characters with a base cost of 6 or less. [Trigger] Draw 1 card."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (cost), OPEN-QUESTIONS M4b-3 (closed: a top Life card that is already
 * face-up cannot be turned), CR 8-4-4-1 ("up to"), CR 10-2-1 (K.O.), RD 101 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  afterOpponentSabo,
  at,
  atMain,
  BLUE,
  chars,
  choices,
  declineTrigger,
  deck,
  don,
  doneRaw,
  hand,
  hitLeader,
  kind,
  LD13,
  lifeFaces,
  mine,
  need,
  no,
  offeredIds,
  pickRaw,
  playRaw,
  reachablePickSets,
  SC15,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-117';

function start(
  o: {
    life?: (string | { card: string; faceUp?: boolean })[];
    p2?: string[];
    own?: string[];
  } = {},
): TestGame {
  const g = mine(
    LD13.yellow,
    { hand: [ID], life: o.life ?? [BLUE, BLUE, BLUE, BLUE], characters: o.own ?? [] },
    { characters: o.p2 ?? [SC15.red6, SC15.red7] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-117 Gum-Gum Dawn Stamp: [Main] may turn the top Life card face-up: K.O. up to 1 Character with base cost 6 or less', () => {
  it('asks whether to pay; paying turns only the top Life card face-up, then K.O.’s the chosen Character', () => {
    const g = start();
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red6));
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SC15.red7]);
    expect(trash(g, 'p2')).toEqual([SC15.red6]);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('boundary: base cost 6 is offered, base cost 7 is not', () => {
    const g = start();
    yes(g);
    expect(offeredIds(g)).toEqual([SC15.red6]);
  });

  it('declining: nothing is turned, nobody is K.O.’d (the Event still costs its 5 DON!!)', () => {
    const g = start();
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g)).toBe(true);
    expect(lifeFaces(g)).toEqual([false, false, false, false]);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('M4b-3: with the top Life card already face-up the cost cannot be paid', () => {
    const g = start({ life: [{ card: BLUE, faceUp: true }, BLUE, BLUE, BLUE] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = start({ life: [] });
    unusable(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('"up to 1": after paying, choosing nobody is legal; the Life card stays face-up; never two K.O.’d', () => {
    const g = start({ p2: [SC15.red6, SC15.red5] });
    yes(g);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    doneRaw(g);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(lifeFaces(g)).toEqual([true, false, false, false]);
  });

  it('only the opponent’s Characters are candidates', () => {
    const g = start({ own: [SC15.red3] });
    yes(g);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', SC15.red3));
    expect(offeredIds(g)).toEqual([SC15.red6]);
  });

  it('"base cost": a cost 5 Character whose current cost is 7 (+2 from the opponent’s Sabo) is still a legal target', () => {
    const g = afterOpponentSabo(
      LD13.yellow,
      { hand: [ID], life: [BLUE, BLUE, BLUE, BLUE] },
      SC15.red5,
    );
    expect(g.card(at(g, 'p2', 'characters', SC15.red5)).cost).toBe(7);
    playRaw(g, g.find('p1', 'hand', ID));
    yes(g);
    expect(offeredIds(g)).toEqual([SC15.red5, 'OP13-120'].sort());
    pickRaw(g, at(g, 'p2', 'characters', SC15.red5));
    expect(trash(g, 'p2')).toEqual([SC15.red5]);
  });

  it('a second use needs a different top card: the face-up one cannot be turned again by a second copy', () => {
    const g = mine(
      LD13.yellow,
      { hand: [ID, ID], life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [SC15.red6, SC15.red5] },
    );
    playRaw(g, g.find('p1', 'hand', ID));
    yes(g);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red6));
    playRaw(g, g.find('p1', 'hand', ID));
    unusable(g, 'p1');
    expect(chars(g, 'p2')).toEqual([SC15.red5]);
  });

  it('[Trigger]: activated from the Life, it draws 1 card and K.O.’s nobody', () => {
    const g = theirs(
      LD13.yellow,
      { life: [ID, BLUE, BLUE, BLUE], hand: [SC15.red2] },
      { characters: [SC15.red3] },
    );
    const before = deck(g).length;
    hitLeader(g);
    activateTrigger(g);
    expect(hand(g)).toEqual([BLUE, SC15.red2].sort());
    expect(deck(g)).toHaveLength(before - 1);
    expect(chars(g, 'p2')).toEqual([SC15.red3]);
    expect(trash(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });

  it('[Trigger] declined: the Event goes to the hand, nothing is drawn', () => {
    const g = theirs(LD13.yellow, { life: [ID, BLUE, BLUE, BLUE], hand: [] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
  });
});

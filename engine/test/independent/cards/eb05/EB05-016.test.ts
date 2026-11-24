/**
 * EB05-016 Nico Robin (Character, Green, cost 6, 6000, Counter +1000, {Straw Hat Crew}, Wisdom).
 *
 * Card text: "[Your Turn] [On Play] Play up to 1 Character card with a cost of 5 or less and the "Wisdom"
 * attribute from your hand.
 * [Trigger] Rest up to 1 of your opponent's Characters with a cost of 6 or less."
 *
 * Rules: CR 8-3-2-4 ([Your Turn]), CR 8-4-4-1 ("up to"), CR 10-1-5 ([Trigger]: only the trigger text
 * resolves and the card is trashed afterwards, RD 102), CR 2-5 (attributes).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  chars,
  choiceCards,
  choose,
  chooseNone,
  declineTrigger,
  EC,
  EL,
  hand,
  hitLeader,
  kind,
  mine,
  offeredInstance,
  playCard,
  reachablePickSets,
  RED,
  settleYes,
  theirs,
  trash,
  VAN,
} from './kit-eb05a.ts';

const ROBIN = 'EB05-016';

function played(inHand: string[]) {
  const g = mine(EL.croc, { hand: [ROBIN, ...inHand], deck: fill(BLUE, 10) });
  playCard(g, ROBIN);
  return g;
}

describe('EB05-016 Nico Robin: [Your Turn] [On Play] play up to 1 Wisdom Character with cost 5 or less from hand', () => {
  it('plays the chosen Character; cost 5 (boundary) and cost 4 are candidates, cost 6 is not', () => {
    const g = played([EC.mocha, EC.terry, EC.thatchWisdom]);
    expect(choiceCards(g)).toEqual([EC.mocha, EC.terry].sort());
    choose(g, [offeredInstance(g, EC.terry)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([ROBIN, EC.terry].sort());
    expect(hand(g)).toEqual([EC.mocha, EC.thatchWisdom].sort());
  });

  it('only cards with the Wisdom attribute: a cost-3 Character without it is not offered', () => {
    const g = played([VAN.marco, EC.mocha]);
    expect(choiceCards(g)).toEqual([EC.mocha]);
  });

  it('"up to 1": may play nothing', () => {
    const g = played([EC.mocha]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([ROBIN]);
    expect(hand(g)).toEqual([EC.mocha]);
  });

  it('plays only 1 even with two candidates', () => {
    const g = played([EC.mocha, EC.terry]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('the Character is played without paying its cost (no DON!! are rested)', () => {
    const g = played([EC.terry]);
    choose(g, [offeredInstance(g, EC.terry)]);
    settleYes(g, 'p1');
    expect(g.card(g.find('p1', 'characters', EC.terry)).rested).toBe(false);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('with no candidate in hand nothing happens', () => {
    const g = played([VAN.marco, EC.thatchWisdom]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ROBIN]);
  });
});

describe('EB05-016 Nico Robin: [Trigger] rest up to 1 opposing Character with cost 6 or less', () => {
  /** p2 hits p1's Leader; Robin is p1's top Life card. */
  function hit(opp: string[] = [VAN.thatch, VAN.littleOars]) {
    const g = theirs(
      EL.croc,
      { life: [ROBIN, RED, RED, RED], hand: [EC.mocha] },
      { characters: opp },
    );
    hitLeader(g);
    return g;
  }
  const isRested = (g: ReturnType<typeof hit>, card: string) =>
    g.card(g.find('p2', 'characters', card)).rested;

  it('the [Trigger] rests the chosen Character with cost 6; cost 7 is not a candidate', () => {
    const g = hit();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([VAN.thatch]);
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    expect(isRested(g, VAN.thatch)).toBe(true);
    expect(isRested(g, VAN.littleOars)).toBe(false);
  });

  it('[Trigger] resolves only its own text: Robin is not played and her [On Play] does not run; she goes to the trash', () => {
    const g = hit();
    activateTrigger(g);
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ROBIN]);
    expect(hand(g)).toEqual([EC.mocha]);
  });

  it('"up to 1": may rest nothing', () => {
    const g = hit();
    activateTrigger(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(isRested(g, VAN.thatch)).toBe(false);
  });

  it('not activating the [Trigger]: Robin goes to hand and nothing is rested', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([ROBIN, EC.mocha].sort());
    expect(isRested(g, VAN.thatch)).toBe(false);
    expect(g.life('p1')).toBe(3);
  });
});

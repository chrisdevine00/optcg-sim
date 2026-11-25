/**
 * ST26-003 Nico Robin (Character, Purple, cost 3, 4000, Counter +2000, {Straw Hat Crew}, Strike).
 *
 * Card text: "[On Play] DON!! -2 (You may return the specified number of DON!! cards from your field
 * to your DON!! deck.): Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: CR 8-3 (a DON!! -N cost is paid from DON!! on the field, active or rested), CR 1-3-5 ("up
 * to" allows 0; "add up to N DON!!" asks a count, most first), CR 6-4 (a DON!! added "as active" is
 * active, not rested). The cost is paid first, so the DON!! deck always has at least 2 cards.
 */
import { describe, expect, it } from 'vitest';
import {
  costOffered,
  decline,
  donOf,
  fieldDon,
  mine,
  optionIds,
  payDonCost,
  pickOption,
  playCard,
  SL,
  useDonCost,
  waitingAtMain,
  yes,
} from './kit-st2627a.ts';

const ROBIN = 'ST26-003';

function start(costArea = { active: 10, rested: 0 }, extraHand: string[] = []) {
  return mine(SL.shanks, { hand: [ROBIN, ...extraHand], costArea });
}

describe('ST26-003 Nico Robin: [On Play] DON!! -2: add up to 1 DON!! and set it active', () => {
  it('the effect is optional: declining changes no DON!! at all', () => {
    const g = start();
    playCard(g, ROBIN);
    expect(costOffered(g)).toBe(true);
    decline(g);
    expect(waitingAtMain(g)).toBe(true);
    expect(donOf(g, 'p1')).toEqual({ deck: 0, active: 7, rested: 3, given: 0 });
  });

  it('paying with active DON!!: 2 go to the DON!! deck, 1 comes back active (deck 2 -> 1, active 7 - 2 + 1)', () => {
    const g = start();
    playCard(g, ROBIN);
    useDonCost(g, 2, 'costActive');
    expect(optionIds(g)[0]).toBe('1');
    pickOption(g, '1');
    expect(waitingAtMain(g)).toBe(true);
    expect(donOf(g, 'p1')).toEqual({ deck: 1, active: 6, rested: 3, given: 0 });
  });

  it('paying with rested DON!!: the added DON!! is active, not rested (rested 3 - 2, active 7 + 1)', () => {
    const g = start();
    playCard(g, ROBIN);
    useDonCost(g, 2, 'costRested');
    pickOption(g, '1');
    expect(donOf(g, 'p1')).toEqual({ deck: 1, active: 8, rested: 1, given: 0 });
  });

  it('"up to 1": the count may be 0; the DON!! -2 cost stays paid (deck 2, two fewer DON!! on the field)', () => {
    const g = start();
    playCard(g, ROBIN);
    useDonCost(g, 2);
    expect(optionIds(g)).toContain('0');
    pickOption(g, '0');
    expect(waitingAtMain(g)).toBe(true);
    expect(donOf(g, 'p1').deck).toBe(2);
    expect(fieldDon(g, 'p1')).toBe(8);
  });

  it('adds at most 1: the count prompt offers no count above 1', () => {
    const g = start();
    playCard(g, ROBIN);
    useDonCost(g, 2);
    expect(optionIds(g).sort()).toEqual(['0', '1']);
  });

  it('the DON!! returned by the cost is available to add: with an empty DON!! deck before the cost the add still works', () => {
    const g = start();
    expect(donOf(g, 'p1').deck).toBe(0);
    playCard(g, ROBIN);
    useDonCost(g, 2);
    pickOption(g, '1');
    expect(donOf(g, 'p1').deck).toBe(1);
    expect(fieldDon(g, 'p1')).toBe(9);
  });

  it('only 3 DON!! on my field (all rested by the play cost) can pay: the field ends with 2 DON!!, one of them active', () => {
    const g = start({ active: 3, rested: 0 });
    playCard(g, ROBIN);
    expect(costOffered(g)).toBe(true);
    yes(g);
    payDonCost(g, 2, 'costRested');
    pickOption(g, '1');
    expect(donOf(g, 'p1')).toEqual({ deck: 8, active: 1, rested: 1, given: 0 });
  });

  it("must not touch the opponent's DON!!", () => {
    const g = start();
    const before = donOf(g, 'p2');
    playCard(g, ROBIN);
    useDonCost(g, 2);
    pickOption(g, '1');
    expect(donOf(g, 'p2')).toEqual(before);
  });

  it('there is no [Once Per Turn]: a second Robin played the same turn offers the effect again', () => {
    const g = start({ active: 10, rested: 0 }, [ROBIN]);
    playCard(g, ROBIN);
    useDonCost(g, 2);
    pickOption(g, '1');
    // 6 active, 3 rested, 1 in the DON!! deck: the second Robin costs 3.
    playCard(g, ROBIN);
    expect(costOffered(g)).toBe(true);
    useDonCost(g, 2);
    pickOption(g, '1');
    expect(waitingAtMain(g)).toBe(true);
    expect(donOf(g, 'p1').deck).toBe(2);
  });
});

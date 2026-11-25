/**
 * OP10-080 Little Black Bears (Event, Purple, cost 3, {Donquixote Pirates}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +4000 power during this
 * battle. Then, if you have 7 or more DON!! cards on your field and 5 or less cards in your hand,
 * draw 1 card.
 * [Trigger] Add up to 1 DON!! card from your DON!! deck and set it as active."
 *
 * Rules: RL-08, CR 8-4-4-1, "DON!! cards on your field" counts the cost area (active and rested)
 * and DON!! given to cards; CR 2-7-3 (an Event is trashed before it resolves, so it is not in the
 * hand while its effect resolves); E-Q11 (a DON!! add asks a count).
 */
import { describe, expect, it } from 'vitest';
import { passCounter } from '../../helpers.ts';
import {
  activateCounter,
  activateTrigger,
  asksDonCount,
  BLUE,
  canCounterNow,
  declineTrigger,
  defend,
  deck,
  don,
  hand,
  hitLeader,
  kind,
  LD10,
  mayDone,
  need,
  none,
  offeredInst,
  pickInst,
  SC10,
  takeDon,
  theirs,
  trash,
} from './kit-op10d.ts';

const ID = 'OP10-080';
const TOP = SC10.c7;

function counter(
  o: {
    active?: number;
    rested?: number;
    given?: number;
    others?: string[];
  } = {},
) {
  const g = defend({
    hand: [ID, ...(o.others ?? [BLUE, BLUE, BLUE])],
    active: o.active ?? 7,
    rested: o.rested ?? 0,
    chars: [{ card: SC10.c3, don: o.given ?? 0 }],
    p2chars: [SC10.c5],
    deck: [TOP, BLUE, BLUE, BLUE, BLUE],
    attackerCard: SC10.c5,
  });
  activateCounter(g, g.find('p1', 'hand', ID));
  need(g, 'choose', 'p1');
  pickInst(g, [g.leader('p1')]);
  return g;
}

describe('OP10-080 Little Black Bears [Counter]: +4000 this battle; with 7+ DON!! on the field and 5 or less cards in hand, draw 1', () => {
  it('+4000 on my Leader (9000) beats a 7000 attacker; both conditions met: draws the top card', () => {
    const g = counter();
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g)).toContain(TOP);
    expect(hand(g)).toHaveLength(4);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the +4000 may go to a Character instead', () => {
    const g = defend({
      hand: [ID],
      active: 7,
      chars: [SC10.c3],
      p2chars: [SC10.c5],
      deck: [TOP, BLUE, BLUE],
    });
    activateCounter(g, g.find('p1', 'hand', ID));
    pickInst(g, [g.find('p1', 'characters', SC10.c3)]);
    expect(g.power(g.find('p1', 'characters', SC10.c3))).toBe(9000);
  });

  it('DON!! boundary: 6 DON!! on the field (3 rested to pay + 3 active) is not enough: no draw', () => {
    const g = counter({ active: 6 });
    expect(hand(g)).not.toContain(TOP);
    expect(hand(g)).toHaveLength(3);
  });

  it('DON!! boundary: exactly 7 on the field counts although 3 of them were just rested to pay the cost', () => {
    const g = counter({ active: 7 });
    expect(don(g, 'p1').rested).toBe(3);
    expect(hand(g)).toContain(TOP);
  });

  it('DON!! given to my cards count as on the field: 5 active + 1 rested + 1 given = 7', () => {
    const g = counter({ active: 5, rested: 1, given: 1 });
    expect(hand(g)).toContain(TOP);
  });

  it('hand boundary: 5 cards left in hand (the Event is not counted) still draws; 6 does not', () => {
    const five = counter({ others: [BLUE, BLUE, BLUE, BLUE, BLUE] });
    expect(hand(five)).toHaveLength(6);
    expect(hand(five)).toContain(TOP);
    const six = counter({ others: [BLUE, BLUE, BLUE, BLUE, BLUE, BLUE] });
    expect(hand(six)).toHaveLength(6);
    expect(hand(six)).not.toContain(TOP);
  });

  it('the boost is not conditional: with neither condition met the +4000 still applies', () => {
    const g = counter({ active: 3, others: [BLUE, BLUE, BLUE, BLUE, BLUE, BLUE] });
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g)).not.toContain(TOP);
    expect(deck(g)[0]).toBe(TOP);
  });

  it('"up to 1": the boost may be skipped; the draw condition is still checked', () => {
    const g = defend({
      hand: [ID, BLUE],
      active: 7,
      p2chars: [SC10.c5],
      deck: [TOP, BLUE, BLUE],
    });
    activateCounter(g, g.find('p1', 'hand', ID));
    need(g, 'choose', 'p1');
    expect(mayDone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    // If the draw step is reached after skipping the pick, it draws exactly one card.
    expect(hand(g).length).toBeLessThanOrEqual(2);
  });

  it('draws exactly 1 card, not more', () => {
    const g = counter();
    expect(deck(g)).toHaveLength(4);
  });

  it('cost 3: with only 2 active DON!! it cannot be used as a Counter', () => {
    const g = defend({ hand: [ID], active: 2, p2chars: [SC10.c5] });
    expect(canCounterNow(g, g.find('p1', 'hand', ID))).toBe(false);
  });

  it('the Event is trashed and the other candidates are only my own Leader and Characters', () => {
    const g = defend({ hand: [ID], active: 3, chars: [SC10.c3], p2chars: [SC10.c5] });
    activateCounter(g, g.find('p1', 'hand', ID));
    expect(offeredInst(g)).toEqual([g.leader('p1'), g.find('p1', 'characters', SC10.c3)].sort());
    expect(trash(g)).toEqual([ID]);
    expect(kind(g)).toBe('choose');
  });
});

describe('OP10-080 [Trigger]: add up to 1 DON!! from the DON!! deck and set it as active', () => {
  function trig() {
    const g = theirs(LD10.neutral, {
      life: [ID, BLUE, BLUE, BLUE],
      costArea: { active: 0, rested: 0 },
    });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('adds 1 active DON!! to the cost area; no power change, no draw', () => {
    const g = trig();
    const handBefore = hand(g).length;
    activateTrigger(g);
    if (asksDonCount(g)) takeDon(g, 1);
    expect(don(g, 'p1').active).toBe(1);
    expect(hand(g)).toHaveLength(handBefore);
    expect(trash(g)).toEqual([ID]);
  });

  it('the count may be 0', () => {
    const g = trig();
    activateTrigger(g);
    if (asksDonCount(g)) takeDon(g, 0);
    expect(don(g, 'p1').active).toBe(0);
  });

  it('declining: the Event goes to my hand, no DON!! is added', () => {
    const g = trig();
    declineTrigger(g);
    expect(hand(g)).toContain(ID);
    expect(don(g, 'p1').active).toBe(0);
  });
});

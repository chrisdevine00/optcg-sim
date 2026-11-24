/**
 * EB03-010 Monet (Character, Red, cost 5, 6000, Counter +1000, {Donquixote Pirates}/{Punk Hazard},
 * [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Look at 5 cards from the top of your deck; reveal up to 1 Character
 * card with 1000 power or less or up to 1 Event card and add it to your hand. Then, place the rest at
 * the bottom of your deck in any order."
 *
 * Rules: CR 8-4-4-1/-2 ("up to" allows 0), the rest go to the bottom in any order, CR 10-1-4
 * ([Blocker]). OPEN-QUESTIONS M6b-Q26 ("one card or the other" vs one of each) is open: the tests
 * assert only what both readings share (at most one card of each kind; the single-card cases).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  blockers,
  chars,
  checkLook,
  chr,
  deck,
  hand,
  kind,
  LA,
  minus,
  mine,
  need,
  noDefence,
  playCard,
  reachablePickSets,
  SA,
  tail,
  theirs,
  trash,
} from './kit-eb03a.ts';

const MONET = 'EB03-010';
/** OP05-021 Revolutionary Army HQ: Red Stage, cost 1 (not a Character, not an Event). */
const STAGE = 'OP05-021';
const EVENT = SA.guardPoint;

/** p1 plays Monet with `top` as the top of the deck, then 9 more cards below it. */
function start(top: string[], below: string[] = [SA.cobra0, ...Array(8).fill(BLUE)]) {
  const g = mine(LA.croc, { hand: [MONET], deck: [...top, ...below] });
  playCard(g, MONET);
  return g;
}

const TOP = [SA.killer1000, SA.dadan2000, EVENT, STAGE, SA.mohji];

describe('EB03-010 Monet: printed values and [Blocker]', () => {
  it('cost 5, 6000, Counter +1000, [Blocker]', () => {
    const g = mine(LA.croc, { characters: [MONET] });
    const m = chr(g, 'p1', MONET);
    expect(g.card(m).cost).toBe(5);
    expect(g.power(m)).toBe(6000);
    expect(g.card(m).counter).toBe(1000);
    expect(g.card(m).keywords).toContain('Blocker');
  });

  it('blocks an attack on the Leader', () => {
    const g = theirs(LA.croc, { characters: [MONET] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([chr(g, 'p1', MONET)]);
    act(g, { type: 'block', blocker: chr(g, 'p1', MONET) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(chars(g)).toEqual([MONET]);
  });
});

describe('EB03-010 Monet: [On Play] look at 5, reveal up to 1 Character with 1000 power or less or up to 1 Event, add it, rest to the bottom', () => {
  it('offers exactly the Characters with 1000 power or less and the Events among the top 5', () => {
    const g = start(TOP);
    expect(kind(g)).toBe('choose');
    // Killer (1000) and the Event qualify; Dadan (2000), the Stage and Mohji (3000) do not.
    checkLook(g, { candidates: [SA.killer1000, EVENT], pick: [EVENT] });
    expect(hand(g)).toEqual([EVENT]);
  });

  it('an Event goes to hand; the other 4 looked-at cards go to the bottom, the 6th card stays on top', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [SA.killer1000, EVENT], pick: [EVENT] });
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(13);
    expect(deck(g)[0]).toBe(SA.cobra0);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [EVENT]).sort());
  });

  it('a Character with 1000 power may be added instead', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [SA.killer1000, EVENT], pick: [SA.killer1000] });
    expect(hand(g)).toEqual([SA.killer1000]);
    expect(tail(deck(g), 4)).toEqual(minus(TOP, [SA.killer1000]).sort());
  });

  it('boundary: a Character with 0 power qualifies, one with 2000 power does not', () => {
    const g = start([SA.cobra0, SA.dadan2000, SA.mohji, SA.mohji, SA.mohji]);
    checkLook(g, { candidates: [SA.cobra0], pick: [SA.cobra0] });
    expect(hand(g)).toEqual([SA.cobra0]);
  });

  it('"up to 1": may add nothing; all 5 looked-at cards go to the bottom', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [SA.killer1000, EVENT], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(14);
    expect(deck(g)[0]).toBe(SA.cobra0);
    expect(tail(deck(g), 5)).toEqual([...TOP].sort());
  });

  it('adds at most 1 card even when a Character and an Event both qualify', () => {
    const g = start(TOP);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('only the top 5 are looked at: a qualifying card in 6th place is not offered', () => {
    const g = start(
      [SA.mohji, SA.mohji, SA.mohji, SA.mohji, SA.mohji],
      [EVENT, ...Array(8).fill(BLUE)],
    );
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(deck(g)[0]).toBe(EVENT);
  });

  it('with no qualifying card in the top 5 all 5 go to the bottom and nothing is added', () => {
    const g = start([SA.mohji, SA.marco, SA.kingdew, SA.sai, STAGE]);
    checkLook(g, { candidates: [], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(tail(deck(g), 5)).toEqual([SA.mohji, SA.marco, SA.kingdew, SA.sai, STAGE].sort());
  });

  it('Monet herself stays on the field after her [On Play]', () => {
    const g = start(TOP);
    checkLook(g, { candidates: [SA.killer1000, EVENT], pick: [EVENT] });
    expect(chars(g)).toEqual([MONET]);
    expect(kind(g)).toBe('main');
  });
});

/**
 * PRB02-003 Lucky.Roux (Character, cost 4, 2000, Counter +1000, {Red-Haired Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may trash 1 Character card with 6000 power or more from your
 * hand: Draw 2 cards."
 *
 * Rules: the text before the colon is the cost (CR 8-3); "you may" lets the player decline. Only a
 * Character card whose printed power is 6000 or more can pay. The effect after the colon is
 * resolved only if the cost was paid. The engine does not reveal whether a hand holds a payable
 * card: the question is asked even when it cannot be paid, with "use" unavailable (DECISIONS
 * 2026-10-29).
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  atMainOf,
  canUse,
  decision,
  hand,
  kind,
  kw,
  LDP,
  mine,
  need,
  no,
  offeredIds,
  payHand,
  playRaw,
  SP,
  sorted,
  trash,
  unusable,
  yes,
  deck,
  at,
} from './kit-prb02sta.ts';

const LR = 'PRB02-003';
const TOP = [SP.c1p3, SP.c2p4, SP.c3p5, SP.c1p3, SP.c2p4, SP.c3p5];

function play(hnd: string[]) {
  const g = mine(LDP.neutral, { hand: [LR, ...hnd], deck: TOP });
  playRaw(g, LR);
  return g;
}

describe('PRB02-003 Lucky.Roux: [Blocker]; [On Play] you may trash a Character card with 6000 power or more from hand: draw 2', () => {
  it('printed values: cost 4, 2000 power, Counter +1000, [Blocker]', () => {
    const g = mine(LDP.neutral, { characters: [LR] });
    const i = at(g, 'p1', 'characters', LR);
    expect([g.card(i).cost, g.power(i), g.card(i).counter]).toEqual([4, 2000, 1000]);
    expect(kw(g, i)).toContain('Blocker');
  });

  it('offers exactly the Character cards with 6000+ power: 6000, 7000, 8000 yes; 5000, an Event and a Stage no', () => {
    const g = play([SP.c3p5, SP.c4p6, SP.c5p7, SP.c6p8, SP.event, SP.stage]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SP.c4p6, SP.c5p7, SP.c6p8].sort());
  });

  it('paying with a 6000-power Character (the boundary): it is trashed and 2 cards are drawn from the top', () => {
    const g = play([SP.c4p6, SP.c3p5]);
    yes(g, 'p1');
    payHand(g, [SP.c4p6]);
    expect(trash(g)).toEqual([SP.c4p6]);
    expect(hand(g)).toEqual([SP.c3p5, SP.c1p3, SP.c2p4].sort());
    expect(deck(g)[0]).toBe(SP.c3p5);
    expect(atMainOf(g)).toBe(true);
  });

  it('paying with a 9000-power Character also works (6000 or MORE)', () => {
    const g = play([SP.c7p9]);
    yes(g, 'p1');
    payHand(g, [SP.c7p9]);
    expect(trash(g)).toEqual([SP.c7p9]);
    expect(hand(g)).toHaveLength(2);
  });

  it('only 1 card is trashed as the cost even with several payable cards in hand', () => {
    const g = play([SP.c4p6, SP.c5p7, SP.c6p8]);
    yes(g, 'p1');
    payHand(g, [SP.c5p7]);
    expect(trash(g)).toEqual([SP.c5p7]);
    expect(hand(g).filter((c) => c === SP.c4p6 || c === SP.c6p8)).toHaveLength(2);
    expect(hand(g)).toHaveLength(4);
  });

  it('"you may": declining trashes nothing and draws nothing', () => {
    const g = play([SP.c4p6]);
    no(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SP.c4p6]);
    expect(atMainOf(g)).toBe(true);
  });

  it('a hand with only 5000-power Characters, Events and Stages cannot pay: no draw and the card is not trashed', () => {
    const g = play([SP.c3p5, SP.event, SP.stage]);
    unusable(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([SP.c3p5, SP.event, SP.stage].sort());
    expect(atMainOf(g)).toBe(true);
  });

  it('an empty hand: the question is still asked (hidden-hand convention) with "use" unavailable; declining ends it', () => {
    const g = play([]);
    const d = decision(g);
    expect(d?.kind).toBe('optional');
    expect(canUse(g)).toBe(false);
    no(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(atMainOf(g)).toBe(true);
  });

  it('another copy of Lucky.Roux in hand (2000 power) is not a valid payment', () => {
    const g = play([LR]);
    unusable(g, 'p1');
    expect(hand(g)).toEqual([LR]);
    expect(trash(g)).toEqual([]);
  });

  it('the cost is hand only: Characters on the field with 6000+ do not count and the field is untouched', () => {
    const g = mine(LDP.neutral, { hand: [LR], characters: [SP.c6p8], deck: TOP });
    playRaw(g, LR);
    unusable(g, 'p1');
    expect(sorted(g, 'p1', 'characters')).toEqual([LR, SP.c6p8].sort());
    expect(hand(g)).toEqual([]);
  });

  it('after paying, the effect asked nothing more: draw is mandatory and exactly 2', () => {
    const g = play([SP.c4p6]);
    accept(g);
    payHand(g, [SP.c4p6]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toHaveLength(2);
  });
});

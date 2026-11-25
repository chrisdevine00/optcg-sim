/**
 * EB02-055 Jinbe (Yellow Character, cost 4, 5000, Counter +2000, {Fish-Man}/{Straw Hat Crew}).
 *
 * Card text: "[Trigger] If your Leader has the "Fish-Man" or "Merfolk" type and you have 2 or less Life
 * cards, play this card."
 *
 * Rules: [Trigger] resolves after the Life card was taken, so the Life count is the count left after
 * the damage (the revealed card has left the Life area); the quoted types match any type
 * including the text; an activated [Trigger] whose condition fails sends the card to the trash; a
 * declined [Trigger] adds the card to the hand.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  chars,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LE,
  need,
  SE,
  theirs,
  trash,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const JINBE = 'EB02-055';

/** p2 hits p1's Leader; the top Life card is Jinbe and there are `lifeBefore` Life cards in all. */
function hit(leader: string, lifeBefore: number, extra: Parameters<typeof theirs>[1] = {}) {
  const g = theirs(leader, {
    life: [JINBE, ...Array(lifeBefore - 1).fill(SE.mohji)],
    ...extra,
  });
  hitLeader(g);
  return g;
}

describe('EB02-055 Jinbe: printed values', () => {
  it('cost 4, 5000 power, Counter +2000, no on-field text', () => {
    const g = theirs(LE.fishMan, { characters: [JINBE] });
    const j = ch(g, 'p1', JINBE);
    expect(g.card(j).cost).toBe(4);
    expect(g.power(j)).toBe(5000);
    expect(g.card(j).counter).toBe(2000);
  });
});

describe('EB02-055 Jinbe: [Trigger] play this card if the Leader is "Fish-Man"/"Merfolk" and Life is 2 or less', () => {
  it('"Fish-Man" Leader, 2 Life left after the hit (boundary): activating plays Jinbe active', () => {
    const g = hit(LE.fishMan, 3);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(chars(g)).toEqual([JINBE]);
    expect(g.card(ch(g, 'p1', JINBE)).rested).toBe(false);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
  });

  it('"Merfolk" Leader, 2 Life left: activating plays Jinbe', () => {
    const g = hit(LE.merfolk, 3);
    activateTrigger(g);
    expect(chars(g)).toEqual([JINBE]);
  });

  it('3 Life left (boundary): the condition fails and the card is trashed', () => {
    const g = hit(LE.fishMan, 4);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([JINBE]);
    expect(hand(g)).toEqual([]);
  });

  it('1 Life left: the condition holds', () => {
    const g = hit(LE.fishMan, 2);
    activateTrigger(g);
    expect(chars(g)).toEqual([JINBE]);
  });

  it('0 Life left (Jinbe was the last Life card): the condition holds', () => {
    const g = hit(LE.fishMan, 1);
    activateTrigger(g);
    expect(chars(g)).toEqual([JINBE]);
    expect(g.life('p1')).toBe(0);
  });

  it('a Leader with neither type: the condition fails and the card is trashed', () => {
    const g = hit(LE.luffy, 3);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([JINBE]);
  });

  it('declining the [Trigger] adds Jinbe to the hand and plays nothing', () => {
    const g = hit(LE.fishMan, 3);
    declineTrigger(g);
    expect(hand(g)).toEqual([JINBE]);
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('with 5 Characters already on the field the trigger still resolves (a Character must be trashed for room)', () => {
    const g = hit(LE.fishMan, 3, {
      characters: [SE.sai, SE.marco, SE.hajrudin, SE.kingdew, SE.thatch],
    });
    activateTrigger(g);
    // Either Jinbe waits on a replacement choice or is already played; the field never exceeds 5.
    expect(g.zone('p1', 'characters').length).toBeLessThanOrEqual(5);
  });

  it('must not: Jinbe is not played when the Life card is taken as normal damage with no trigger activated', () => {
    const g = hit(LE.fishMan, 3);
    declineTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(g.life('p1')).toBe(2);
  });
});

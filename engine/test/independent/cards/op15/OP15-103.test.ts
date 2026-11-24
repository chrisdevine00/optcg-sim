/**
 * OP15-103 Genbo (Character, Yellow, cost 3, 4000, Counter +1000, {Sky Island}/{Shandian Warrior}).
 *
 * Card text: no effect text. "[Trigger] Draw 1 card. Then, if you have 2 or less Life cards, play this card."
 *
 * Rules relied on: CR 10-1-5 / RD 101 (the [Trigger] is activated instead of adding the card to hand, the
 * card is no longer among the Life cards), RD 122 (a "Then" after a failed "If" does not resolve; the
 * draw before it does), the Life count is read when the effect resolves, i.e. after the Life card left.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  chars,
  declineTrigger,
  deck,
  hand,
  hitLeader,
  kind,
  LD15,
  mine,
  playIt,
  SC15,
  theirs,
  trash,
} from './kit-op15c.ts';

const GENBO = 'OP15-103';

/** p1 has `lifeCount` Life cards with Genbo on top; p2's Leader hits. */
function hit(lifeCount: number) {
  const g = theirs(
    LD15.neutral,
    {
      life: [GENBO, ...Array.from({ length: lifeCount - 1 }, () => BLUE)],
      deck: [SC15.red4, SC15.red5, ...Array.from({ length: 10 }, () => BLUE)],
    },
    {},
  );
  hitLeader(g);
  return g;
}

describe('OP15-103 Genbo [Trigger]', () => {
  it('3 Life cards before the hit (2 left): draws 1, then Genbo is played', () => {
    const g = hit(3);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC15.red4]);
    expect(chars(g)).toEqual([GENBO]);
    expect(g.life('p1')).toBe(2);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: 4 Life cards before the hit (3 left): draws 1 but Genbo is not played (it is trashed)', () => {
    const g = hit(4);
    activateTrigger(g);
    expect(hand(g)).toEqual([SC15.red4]);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([GENBO]);
    expect(g.life('p1')).toBe(3);
  });

  it('2 Life cards before the hit (1 left): played', () => {
    const g = hit(2);
    activateTrigger(g);
    expect(chars(g)).toEqual([GENBO]);
    expect(hand(g)).toEqual([SC15.red4]);
  });

  it('1 Life card before the hit (0 left): played, and the game goes on', () => {
    const g = hit(1);
    activateTrigger(g);
    expect(chars(g)).toEqual([GENBO]);
    expect(g.life('p1')).toBe(0);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('draws exactly 1 card, from the top', () => {
    const g = hit(3);
    activateTrigger(g);
    expect(hand(g)).toHaveLength(1);
    expect(deck(g)[0]).toBe(SC15.red5);
  });

  it('declining the Trigger: Genbo goes to hand, nothing is drawn or played', () => {
    const g = hit(3);
    declineTrigger(g);
    expect(hand(g)).toEqual([GENBO]);
    expect(chars(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
  });

  it('the played Genbo is active and has its printed stats', () => {
    const g = hit(3);
    activateTrigger(g);
    const z = g.find('p1', 'characters', GENBO);
    expect(g.card(z).rested).toBe(false);
    expect(g.power(z)).toBe(4000);
  });

  it('played from hand it has no effect: nothing is drawn (the draw is only on the [Trigger])', () => {
    const g = mine(LD15.neutral, { hand: [GENBO] });
    playIt(g, GENBO);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });
});

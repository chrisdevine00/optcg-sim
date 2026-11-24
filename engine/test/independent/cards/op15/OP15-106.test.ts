/**
 * OP15-106 Octoballoon (Character, Yellow, cost 2, 0 power, Counter +1000, {Animal}/{Sky Island}).
 *
 * Card text: no effect text. "[Trigger] Draw 1 card. Then, play up to 1 yellow Character or Stage card with
 * a cost of 2 or less from your hand."
 *
 * Rules relied on: CR 10-1-5 (the Trigger is used instead of adding the card to hand, so Octoballoon is not
 * in hand and cannot be played by itself), effect plays pay no cost (RD 74), "up to" may choose nothing,
 * the draw comes first so the drawn card is a candidate.
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
  LD15,
  mayChooseNone,
  need,
  offeredIds,
  pickCards,
  reachablePickSets,
  SC15,
  skipChoice,
  theirs,
  trash,
} from './kit-op15c.ts';

const OCTO = 'OP15-106';

function hit(handCards: string[], top: string[] = [SC15.red2]) {
  const g = theirs(
    LD15.neutral,
    {
      life: [OCTO, BLUE, BLUE, BLUE],
      hand: handCards,
      deck: [...top, ...Array.from({ length: 10 }, () => BLUE)],
    },
    {},
  );
  hitLeader(g);
  return g;
}

describe('OP15-106 Octoballoon [Trigger]', () => {
  const HAND = [SC15.yellow2, SC15.sky3, SC15.red2, SC15.yellowStage2];

  it('draws 1, then offers only yellow Characters or Stages with cost 2 or less from hand', () => {
    const g = hit(HAND);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    // The drawn Sai (red, cost 2) is in hand too but is not yellow.
    expect(offeredIds(g)).toEqual([SC15.yellow2, SC15.yellowStage2].sort());
  });

  it('boundary: cost 2 is playable, a yellow cost-3 Character (Genbo) is not, a red cost-2 Character is not', () => {
    const g = hit(HAND);
    activateTrigger(g);
    const o = offeredIds(g);
    expect(o).toContain(SC15.yellow2);
    expect(o).not.toContain(SC15.sky3);
    expect(o).not.toContain(SC15.red2);
  });

  it('plays the chosen Character for free; the draw added exactly 1 card', () => {
    const g = hit(HAND);
    activateTrigger(g);
    pickCards(g, [SC15.yellow2]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([SC15.yellow2]);
    expect(hand(g)).toEqual([SC15.red2, SC15.red2, SC15.sky3, SC15.yellowStage2].sort());
    expect(deck(g)).toHaveLength(10);
    expect(trash(g)).toEqual([OCTO]);
  });

  it('can play a yellow Stage', () => {
    const g = hit(HAND);
    activateTrigger(g);
    pickCards(g, [SC15.yellowStage2]);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([SC15.yellowStage2]);
  });

  it('the card drawn by the Trigger is a candidate (draw comes first)', () => {
    const g = hit([SC15.sky3], [SC15.yellow1]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.yellow1]);
    pickCards(g, [SC15.yellow1]);
    expect(chars(g)).toEqual([SC15.yellow1]);
    expect(hand(g)).toEqual([SC15.sky3]);
  });

  it('"up to 1": may play nothing; the draw still happened', () => {
    const g = hit(HAND);
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    skipChoice(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toHaveLength(5);
  });

  it('plays at most one card even when two qualify', () => {
    const g = hit(HAND);
    activateTrigger(g);
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('with nothing playable in hand it still draws and nothing hangs', () => {
    const g = hit([SC15.sky3, SC15.red3]);
    activateTrigger(g);
    if (g.legal().some((a) => a.type === 'done')) skipChoice(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toHaveLength(3);
    expect(chars(g)).toEqual([]);
  });

  it('declining the Trigger: Octoballoon goes to hand, nothing is drawn or played', () => {
    const g = hit(HAND);
    declineTrigger(g);
    expect(hand(g)).toHaveLength(5);
    expect(hand(g)).toContain(OCTO);
    expect(chars(g)).toEqual([]);
  });
});

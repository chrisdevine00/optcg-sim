/**
 * EB04-059 Black Rope Dragon Twister (Event, Yellow, cost 6, {Straw Hat Crew}/{Supernovas}/{Fish-Man Island}).
 *
 * Card text: "[Main] You may turn 1 card from the top of your Life cards face-up: If you have less Characters
 * than your opponent, K.O. up to 1 of your opponent's Characters with a cost of 6 or less and up to 1 of
 * your opponent's Characters with a cost of 5 or less.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-3-1-3/-4 (costs; an optional cost may be skipped, then the effect does not activate),
 * CR 1-3-2-1 (a card already face-up cannot be turned face-up), CR 8-3-3 (a failed "if"), CR 8-4-4-1.
 * Reading: two separate "up to 1" selections, so one Character cannot fill both (CR 8-4-4).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  cardOf,
  chars,
  choiceCards,
  choices,
  choose,
  chooseNone,
  hand,
  hitLeader,
  kind,
  mine,
  playEvent,
  RED,
  SC,
  settleYes,
  theirs,
  trash,
  VAN,
  YL,
  deck,
} from './kit-a.ts';

const EVENT = 'EB04-059';
const pick = (g: ReturnType<typeof mine>, card: string) =>
  choose(g, [choices(g).find((i) => cardOf(g, i) === card)!]);

function played(
  opp: string[],
  o: { mine?: string[]; life?: (string | { card: string; faceUp: boolean })[]; use?: boolean } = {},
) {
  const g = mine(
    YL.shc,
    {
      hand: [EVENT],
      life: o.life ?? fill(RED, 3),
      characters: o.mine ?? [],
      costArea: { active: 6, rested: 0 },
    },
    { characters: opp },
  );
  playEvent(g, EVENT, o.use ?? true);
  return g;
}

describe('EB04-059 Black Rope Dragon Twister: [Main] turn a Life card face-up: if fewer Characters, K.O. cost <= 6 and cost <= 5', () => {
  it('fewer Characters (0 < 3): the top Life card is turned face-up and two different Characters are K.O.’d', () => {
    const g = played([VAN.thatch, VAN.kingdew, VAN.marco]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life').filter((c) => c.faceUp)).toHaveLength(1);
    expect(kind(g)).toBe('choose');
    // The first selection (whichever limit it carries) must include the cost-6 Character or the cost-5 limit one.
    const first = choiceCards(g).sort();
    const sixFirst = first.includes(VAN.thatch);
    if (sixFirst) {
      expect(first).toEqual([VAN.thatch, VAN.kingdew, VAN.marco].sort());
      pick(g, VAN.thatch);
      expect(choiceCards(g).sort()).toEqual([VAN.kingdew, VAN.marco].sort());
      pick(g, VAN.kingdew);
    } else {
      expect(first).toEqual([VAN.kingdew, VAN.marco].sort());
      pick(g, VAN.kingdew);
      expect(choiceCards(g).sort()).toEqual([VAN.thatch, VAN.marco].sort());
      pick(g, VAN.thatch);
    }
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.marco]);
    expect(trash(g, 'p2')).toEqual([VAN.thatch, VAN.kingdew].sort());
    expect(trash(g)).toEqual([EVENT]);
  });

  it('a cost-7 Character is never a candidate', () => {
    const g = played([VAN.littleOars, VAN.marco, VAN.sunny]);
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) {
      expect(choiceCards(g)).not.toContain(VAN.littleOars);
      chooseNone(g);
    }
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(3);
  });

  it('one Character cannot fill both selections: with two cost-6 Characters only one can be K.O.’d', () => {
    const g = played([VAN.thatch, VAN.thatch, VAN.marco]);
    // Pick a cost-6 Character wherever it is offered; the cost-5-or-less step cannot take the other one.
    const picks: string[] = [];
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) {
      const offered = choiceCards(g);
      if (offered.includes(VAN.thatch)) {
        pick(g, VAN.thatch);
        picks.push(VAN.thatch);
      } else {
        chooseNone(g);
      }
    }
    settleYes(g, 'p1');
    expect(picks).toHaveLength(1);
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('"up to 1" twice: both selections may be left empty', () => {
    const g = played([VAN.thatch, VAN.kingdew]);
    for (let i = 0; i < 2 && kind(g) === 'choose'; i++) chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('with one opposing Character only that one can be K.O.’d', () => {
    const g = played([VAN.kingdew]);
    pick(g, VAN.kingdew);
    if (kind(g) === 'choose') chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('CR 8-3-3: equal numbers of Characters (1 vs 1): the Life card is turned (cost paid) but nobody is K.O.’d', () => {
    const g = played([VAN.kingdew], { mine: [VAN.sunny] });
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.kingdew]);
  });

  it('CR 8-3-3: more Characters than the opponent: nobody is K.O.’d', () => {
    const g = played([VAN.kingdew], { mine: [VAN.sunny, VAN.sai] });
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.kingdew]);
  });

  it('CR 8-3-1-4: declining the "you may" cost: the Life card stays face-down and nobody is K.O.’d', () => {
    const g = played([VAN.kingdew, VAN.marco], { use: false });
    expect(g.zone('p1', 'life').some((c) => c.faceUp)).toBe(false);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('CR 1-3-2-1: with the top Life card already face-up the cost cannot be paid', () => {
    const g = played([VAN.kingdew, VAN.marco], { life: [{ card: RED, faceUp: true }, RED, RED] });
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('with 0 Life the cost cannot be paid', () => {
    const g = played([VAN.kingdew], { life: [] });
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.kingdew]);
  });
});

describe('EB04-059 Black Rope Dragon Twister: [Trigger] draw 2 and trash 1', () => {
  it('activating draws 2 then p1 trashes 1 card from hand', () => {
    const g = theirs(YL.shc, {
      life: [EVENT, ...fill(BLUE, 3)],
      deck: [SC.bobbin, SC.opera, ...fill(BLUE, 10)],
    });
    hitLeader(g);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', SC.opera)]);
    settleYes(g, 'p1');
    expect(hand(g)).toEqual([SC.bobbin]);
    expect(trash(g)).toEqual([EVENT, SC.opera].sort());
    expect(deck(g)).toHaveLength(10);
  });
});

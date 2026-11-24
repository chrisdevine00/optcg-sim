/**
 * EB05-029 Kimono Sleeve Cage (Event, Blue, cost 5, {Navy}).
 *
 * Card text: "[Main] You may trash 1 card from your hand: Negate the effect of up to 1 of your
 * opponent's Characters with a cost of 6 or less during this turn, and return it to the owner's hand.
 * [Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 8-4-4-1 ("up to"), CR 3-1-6 (a returned card is a new card),
 * CR 10-1-5 ([Trigger]), CR 4-5-3, CR 10-2-14.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  declineTrigger,
  deck,
  decline,
  don,
  EL,
  hand,
  hitLeader,
  inHand,
  kind,
  mine,
  offered,
  offeredInstance,
  playEvent,
  RED,
  reachablePickSets,
  settleYes,
  skipUnusable,
  theirs,
  trash,
  VAN,
} from './kit-eb05a.ts';

const CAGE = 'EB05-029';

describe('EB05-029 Kimono Sleeve Cage: [Main] trash 1 card from hand: return an opposing Character with cost 6 or less to hand', () => {
  const OPP = [VAN.thatch, VAN.littleOars, VAN.marco];
  function start(inHandCards: string[] = [VAN.sunny], use = true) {
    const g = mine(
      EL.croc,
      { hand: [CAGE, ...inHandCards], deck: fill(BLUE, 10) },
      { characters: OPP },
    );
    playEvent(g, CAGE, use);
    return g;
  }
  const p2chars = (g: ReturnType<typeof start>) =>
    g
      .zone('p2', 'characters')
      .map((c) => c.card)
      .sort();
  const p2hand = (g: ReturnType<typeof start>) =>
    g
      .zone('p2', 'hand')
      .map((c) => c.card)
      .sort();

  it('paying: the chosen card is trashed from my hand and the chosen Character returns to its owner’s hand', () => {
    const g = start();
    if (kind(g) === 'choose' && choiceCards(g).includes(VAN.sunny))
      choose(g, [inHand(g, VAN.sunny)]);
    choose(g, [offeredInstance(g, VAN.thatch)]);
    settleYes(g, 'p1');
    expect(trash(g)).toEqual([VAN.sunny, CAGE].sort());
    expect(p2chars(g)).toEqual([VAN.littleOars, VAN.marco].sort());
    expect(p2hand(g)).toEqual([VAN.thatch]);
    expect(hand(g)).toEqual([]);
  });

  it('cost boundary: cost 6 and cost 3 are candidates, cost 7 is not', () => {
    const g = start();
    if (kind(g) === 'choose' && choiceCards(g).includes(VAN.sunny))
      choose(g, [inHand(g, VAN.sunny)]);
    expect(choiceCards(g)).toEqual([VAN.marco, VAN.thatch].sort());
  });

  it('"up to 1": may return nobody (the card was still trashed)', () => {
    const g = start();
    if (kind(g) === 'choose' && choiceCards(g).includes(VAN.sunny))
      choose(g, [inHand(g, VAN.sunny)]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(p2chars(g)).toEqual(OPP.slice().sort());
    expect(trash(g)).toContain(VAN.sunny);
  });

  it('returns at most 1', () => {
    const g = start();
    if (kind(g) === 'choose' && choiceCards(g).includes(VAN.sunny))
      choose(g, [inHand(g, VAN.sunny)]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('CR 8-3-1-4: declining the cost trashes nothing and returns nothing (the Event is still spent)', () => {
    const g = start([VAN.sunny], false);
    expect(p2chars(g)).toEqual(OPP.slice().sort());
    expect(hand(g)).toEqual([VAN.sunny]);
    expect(trash(g)).toEqual([CAGE]);
  });

  it('CR 8-3-1-3: with no other card in hand the cost cannot be paid and nothing is returned', () => {
    const g = start([]);
    skipUnusable(g, 'p1');
    expect(p2chars(g)).toEqual(OPP.slice().sort());
    expect(offered(g, 'p1')).toBe(false);
  });

  it('the Event costs 5 DON!!', () => {
    const g = start();
    expect(don(g)).toMatchObject({ active: 5, rested: 5 });
  });

  it('only the opponent’s Characters are candidates (my own are not)', () => {
    const g = mine(
      EL.croc,
      { hand: [CAGE, VAN.sunny], characters: [VAN.sai], deck: fill(BLUE, 10) },
      { characters: [VAN.marco] },
    );
    playEvent(g, CAGE);
    if (kind(g) === 'choose' && choiceCards(g).includes(VAN.sunny))
      choose(g, [inHand(g, VAN.sunny)]);
    expect(choiceCards(g)).toEqual([VAN.marco]);
  });

  it('the returned card is a new card in its owner’s hand: it can be replayed with its printed values', () => {
    const g = start();
    if (kind(g) === 'choose' && choiceCards(g).includes(VAN.sunny))
      choose(g, [inHand(g, VAN.sunny)]);
    choose(g, [offeredInstance(g, VAN.marco)]);
    settleYes(g, 'p1');
    expect(g.zone('p2', 'hand')[0]!.cost).toBe(3);
  });
});

describe('EB05-029 Kimono Sleeve Cage: [Trigger] draw 2 and trash 1 card from hand', () => {
  function hit(p1Hand: string[] = []) {
    const g = theirs(
      EL.croc,
      { life: [CAGE, RED, RED, RED], deck: fill(BLUE, 10), hand: p1Hand },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('draws 2 then trashes 1 card chosen from hand; the Event itself is trashed after resolving', () => {
    const g = hit();
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    if (kind(g) === 'choose') choose(g, [g.zone('p1', 'hand')[0]!.instance]);
    settleYes(g, 'p1');
    expect(hand(g)).toHaveLength(1);
    expect(trash(g)).toEqual([CAGE, BLUE].sort());
    expect(deck(g)).toHaveLength(8);
  });

  it('the trash is chosen from the whole hand, including cards held before', () => {
    const g = hit([VAN.sunny]);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    choose(g, [inHand(g, VAN.sunny)]);
    settleYes(g, 'p1');
    expect(trash(g)).toContain(VAN.sunny);
    expect(hand(g)).toEqual([BLUE, BLUE]);
  });

  it('not activating the [Trigger]: the Event goes to hand and nothing is drawn', () => {
    const g = hit();
    declineTrigger(g);
    expect(hand(g)).toEqual([CAGE]);
    expect(deck(g)).toHaveLength(10);
    expect(decline).toBeTruthy();
  });
});

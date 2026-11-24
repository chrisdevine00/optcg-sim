/**
 * EB05-019 I Choose to Open This Country to the World!! I Want to Fight on Your Side!!! (Event, Green,
 * cost 1, {Land of Wano}).
 *
 * Card text: "[Counter] You may rest 1 of your cards: Up to 1 of your {Land of Wano} type Leader or
 * Characters gains +4000 power during this battle.
 * [Trigger] If your opponent has 3 or less Life cards, play up to 1 {Land of Wano} type Character card
 * with 6000 power or less from your hand."
 *
 * Rules: CR 7-1-3-1-2 (Event [Counter]), CR 8-3-1-3/-4 (costs; "cards" includes DON!!, E-Q3/M4b-1),
 * RL-08 ("during this battle"), CR 8-3-3, CR 10-1-5 ([Trigger]), CR 8-4-4-1 ("up to").
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, passBlock } from '../../helpers.ts';
import {
  activateTrigger,
  BLUE,
  canCounterWith,
  chars,
  choiceCards,
  choose,
  chooseIfAsked,
  chooseNone,
  declineTrigger,
  decision,
  don,
  EC,
  EL,
  hand,
  hitLeader,
  inHand,
  kind,
  mine,
  offeredInstance,
  RED,
  settleYes,
  theirs,
  useCounter,
  VAN,
} from './kit-eb05a.ts';
import { act } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'EB05-019';
/** ST09-006 Kouzuki Momonosuke: Yellow, cost 2, 4000, {Land of Wano}/{Kouzuki Clan}, vanilla. */
const MOMO = 'ST09-006';
/** OP12-023 Kawamatsu: Green, cost 5, 6000, {Fish-Man}/{Land of Wano}/{The Akazaya Nine}, vanilla. */
const KAWAMATSU = 'OP12-023';
/** ST09-013 Yamato: Yellow, cost 5, 7000, {Land of Wano}, vanilla. */
const YAMATO = 'ST09-013';

/** Finish a pending cost choice for the "rest 1 of your cards" with the first offered pick. */
function payRest(g: TestGame): void {
  for (let i = 0; i < 4; i++) {
    const d = decision(g);
    if (d?.kind === 'choose' && d.purpose === 'cost') {
      const p = g.legal().find((a) => a.type === 'pick');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    } else return;
  }
}

describe('EB05-019 I Choose to Open This Country…: [Counter] rest 1 of your cards: {Land of Wano} Leader or Character +4000', () => {
  function underAttack(leader: string, own: string[], active = 3) {
    const g = theirs(
      leader,
      { hand: [EVENT], characters: own, costArea: { active, rested: 0 }, life: fill(RED, 4) },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }
  const restedThings = (g: TestGame) =>
    don(g).rested +
    [g.leader('p1'), ...g.zone('p1', 'characters').map((c) => c.instance)].filter(
      (i) => g.card(i).rested,
    ).length;

  it('a {Land of Wano} Leader gains +4000 (5000 -> 9000) and the attack fails', () => {
    const g = underAttack(EL.wano, []);
    expect(canCounterWith(g, inHand(g, EVENT))).toBe(true);
    useCounter(g, inHand(g, EVENT), g.leader('p1'));
    payRest(g);
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('a {Land of Wano} Character can be the target instead (Leader stays at 5000)', () => {
    const g = underAttack(EL.croc, [EC.shinobu]);
    const shinobu = g.find('p1', 'characters', EC.shinobu);
    useCounter(g, inHand(g, EVENT), shinobu);
    payRest(g);
    chooseIfAsked(g, [shinobu]);
    expect(g.power(shinobu)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a non-{Land of Wano} Leader or Character is not a legal target', () => {
    const g = underAttack(EL.croc, [VAN.marco]);
    if (canCounterWith(g, inHand(g, EVENT))) {
      useCounter(g, inHand(g, EVENT), g.leader('p1'));
      payRest(g);
      if (kind(g) === 'choose') expect(choiceCards(g)).toEqual([]);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', VAN.marco))).toBe(5000);
  });

  it('CR 8-3-1-3/-4: resting 1 card is an extra cost on top of the Event’s own 1 DON!!', () => {
    const g = underAttack(EL.wano, []);
    const before = restedThings(g);
    useCounter(g, inHand(g, EVENT), g.leader('p1'));
    payRest(g);
    chooseIfAsked(g, [g.leader('p1')]);
    expect(restedThings(g)).toBe(before + 2);
  });

  it('the boost lasts during the battle only', () => {
    const g = underAttack(EL.wano, []);
    useCounter(g, inHand(g, EVENT), g.leader('p1'));
    payRest(g);
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may boost nobody', () => {
    const g = underAttack(EL.wano, []);
    useCounter(g, inHand(g, EVENT), g.leader('p1'));
    payRest(g);
    if (kind(g) === 'choose') chooseNone(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the [Counter] is not usable in my own Main Phase', () => {
    const g = mine(EL.wano, { hand: [EVENT] });
    expect(g.legal().some((a) => a.type === 'activate' && a.card === inHand(g, EVENT))).toBe(false);
  });

  it('with 0 active DON!! the Event’s own cost cannot be paid', () => {
    const g = underAttack(EL.wano, [], 0);
    expect(canCounterWith(g, inHand(g, EVENT))).toBe(false);
  });
});

describe('EB05-019 I Choose to Open This Country…: [Trigger] opponent has 3 or less Life: play a {Land of Wano} Character with 6000 power or less', () => {
  /** p2 hits p1's Leader; the Event is p1's top Life card. */
  function hit(p2Life: number, inHandCards: string[] = [MOMO, KAWAMATSU, YAMATO, VAN.marco]) {
    const g = theirs(
      EL.croc,
      { life: [EVENT, RED, RED, RED], hand: inHandCards, deck: fill(BLUE, 10) },
      { life: fill(RED, p2Life) },
    );
    hitLeader(g);
    return g;
  }

  it('with the opponent at 3 Life: plays the chosen Character; 4000 and 6000 (boundary) qualify, 7000 and non-Wano do not', () => {
    const g = hit(3);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([MOMO, KAWAMATSU].sort());
    choose(g, [offeredInstance(g, KAWAMATSU)]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([KAWAMATSU]);
    expect(hand(g)).toEqual([MOMO, YAMATO, VAN.marco].sort());
  });

  it('with the opponent at 4 Life the condition fails and nothing is played', () => {
    const g = hit(4);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('with the opponent at 0 Life (3 or less) it still plays', () => {
    const g = hit(0);
    activateTrigger(g);
    expect(choiceCards(g)).toEqual([MOMO, KAWAMATSU].sort());
  });

  it('"up to 1": may play nothing', () => {
    const g = hit(3);
    activateTrigger(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
  });

  it('the Character is played without paying its cost', () => {
    const g = hit(3);
    activateTrigger(g);
    choose(g, [offeredInstance(g, MOMO)]);
    settleYes(g, 'p1');
    expect(don(g)).toMatchObject({ active: 0, rested: 0 });
    expect(g.card(g.find('p1', 'characters', MOMO)).rested).toBe(false);
  });

  it('with no {Land of Wano} Character of 6000 or less in hand nothing happens', () => {
    const g = hit(3, [YAMATO, VAN.marco]);
    activateTrigger(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
  });

  it('not activating the [Trigger]: the Event goes to hand and nothing is played', () => {
    const g = hit(3);
    declineTrigger(g);
    expect(hand(g)).toContain(EVENT);
    expect(chars(g)).toEqual([]);
  });
});

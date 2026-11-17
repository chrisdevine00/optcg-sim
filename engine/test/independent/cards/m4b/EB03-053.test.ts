/**
 * EB03-053 Nami (Character, Yellow, cost 5, 6000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] Give up to 1 rested DON!! card to your Leader. Then, if your opponent has 3 or more
 * Life cards, add up to 1 card from the top of your opponent's Life cards to the owner's hand.
 * [On K.O.] You may turn 1 card from the top of your Life cards face-up: Play up to 1 Character card with
 * 6000 power or less from your hand."
 *
 * Rules: CR 8-3-3, CR 8-4-4-1 ("up to" allows 0), CR 8-3-1-3/-4 (costs), CR 1-3-2-1 (a card already face-up
 * cannot be turned face-up), RL-22 (Life taken by an effect: no [Trigger]), CR 10-2-17 ([On K.O.]).
 */
import { describe, expect, it } from 'vitest';
import { attack, fill, noDefence } from '../../helpers.ts';
import {
  accept,
  BLUE,
  chars,
  chooseCards,
  chooseNone,
  choiceCards,
  count,
  decline,
  declineAny,
  don,
  finishEmpty,
  hand,
  kind,
  mine,
  offered,
  outcomes,
  playCard,
  RED,
  SC,
  settleYes,
  skipUnusable,
  theirs,
  VAN,
  YL,
} from './kit-a.ts';

const NAMI = 'EB03-053';

function played(p2Life: string[] = fill(RED, 4)) {
  const g = mine(YL.shc, { hand: [NAMI], costArea: { active: 5, rested: 1 } }, { life: p2Life });
  playCard(g, NAMI);
  return g;
}

describe('EB03-053 Nami: [On Play] give a rested DON!! to the Leader, then take an opponent Life card if they have 3 or more', () => {
  it('gives 1 rested DON!! to the Leader, then the opponent’s top Life card goes to THEIR hand (4 -> 3 Life)', () => {
    const g = played();
    settleYes(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ given: 1, rested: 5, active: 0 });
    expect(g.life('p2')).toBe(3);
    expect(count(g, 'p2', 'hand')).toBe(1);
    expect(count(g, 'p1', 'hand')).toBe(0);
  });

  it('exactly 3 Life meets "3 or more"', () => {
    const g = played(fill(RED, 3));
    settleYes(g, 'p1');
    expect(g.life('p2')).toBe(2);
    expect(count(g, 'p2', 'hand')).toBe(1);
  });

  it('CR 8-3-3: with 2 Life nothing is taken (the DON!! is still given)', () => {
    const g = played(fill(RED, 2));
    settleYes(g, 'p1');
    expect(g.life('p2')).toBe(2);
    expect(count(g, 'p2', 'hand')).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('RL-22: a [Trigger] Life card taken this way just goes to the opponent’s hand: no [Trigger] decision', () => {
    const g = played([SC.speed, RED, RED, RED]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toEqual([SC.speed]);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('"up to 1": the Life card may be left alone', () => {
    const g = played();
    const reached = outcomes(g, 'p1', (b) => `${b.life('p2')}`);
    expect(reached.has('4')).toBe(true);
    expect(reached.has('3')).toBe(true);
  });

  // DISAGREEMENTS-a.md A-2 (same shape): "up to 1 rested DON!!" cannot be given as 0.
  it.fails('CR 8-4-4-1: "up to 1" rested DON!!: may give none', () => {
    const g = played();
    const reached = outcomes(g, 'p1', (b) => `${don(b).given}`);
    expect(reached.has('0')).toBe(true);
  });
});

describe('EB03-053 Nami: [On K.O.] turn the top Life card face-up: play a Character with 6000 power or less from hand', () => {
  /** p2's Kingdew (7000) K.O.s p1's rested Nami (6000). */
  function koed(
    o: { life?: (string | { card: string; faceUp: boolean })[]; hand?: string[] } = {},
  ) {
    const g = theirs(
      YL.shc,
      {
        characters: [{ card: NAMI, rested: true }],
        life: o.life ?? [RED, RED, RED],
        hand: o.hand ?? [SC.seto, VAN.marco, VAN.thatch, VAN.kingdew],
      },
      { characters: [VAN.kingdew] },
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.find('p1', 'characters', NAMI));
    noDefence(g);
    return g;
  }

  it('paying: the top Life card is face-up; candidates are Characters of 6000 power or less (6000 yes, 7000/8000 no)', () => {
    const g = koed();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(choiceCards(g).sort()).toEqual([SC.seto, VAN.marco].sort());
    chooseCards(g, [SC.seto]);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([SC.seto]);
    expect(hand(g)).toEqual([VAN.marco, VAN.thatch, VAN.kingdew].sort());
  });

  it('"up to 1": after paying, may play nothing (the Life card stays face-up)', () => {
    const g = koed();
    accept(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
  });

  it('CR 8-3-1-4: declining the cost: nothing is turned and nothing is played', () => {
    const g = koed();
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(g.zone('p1', 'life').some((c) => c.faceUp)).toBe(false);
    expect(chars(g)).toEqual([]);
  });

  it('CR 1-3-2-1: with the top Life card already face-up the cost cannot be paid', () => {
    const g = koed({ life: [{ card: RED, faceUp: true }, RED, RED] });
    skipUnusable(g, 'p1');
    expect(chars(g)).toEqual([]);
  });

  it('with 0 Life the cost cannot be paid', () => {
    const g = koed({ life: [] });
    skipUnusable(g, 'p1');
    expect(chars(g)).toEqual([]);
  });

  it('a hand with no Character of 6000 or less: the Life card is still turned, nothing is played', () => {
    const g = koed({ hand: [VAN.thatch, VAN.kingdew, BLUE] });
    accept(g);
    finishEmpty(g);
    if (kind(g) === 'choose') declineAny(g);
    settleYes(g, 'p1');
    expect(chars(g)).toEqual([]);
  });

  it('[On K.O.] does not fire when Nami survives the battle', () => {
    const g = theirs(
      YL.shc,
      { characters: [{ card: NAMI, rested: true }], life: [RED, RED, RED], hand: [VAN.marco] },
      { characters: [VAN.sunny] },
    );
    attack(g, g.find('p2', 'characters', VAN.sunny), g.find('p1', 'characters', NAMI));
    noDefence(g);
    expect(chars(g)).toEqual([NAMI]);
    expect(kind(g)).toBe('main');
  });
});

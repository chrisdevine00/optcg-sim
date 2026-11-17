/**
 * OP11-106 Zeus (Character, Yellow, cost 2, 2000, Counter +2000, {Big Mom Pirates}/{Homies}).
 *
 * Card text: "[On Play] You may add 1 card from the top or bottom of your Life cards to your hand: K.O. up
 * to 1 of your opponent's Characters with a cost of 5 or less."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 8-4-4-1 ("up to" allows 0), RL-22 (Life moved by an effect: no
 * [Trigger], no defeat), CR 10-2-1 (K.O.).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  BLUE,
  cardOf,
  chars,
  choiceCards,
  choices,
  choose,
  chooseNone,
  decline,
  hand,
  kind,
  lifeCards,
  mine,
  offered,
  pickLife,
  playCard,
  RED,
  SC,
  settleYes,
  skipUnusable,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const OPP = [VAN.kingdew, VAN.thatch, VAN.marco]; // costs 5, 6, 3

function played(life: string[] = [RED, SC.bobbin, SC.opera], opp: string[] = OPP) {
  const g = mine(YL.bmp, { hand: ['OP11-106'], life, deck: fill(BLUE, 10) }, { characters: opp });
  playCard(g, 'OP11-106');
  return g;
}

describe('OP11-106 Zeus: [On Play] add a top or bottom Life card to hand: K.O. a Character with cost 5 or less', () => {
  it('paying with the top Life card: candidates are cost 5 or less (5 included, 6 excluded); the target is K.O.’d', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    pickLife(g, 'top');
    expect(hand(g)).toEqual([RED]);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([VAN.kingdew, VAN.marco].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.kingdew)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.marco, VAN.thatch].sort());
    expect(trash(g, 'p2')).toEqual([VAN.kingdew]);
  });

  it('paying with the bottom Life card', () => {
    const g = played();
    accept(g);
    pickLife(g, 'bottom');
    expect(hand(g)).toEqual([SC.opera]);
    expect(lifeCards(g)).toEqual([RED, SC.bobbin]);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.kingdew, VAN.thatch].sort());
  });

  it('K.O. is "up to 1": after paying, may choose nobody (the Life card still went to hand)', () => {
    const g = played();
    accept(g);
    pickLife(g, 'top');
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(3);
    expect(hand(g)).toEqual([RED]);
  });

  it('K.O.s at most one Character', () => {
    const g = played();
    accept(g);
    pickLife(g, 'top');
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('CR 8-3-1-4: declining the cost K.O.s nothing and keeps Life', () => {
    const g = played();
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(chars(g, 'p2')).toHaveLength(3);
    expect(lifeCards(g)).toEqual([RED, SC.bobbin, SC.opera]);
  });

  it('CR 8-3-1-3: with 0 Life the cost cannot be paid and nothing is K.O.’d', () => {
    const g = played([]);
    skipUnusable(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(3);
    expect(kind(g)).toBe('main');
  });

  it('only the opponent’s Characters can be K.O.’d, and only those of cost 5 or less', () => {
    const g = played(undefined, [VAN.thatch, VAN.littleOars]);
    accept(g);
    pickLife(g, 'top');
    // No legal target (costs 6 and 7): nothing to choose, nothing K.O.’d.
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toEqual([]);
      chooseNone(g);
    }
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('RL-22: taking the last Life card to hand is not a defeat', () => {
    const g = played([SC.speed]);
    accept(g);
    pickLife(g, 'top');
    expect(g.life('p1')).toBe(0);
    expect(hand(g)).toEqual([SC.speed]);
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.marco)!]);
    expect(kind(g)).toBe('main');
  });
});

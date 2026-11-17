/**
 * EB01-059 Kingdom Come (Event, Yellow, cost 6, {Sky Island}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's Characters. Then, trash cards from the top of your Life
 * cards until you have 1 Life card.
 * [Trigger] K.O. up to 1 of your opponent's Characters with a cost equal to or less than the total of your
 * and your opponent's Life cards."
 *
 * Rulings: QA-EB01 EB01-059 (digest RL-25 note): while the [Trigger] resolves the card is in no area, so
 * the Life total does not count it.
 * Rules: CR 8-4-4-1 ("up to" allows 0), CR 8-4-2 (an Event is trashed, then its effect resolves),
 * RL-22 (trashing Life by an effect is not damage: no [Trigger]).
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
  declineTrigger,
  hand,
  hitLeader,
  kind,
  lifeCards,
  mine,
  playEvent,
  RED,
  SC,
  settleYes,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const KC = 'EB01-059';
const DAIFUKU = 'OP17-107'; // [Trigger] Play this card

function main(life: string[], opp: string[] = [VAN.thatch, VAN.sunny]) {
  const g = mine(
    YL.sky,
    { hand: [KC], life, costArea: { active: 6, rested: 0 } },
    { characters: opp },
  );
  playEvent(g, KC);
  return g;
}

describe('EB01-059 Kingdom Come: [Main] K.O. up to 1 Character, then trash Life until 1 remains', () => {
  it('K.O.s the chosen Character (any cost) and trashes the top Life cards until only the bottom one is left', () => {
    const g = main([RED, BLUE, SC.bobbin, SC.opera], [SC.xebec, VAN.sunny]);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([SC.xebec, VAN.sunny].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === SC.xebec)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.sunny]);
    expect(lifeCards(g)).toEqual([SC.opera]);
    expect(trash(g)).toEqual([KC, RED, BLUE, SC.bobbin].sort());
    expect(trash(g, 'p2')).toEqual([SC.xebec]);
  });

  it('trashed Life cards are not damage: a [Trigger] card among them does not ask for a decision', () => {
    const g = main([DAIFUKU, RED, RED]);
    choose(g, [choices(g)[0]!]);
    settleYes(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(lifeCards(g)).toHaveLength(1);
    expect(trash(g)).toContain(DAIFUKU);
    expect(chars(g)).toEqual([]);
  });

  it('with exactly 1 Life card nothing more is trashed', () => {
    const g = main([RED]);
    choose(g, [choices(g)[0]!]);
    settleYes(g, 'p1');
    expect(lifeCards(g)).toEqual([RED]);
    expect(trash(g)).toEqual([KC]);
  });

  it('with 0 Life cards there is nothing to trash and no Life card appears', () => {
    const g = main([]);
    choose(g, [choices(g)[0]!]);
    settleYes(g, 'p1');
    expect(lifeCards(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": may K.O. nobody, and the Life is still trashed down to 1 ("Then" does not depend on the K.O.)', () => {
    const g = main([RED, BLUE, SC.bobbin]);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(lifeCards(g)).toEqual([SC.bobbin]);
  });

  it('K.O.s at most one Character', () => {
    const g = main([RED, BLUE], [VAN.sunny, VAN.sai]);
    choose(g, [choices(g)[0]!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toHaveLength(1);
  });

  it('the Event cost is 6: with only 5 active DON!! it cannot be played', () => {
    const g = mine(
      YL.sky,
      { hand: [KC], costArea: { active: 5, rested: 0 } },
      { characters: [VAN.sunny] },
    );
    expect(g.isLegal({ type: 'playCard', card: g.find('p1', 'hand', KC), player: 'p1' })).toBe(
      false,
    );
  });
});

describe('EB01-059 Kingdom Come: [Trigger] K.O. a Character with cost <= total Life of both players', () => {
  /** p1 has KC on top of 4 Life; p2 has 4 Life. After the hit p1 has 3, so the total is 7. */
  function hit(opp: string[]) {
    const g = theirs(
      YL.sky,
      { life: [KC, ...fill(BLUE, 3)] },
      { characters: opp, life: fill(RED, 4) },
    );
    hitLeader(g);
    return g;
  }

  it('the total excludes the Trigger card itself: 3 + 4 = 7, so cost 7 is a legal target and cost 8 is not', () => {
    const g = hit([VAN.littleOars, VAN.shiki8, VAN.sunny]);
    activateTrigger(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([VAN.littleOars, VAN.sunny].sort());
    choose(g, [choices(g).find((i) => cardOf(g, i) === VAN.littleOars)!]);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.shiki8, VAN.sunny].sort());
    expect(trash(g)).toEqual([KC]);
  });

  it('"up to 1": may K.O. nobody', () => {
    const g = hit([VAN.sunny]);
    activateTrigger(g);
    chooseNone(g);
    settleYes(g, 'p1');
    expect(chars(g, 'p2')).toEqual([VAN.sunny]);
  });

  it('declining the [Trigger] puts Kingdom Come in hand, nobody is K.O.’d', () => {
    const g = hit([VAN.sunny]);
    declineTrigger(g);
    expect(hand(g)).toEqual([KC]);
    expect(chars(g, 'p2')).toEqual([VAN.sunny]);
  });
});

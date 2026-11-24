/**
 * OP17-018 The Power to Destroy the World (Event, Red, cost 1, {The Four Emperors}/{Whitebeard
 * Pirates}).
 *
 * Card text: "[Main] You may rest 2 of your DON!! cards: K.O. up to 1 of your opponent's Stages.
 * [Counter] If you have 2 or more Characters with 8000 base power or more, up to 1 of your Leader or
 * Characters gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (costs), CR 8-4-4-1 ("up to"), CR 10-2-1 (K.O.), CR 4-9-2 (base power), RL-08
 * ("during this battle"), CR 8-3-3 (a failed "if"), CR 10-2-4 ([Counter]).
 */
import { describe, expect, it } from 'vitest';
import { fill, S, passCounter } from '../../helpers.ts';
import {
  accept,
  attack,
  BLUE,
  canCounterWith,
  charsOf,
  choices,
  choose,
  chooseIfAsked,
  chooseNone,
  decline,
  don,
  expectMain,
  kind,
  LD,
  lp,
  mine,
  offered,
  passBlock,
  payDon,
  playCard,
  RED,
  skipUnusable,
  theirs,
  trash,
  useCounter,
  WB,
} from './kit-op17a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const EVENT = 'OP17-018';
const STAGE = S.armyHq;

describe('OP17-018 The Power to Destroy the World [Main]: rest 2 DON!!: K.O. up to 1 opposing Stage', () => {
  function main(
    opts: { active?: number; stage?: boolean; oppChars?: string[]; ownStage?: boolean } = {},
  ) {
    const g = mine(
      LD.luffy,
      {
        hand: [EVENT],
        costArea: { active: opts.active ?? 10, rested: 0 },
        ...(opts.ownStage ? { stage: STAGE } : {}),
      },
      {
        ...(opts.stage === false ? {} : { stage: STAGE }),
        characters: opts.oppChars ?? [WB.kingdew],
      },
    );
    playCard(g, EVENT);
    return g;
  }

  it('paying 2 rested DON!! K.O.s the opposing Stage (3 DON!! rested in total with the Event’s own cost)', () => {
    const g = main();
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 2);
    choose(g, [g.find('p2', 'stage', STAGE)]);
    expectMain(g);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([STAGE]);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
    expect(trash(g)).toEqual([EVENT]);
  });

  it('the only candidate is the Stage: opposing Characters are not offered', () => {
    const g = main();
    accept(g);
    payDon(g, 2);
    expect(choices(g)).toEqual([g.find('p2', 'stage', STAGE)]);
  });

  it('only the OPPONENT’s Stage: my own Stage is not a candidate', () => {
    const g = main({ ownStage: true });
    accept(g);
    payDon(g, 2);
    expect(choices(g)).toEqual([g.find('p2', 'stage', STAGE)]);
  });

  it('CR 8-4-4-1 "up to 1": after paying the cost the Stage may be left alone', () => {
    const g = main();
    accept(g);
    payDon(g, 2);
    chooseNone(g);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
    expect(don(g)).toMatchObject({ rested: 3 });
  });

  it('CR 8-3-1-4: declining the optional cost rests nothing and the Stage stays', () => {
    const g = main();
    decline(g);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('CR 8-3-1-3: with only 1 active DON!! left after the Event’s cost, the 2-DON!! cost cannot be paid', () => {
    const g = main({ active: 2 });
    skipUnusable(g, 'p1');
    expect(g.zone('p2', 'stage')).toHaveLength(1);
  });

  it('boundary: exactly 3 active DON!! (1 for the Event, 2 for the cost) is enough', () => {
    const g = main({ active: 3 });
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    payDon(g, 2);
    choose(g, [g.find('p2', 'stage', STAGE)]);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
  });

  it('it does not touch Characters: the opposing Characters stay', () => {
    const g = main();
    accept(g);
    payDon(g, 2);
    choose(g, [g.find('p2', 'stage', STAGE)]);
    expect(charsOf(g, 'p2')).toEqual([WB.kingdew]);
  });
});

describe('OP17-018 The Power to Destroy the World [Counter]: with 2+ Characters of 8000 base power or more, Leader or Character +4000 during this battle', () => {
  /** p2’s 7000 Kingdew attacks my Leader; I am in the Counter Step with 1 active DON!!. */
  function counterStep(own: string[], p1: object = {}) {
    const g = theirs(
      LD.luffy,
      {
        hand: [EVENT],
        characters: own,
        life: fill(BLUE, 4),
        costArea: { active: 1, rested: 0 },
        ...p1,
      },
      { characters: [WB.kingdew], life: fill(RED, 4) },
    );
    attack(g, g.find('p2', 'characters', WB.kingdew), g.leader('p1'));
    passBlock(g);
    expect(kind(g)).toBe('counter');
    return g;
  }
  const useOn = (g: TestGame, target: string) => {
    useCounter(g, g.find('p1', 'hand', EVENT), target);
    chooseIfAsked(g, [target]);
  };

  it('two 8000-base Characters: the Leader gets +4000 (9000) and the 7000 attack is stopped', () => {
    const g = counterStep([WB.thatch, WB.ramba]);
    useOn(g, g.leader('p1'));
    expect(lp(g, 'p1')).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('the boost may go to a Character instead of the Leader', () => {
    const g = counterStep([WB.thatch, WB.ramba]);
    const thatch = g.find('p1', 'characters', WB.thatch);
    useOn(g, thatch);
    expect(g.power(thatch)).toBe(12000);
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('boundary: only ONE 8000-base Character: no boost', () => {
    const g = counterStep([WB.thatch]);
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) useOn(g, g.leader('p1'));
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('boundary: 8000 and 7000 base power: the 7000 Character does not count', () => {
    const g = counterStep([WB.thatch, WB.kingdew]);
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) useOn(g, g.leader('p1'));
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('CR 4-9-2: BASE power counts: an Atmos (6000 base, 9000 power on this turn) is not an 8000-base Character', () => {
    const g = counterStep([WB.thatch, 'OP17-002']);
    expect(g.power(g.find('p1', 'characters', 'OP17-002'))).toBe(9000);
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) useOn(g, g.leader('p1'));
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('RL-08: the +4000 ends with the battle', () => {
    const g = counterStep([WB.thatch, WB.ramba]);
    useOn(g, g.leader('p1'));
    passCounter(g);
    expectMain(g, 'p2');
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('control: without the Event the same 7000 attack connects', () => {
    const g = counterStep([WB.thatch, WB.ramba]);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });
});

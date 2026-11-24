/**
 * OP17-116 Fulgora (Event, Yellow, cost 1, {The Four Emperors}/{Big Mom Pirates}).
 *
 * Card text: "[Main] You may rest 2 of your DON!! cards: K.O. up to 1 of your opponent's Stages.
 * [Counter] If you have 2 or more Characters with a [Trigger], up to 1 of your Leader or Characters
 * gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1 / 8-3-1-3 (cost), CR 10-2-1 (K.O. of a Stage = trashed by an effect), CR 8-4-4-1
 * ("up to"), CR 8-3-3 (failed "if"), CR 3-1-2-1 ("you have" refers to your field), RL-08.
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  atMain,
  attack,
  BLUE,
  canCounterNow,
  choices,
  counterAction,
  don,
  kind,
  LD,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  passBlock,
  passCounter,
  pickCards,
  pickInst,
  playCard,
  SCN,
  side,
  theirTurn,
  RED,
  trash,
  unusable,
  yes,
  at,
} from './kit-op17b.ts';

const EVENT = 'OP17-116';
const STAGE = 'OP05-021'; // Red Stage, cost 1
const SPEED = 'OP01-104'; // Purple Character with a [Trigger]
const CARROT = 'OP01-009'; // Red Character with a [Trigger]
const DAIFUKU = 'OP17-107'; // Yellow Character with a [Trigger]

function main(active: number, oppStage: string | undefined = STAGE, mineStage?: string) {
  return mine(
    LD.bmp,
    {
      hand: [EVENT],
      costArea: { active, rested: 0 },
      ...(mineStage ? { stage: mineStage } : {}),
    },
    oppStage ? { stage: oppStage } : {},
  );
}

describe("OP17-116 Fulgora [Main]: rest 2 DON!!: K.O. up to 1 of the opponent's Stages", () => {
  it('rests 2 DON!! (on top of the 1 DON!! play cost) and K.O.s the opposing Stage', () => {
    const g = main(5);
    playCard(g, EVENT);
    need(g, 'optional', 'p1');
    yes(g);
    need(g, 'choose', 'p1');
    pickCards(g, [STAGE]);
    expect(atMain(g)).toBe(true);
    expect(don(g)).toMatchObject({ active: 2, rested: 3 });
    expect(g.zone('p2', 'stage')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([STAGE]);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('declining the cost: nothing rested, the Stage stays', () => {
    const g = main(5);
    playCard(g, EVENT);
    no(g);
    expect(don(g)).toMatchObject({ active: 4, rested: 1 });
    expect(g.zone('p2', 'stage')).toHaveLength(1);
  });

  it('"up to 1": after paying the Stage may be left alone', () => {
    const g = main(5);
    playCard(g, EVENT);
    yes(g);
    need(g, 'choose');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
    expect(don(g)).toMatchObject({ active: 2, rested: 3 });
  });

  it("only the opponent's Stage: my own Stage is never a candidate", () => {
    const g = main(5, STAGE, 'OP05-117');
    playCard(g, EVENT);
    yes(g);
    need(g, 'choose');
    expect(choices(g)).toHaveLength(1);
    pickCards(g, [STAGE]);
    expect(g.zone('p1', 'stage')).toHaveLength(1);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
  });

  it('CR 8-3-1-3: with only 1 active DON!! left after the play cost, "rest 2" cannot be paid', () => {
    const g = main(2);
    playCard(g, EVENT);
    unusable(g, 'p1');
    expect(g.zone('p2', 'stage')).toHaveLength(1);
    expect(don(g)).toMatchObject({ active: 1, rested: 1 });
  });

  it('boundary: exactly 2 active DON!! left can pay', () => {
    const g = main(3);
    playCard(g, EVENT);
    expect(kind(g)).toBe('optional');
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
  });

  it("with no opposing Stage the Event just resolves: nothing is K.O.'d (Characters are not Stages)", () => {
    const g = mine(LD.bmp, { hand: [EVENT] }, { characters: [SCN.c3] });
    playCard(g, EVENT);
    if (kind(g) === 'optional') yes(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      none(g);
    }
    expect(g.zone('p2', 'characters')).toHaveLength(1);
    expect(g.eventsOfType('KO')).toHaveLength(0);
  });
});

describe('OP17-116 Fulgora [Counter]: with 2+ [Trigger] Characters, +4000', () => {
  function counterStep(chars: string[]) {
    const g = theirTurn(
      side(LD.bmp, BLUE, { hand: [EVENT], characters: chars, costArea: { active: 1, rested: 0 } }),
      side(LD.luffy, RED, { costArea: { active: 10, rested: 0 } }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('2 Characters with a [Trigger]: my Leader gets +4000 during this battle only', () => {
    const g = counterStep([SPEED, CARROT]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('boundary: 3 Characters with a [Trigger] also satisfy "2 or more"; a Character can be boosted', () => {
    const g = counterStep([SPEED, CARROT, DAIFUKU]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    pickCards(g, [DAIFUKU]);
    expect(g.power(at(g, 'p1', 'characters', DAIFUKU))).toBe(8000);
  });

  it('boundary: only 1 Character with a [Trigger] (plus plain ones) gives no boost', () => {
    const g = counterStep([SPEED, SCN.c3, SCN.c4]);
    if (counterAction(g, g.find('p1', 'hand', EVENT))) {
      activateCounter(g, g.find('p1', 'hand', EVENT));
      if (kind(g) === 'choose') none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only my own Characters count', () => {
    const g = theirTurn(
      side(LD.bmp, BLUE, {
        hand: [EVENT],
        characters: [SPEED],
        costArea: { active: 1, rested: 0 },
      }),
      side(LD.luffy, RED, { characters: [CARROT, DAIFUKU] }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    if (canCounterNow(g, g.find('p1', 'hand', EVENT))) {
      activateCounter(g, g.find('p1', 'hand', EVENT));
      if (kind(g) === 'choose') none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": with the condition met the target may be skipped', () => {
    const g = counterStep([SPEED, CARROT]);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

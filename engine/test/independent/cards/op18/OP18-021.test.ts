/**
 * OP18-021 Franky (Leader, Green/Purple, 5000, 4 Life, {Water Seven}/{The Franky Family}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "All Stage cards in your hand have a +3000 Counter.
 *    [Activate: Main] [Once Per Turn] DON!! -1: Play up to 1 Stage card with a cost of 5 or less
 *    from your hand."
 *
 * Reading used: a Stage in hand can be trashed in the Counter Step like a Character's Counter
 * (CR 7-1-3-2 style: trash the card, the target gets +3000 for the battle). Only "Stage cards in
 * your hand" of the Leader's owner qualify. The play is an "up to 1" pick from hand, the cost
 * filter is read on the card in hand, and a second Stage replaces the first (CR 3-8-5-1).
 *
 * Scenery Stages: OP03-075 Galley-La Company (cost 3), OP05-040 Birdcage (cost 5), OP06-041 The Ark
 * Noah (cost 6), OP03-020 Striker (cost 1). Attacker: OP02-006 Kingdew (Red, cost 5, 7000).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  at,
  atMain,
  canActivate,
  CH,
  canCounterWith,
  cardIds,
  choices,
  donOf,
  LDR,
  mine,
  myTurn,
  offeredAbilities,
  offeredIds,
  pickCards,
  side,
  theirs,
  toMyNextMain,
  useCounter,
  RED,
  BLUE,
  VAN,
  kind,
  need,
} from './kit-ga.ts';
import { STG } from './kit-ga.ts';

const FRANKY = 'OP18-021';

/** p2's Kingdew (7000) is attacking p1's Franky Leader (5000); p1 is in the Counter Step. */
function counterStep(hand: string[], leader: string = FRANKY, p1: object = {}) {
  const g = theirs(leader, { hand, ...p1 }, { characters: [CH.kingdew5] });
  attack(g, g.find('p2', 'characters', CH.kingdew5), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

/** Start the Leader's [Activate: Main] on p1's Main Phase. */
function start(g: ReturnType<typeof mine>) {
  const leader = g.leader('p1');
  const [ability] = offeredAbilities(g, leader);
  act(g, { type: 'activate', card: leader, ability: ability! });
}

describe('OP18-021 Franky: Stage cards in hand have a +3000 Counter', () => {
  it('a Stage in hand can be used as a Counter and gives the Leader +3000 for the battle', () => {
    const g = counterStep([STG.galley]);
    const stage = g.find('p1', 'hand', STG.galley);
    expect(canCounterWith(g, stage)).toBe(true);
    useCounter(g, stage, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.galley]);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('without the Counter the same 7000 attack connects (the +3000 was what stopped it)', () => {
    const g = counterStep([STG.galley]);
    act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(cardIds(g, 'p1', 'hand')).toEqual([STG.galley]);
  });

  it('two Stages in hand stack: +3000 each', () => {
    const g = counterStep([STG.galley, STG.birdcage]);
    useCounter(g, g.find('p1', 'hand', STG.galley), g.leader('p1'));
    useCounter(g, g.find('p1', 'hand', STG.birdcage), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(11000);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual([STG.birdcage, STG.galley].sort());
  });

  it('the Counter value does not depend on the Stage cost: a cost 6 Stage counts too', () => {
    const g = counterStep([STG.ark]);
    const stage = g.find('p1', 'hand', STG.ark);
    expect(canCounterWith(g, stage)).toBe(true);
    useCounter(g, stage, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
  });

  it('the +3000 can also go on a Character that is attacked', () => {
    const g = theirs(
      FRANKY,
      { hand: [STG.galley], characters: [{ card: CH.usopp3, rested: true }] },
      { characters: [CH.kingdew5] },
    );
    const usopp = g.find('p1', 'characters', CH.usopp3);
    attack(g, g.find('p2', 'characters', CH.kingdew5), usopp);
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', STG.galley), usopp);
    expect(g.power(usopp)).toBe(8000);
    act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([CH.usopp3]);
  });

  it('only Stage cards: a Character in hand keeps its own printed Counter (+1000), no extra +3000', () => {
    const g = counterStep([VAN.marco]);
    const marco = g.find('p1', 'hand', VAN.marco);
    useCounter(g, marco, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('only Stage cards: an Event card with no [Counter] cannot be used as a Counter', () => {
    const g = counterStep(['OP09-077']);
    expect(canCounterWith(g, g.find('p1', 'hand', 'OP09-077'))).toBe(false);
  });

  it('without this Leader a Stage in hand is not a Counter (ST02-001 Kid)', () => {
    const g = counterStep([STG.galley], LDR.kid);
    expect(canCounterWith(g, g.find('p1', 'hand', STG.galley))).toBe(false);
  });

  it('"in your hand": the opponent’s Stage in hand has no Counter against p1’s attack', () => {
    const g = myTurn(
      side(FRANKY, BLUE, { characters: [CH.kingdew5] }),
      side(LDR.luffy, RED, { hand: [STG.galley] }),
    );
    attack(g, g.find('p1', 'characters', CH.kingdew5), g.leader('p2'));
    passBlock(g);
    need(g, 'counter', 'p2');
    expect(canCounterWith(g, g.find('p2', 'hand', STG.galley))).toBe(false);
  });

  it('a Stage on the field (not in hand) is not a Counter source', () => {
    const g = counterStep([VAN.marco], FRANKY, { stage: STG.galley });
    // Only the hand card is offered as a Counter.
    expect(g.legal().filter((a) => a.type === 'counter')).toHaveLength(1);
  });
});

describe('OP18-021 Franky: [Activate: Main] [Once Per Turn] DON!! -1: play up to 1 Stage (cost 5 or less) from hand', () => {
  it('plays the chosen Stage for free and returns 1 DON!! to the DON!! deck', () => {
    const g = mine(FRANKY, { hand: [STG.galley] });
    const before = donOf(g, 'p1');
    start(g);
    pickCards(g, [STG.galley]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.galley]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    const after = donOf(g, 'p1');
    expect(after.active).toBe(before.active - 1);
    expect(after.rested).toBe(before.rested);
  });

  it('cost boundary: a Stage with cost exactly 5 is playable', () => {
    const g = mine(FRANKY, { hand: [STG.birdcage] });
    start(g);
    expect(offeredIds(g)).toEqual([STG.birdcage]);
    pickCards(g, [STG.birdcage]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.birdcage]);
  });

  it('cost boundary: a Stage with cost 6 is not offered and stays in hand', () => {
    const g = mine(FRANKY, { hand: [STG.ark, STG.galley] });
    start(g);
    expect(offeredIds(g)).toEqual([STG.galley]);
    pickCards(g, [STG.galley]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([STG.ark]);
  });

  it('only Stage cards: a Character with a low cost in hand is not offered', () => {
    const g = mine(FRANKY, { hand: [CH.usopp3, STG.striker] });
    start(g);
    expect(offeredIds(g)).toEqual([STG.striker]);
  });

  it('"up to 1": the pick may be empty; the DON!! is still returned (it is a cost)', () => {
    const g = mine(FRANKY, { hand: [STG.galley] });
    const before = donOf(g, 'p1');
    start(g);
    expect(choices(g)).toHaveLength(1);
    act(g, { type: 'done' });
    expect(cardIds(g, 'p1', 'stage')).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([STG.galley]);
    expect(donOf(g, 'p1').active).toBe(before.active - 1);
  });

  it('[Once Per Turn]: after it is used the Leader offers no second activation this turn', () => {
    const g = mine(FRANKY, { hand: [STG.galley, STG.striker] });
    start(g);
    pickCards(g, [STG.galley]);
    expect(canActivate(g, g.leader('p1'))).toBe(false);
  });

  it('[Once Per Turn] is per turn: offered again on p1’s next turn', () => {
    const g = mine(FRANKY, { hand: [STG.galley, STG.striker] });
    start(g);
    pickCards(g, [STG.galley]);
    toMyNextMain(g);
    expect(canActivate(g, g.leader('p1'))).toBe(true);
  });

  it('CR 3-8-5-1: a Stage already on the field is trashed when the new one is played', () => {
    const g = mine(FRANKY, { hand: [STG.birdcage], stage: STG.striker });
    start(g);
    pickCards(g, [STG.birdcage]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.birdcage]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.striker]);
  });

  it('the DON!! -1 cost cannot be paid with no DON!! on the field: not activatable', () => {
    const g = mine(FRANKY, { hand: [STG.galley], costArea: { active: 0, rested: 0 } });
    expect(canActivate(g, g.leader('p1'))).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('DON!! -1 can be paid from rested DON!! too', () => {
    const g = mine(FRANKY, { hand: [STG.galley], costArea: { active: 0, rested: 1 } });
    expect(canActivate(g, g.leader('p1'))).toBe(true);
    start(g);
    // Either the single rested DON!! is returned with no question or the question is answered.
    if (kind(g) === 'choose' && !choices(g).includes(at(g, 'p1', 'hand', STG.galley)))
      act(
        g,
        g.legal().find((a) => a.type === 'pick')!,
      );
    pickCards(g, [STG.galley]);
    expect(donOf(g, 'p1').rested).toBe(0);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.galley]);
  });
});

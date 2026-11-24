/**
 * OP13-098 Never Existed... in the First Place... (Event, Black, cost 1, {Celestial Dragons}/{Five Elders}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards: If your Leader is [Imu], K.O. up to 1 of your
 * opponent's Stages with a cost of 7. [Counter] If your Leader is [Imu], up to 1 of your Leader or
 * Character cards gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost), CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"), CR 7-1-3-1-2 (Event
 * [Counter]), CR 7-1-5-3. Scenery: OP13-079 Imu (Leader, Black, 4 Life), OP13-099 The Empty Throne
 * (Black Stage, cost 7), EB04-010 Lulucia Kingdom (Red Stage, cost 7), OP06-041 The Ark Noah
 * (Green Stage, cost 6), OP05-117 Upper Yard (Yellow Stage, cost 1).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  atMain,
  attack,
  choices,
  don,
  doneRaw,
  kind,
  LD13,
  mine,
  need,
  no,
  noDefence,
  offeredIds,
  payDon,
  pickRaw,
  playRaw,
  S13,
  SC15,
  theirs,
  trash,
  unusable,
  useCounter,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-098';
const STAGE7 = S13.stage7;
const STAGE6 = S13.stage6;

function start(
  o: { leader?: string; p2stage?: string; own?: string; active?: number } = {},
): TestGame {
  const g = mine(
    o.leader ?? LD13.imu,
    {
      hand: [ID],
      costArea: { active: o.active ?? 10, rested: 0 },
      ...(o.own ? { stage: o.own } : {}),
    },
    { stage: o.p2stage ?? STAGE7 },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

const pay = (g: TestGame) => {
  need(g, 'optional', 'p1');
  yes(g);
  payDon(g, 1);
};

const p2Stage = (g: TestGame) => g.zone('p2', 'stage').map((c) => c.card);

describe('OP13-098 [Main] may rest 1 DON!!: if my Leader is [Imu], K.O. up to 1 Stage with cost 7', () => {
  it('Imu Leader: pays 1 more DON!! (2 in all) and K.O.’s the cost 7 Stage', () => {
    const g = start();
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([STAGE7]);
    pickRaw(g, at(g, 'p2', 'stage', STAGE7));
    expect(atMain(g)).toBe(true);
    expect(p2Stage(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual([STAGE7]);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('boundary: a cost 6 Stage is not offered and stays', () => {
    const g = start({ p2stage: STAGE6 });
    pay(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(p2Stage(g)).toEqual([STAGE6]);
  });

  it('the cost 7 {Mary Geoise} Stage (The Empty Throne) of the opponent is a legal target too', () => {
    const g = start({ p2stage: 'OP13-099' });
    pay(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'stage', 'OP13-099'));
    expect(p2Stage(g)).toEqual([]);
  });

  it('a Leader other than Imu: the cost is paid and the Stage stays', () => {
    const g = start({ leader: LD13.black });
    pay(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(p2Stage(g)).toEqual([STAGE7]);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('declining the cost: only the Event’s 1 DON!! is spent and the Stage stays', () => {
    const g = start();
    need(g, 'optional', 'p1');
    no(g);
    expect(p2Stage(g)).toEqual([STAGE7]);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('CR 8-3-1-3: with no active DON!! left after the Event’s cost, the cost cannot be paid', () => {
    const g = start({ active: 1 });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(p2Stage(g)).toEqual([STAGE7]);
  });

  it('"up to 1": after paying, choosing nothing is legal and the Stage stays', () => {
    const g = start();
    pay(g);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(p2Stage(g)).toEqual([STAGE7]);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('only the opponent’s Stage: my own cost 7 Stage is not a candidate', () => {
    const g = start({ own: 'OP13-099' });
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([STAGE7]);
  });

  it('[Counter] with an Imu Leader: +4000 to the Leader beats a 7000 attacker', () => {
    const g = theirs(
      LD13.imu,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
    g.act({ type: 'block', blocker: null });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p1'));
    pickRaw(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
    noDefence(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] may boost one of my Characters instead (a rested Character under attack)', () => {
    const g = theirs(
      LD13.imu,
      {
        hand: [ID],
        characters: [{ card: SC15.red3, rested: true }],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [SC15.red5] },
    );
    const mine3 = at(g, 'p1', 'characters', SC15.red3);
    attack(g, at(g, 'p2', 'characters', SC15.red5), mine3);
    g.act({ type: 'block', blocker: null });
    useCounter(g, g.find('p1', 'hand', ID), mine3);
    need(g, 'choose', 'p1');
    pickRaw(g, mine3);
    expect(g.power(mine3)).toBe(9000);
    noDefence(g);
    expect(g.card(mine3).zone).toBe('characters');
  });

  it('[Counter] without Imu as my Leader: no boost, no question, the attack connects', () => {
    const g = theirs(
      LD13.black,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
    g.act({ type: 'block', blocker: null });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    noDefence(g);
    expect(g.life('p1')).toBe(3);
  });

  it('[Counter] "up to 1": boosting nobody is legal', () => {
    const g = theirs(
      LD13.imu,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
    g.act({ type: 'block', blocker: null });
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

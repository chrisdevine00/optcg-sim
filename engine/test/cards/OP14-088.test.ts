/** OP14-088 Miss.MerryChristmas(Drophy). */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, dec } from './helpers.ts';
import {
  BW_LEADER,
  ids,
  koByEffect,
  OTHER_LEADER,
  STAGE1,
  STAGE2,
  start,
} from './helpers-op14g4.ts';

const ID = 'OP14-088';
const run = (leader: string, stage?: string) => {
  const g = start(
    { leader, characters: [ID], deck: [BLUE, BLUE, BLUE] },
    stage ? { leader: BW_LEADER, stage } : {},
  );
  koByEffect(g, 'p1', ID);
  return g;
};

describe('OP14-088 Miss.MerryChristmas(Drophy)', () => {
  it('[On K.O.] with a Baroque Works Leader: draws 1 and K.O.s a cost 1 Stage of the opponent', () => {
    const g = run(BW_LEADER, STAGE1);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'stage', STAGE1)]);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(ids(g, 'p2', 'stage')).toEqual([]);
    expect(ids(g, 'p2', 'trash')).toEqual([STAGE1]);
  });

  it('a cost 2 Stage is not a legal target (exactly cost 1)', () => {
    const g = run(BW_LEADER, STAGE2);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    if (dec(g)?.kind === 'choose') none(g);
    expect(ids(g, 'p2', 'stage')).toEqual([STAGE2]);
  });

  it('"up to 1": the Stage may be left alone, the draw still happens', () => {
    const g = run(BW_LEADER, STAGE1);
    none(g);
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(ids(g, 'p2', 'stage')).toEqual([STAGE1]);
  });

  it('without a cost 1 Stage on the field the draw alone resolves', () => {
    const g = run(BW_LEADER);
    expect(hand(g, 'p1')).toEqual([BLUE]);
  });

  it('with a Leader that is not Baroque Works nothing happens (no draw, Stage stays)', () => {
    const g = run(OTHER_LEADER, STAGE1);
    expect(hand(g, 'p1')).toEqual([]);
    expect(ids(g, 'p2', 'stage')).toEqual([STAGE1]);
    expectDecision(g, 'main', 'p1');
  });
});

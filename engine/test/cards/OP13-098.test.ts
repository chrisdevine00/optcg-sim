/** OP13-098 Never Existed... in the First Place... */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import {
  canPick,
  counterStep,
  IMU,
  mine,
  names,
  OTHER_LEADER,
  STAGE6,
  STAGE7,
  useCounter,
} from './helpers-op13g4.ts';

const ID = 'OP13-098';
const OPP_STAGE_7B = 'OP13-099';

describe('OP13-098 Never Existed... in the First Place...', () => {
  const run = (leader: string, stage: string | undefined, active = 3) => {
    const g = mine(
      { leader, hand: [ID] },
      { leader: OTHER_LEADER, ...(stage ? { stage } : {}) },
      active,
    );
    play(g, ID);
    return g;
  };

  it('[Main] rest 1 DON!!: with [Imu], K.O. an opponent Stage with cost 7', () => {
    const g = run(IMU, STAGE7);
    accept(g);
    pick(g, [g.find('p2', 'stage', STAGE7)]);
    expect(names(g, 'p2', 'stage')).toEqual([]);
    expect(names(g, 'p2', 'trash')).toEqual([STAGE7]);
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('a Stage with cost 6 is not a candidate', () => {
    const g = run(IMU, STAGE6);
    accept(g);
    if (dec(g)?.kind === 'choose') expect(canPick(g, g.find('p2', 'stage', STAGE6))).toBe(false);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p2', 'stage')).toEqual([STAGE6]);
  });

  it('another cost 7 Stage is a candidate; "up to 1" may choose none', () => {
    const g = run(IMU, OPP_STAGE_7B);
    accept(g);
    none(g);
    expect(names(g, 'p2', 'stage')).toEqual([OPP_STAGE_7B]);
  });

  it('without [Imu] as Leader the DON!! is rested but nothing is K.O.d', () => {
    const g = run(PLAIN_PURPLE, STAGE7);
    accept(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p2', 'stage')).toEqual([STAGE7]);
    expect(don(g, 'p1').rested).toBe(2);
  });

  it('declining the optional DON!! rest skips everything', () => {
    const g = run(IMU, STAGE7);
    decline(g);
    expect(names(g, 'p2', 'stage')).toEqual([STAGE7]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('[Counter] with [Imu]: up to 1 Leader or Character gains +4000 power during this battle', () => {
    const g = counterStep({ leader: IMU, hand: [ID], costArea: { active: 3, rested: 0 } });
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('[Counter] without [Imu] nothing happens', () => {
    const g = counterStep({ leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 3, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(5000);
    void V;
  });
});

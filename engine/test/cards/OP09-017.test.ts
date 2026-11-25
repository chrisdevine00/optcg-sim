/** OP09-017 Wire. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { V } from './helpers.ts';
import { boost, canHit, KID_LEADER, mk, RED_LEADER } from './helpers-a09g1.ts';

const ID = 'OP09-017';
const WIRE_DON = { active: 4, rested: 0 };
/** Wire (played this turn) with `wireDon` DON!! on it, and a Leader holding `leaderDon` DON!!. */
const start = (leader: string, leaderDon: number, wireDon = 1, extra: Partial<PlayerSpec> = {}) =>
  mk(
    {
      leader: { card: leader, don: leaderDon },
      characters: [{ card: ID, don: wireDon, playedThisTurn: true }],
      costArea: WIRE_DON,
      ...extra,
    },
    { characters: [V.c1] },
  );
const hits = (g: ReturnType<typeof mk>) =>
  canHit(g, g.find('p1', 'characters', ID), g.leader('p2'));

describe('OP09-017 Wire', () => {
  it('[DON!! x1]: with a {Kid Pirates} Leader of 7000 power or more, gains [Rush] (attacks the turn it is played)', () => {
    expect(hits(start(KID_LEADER, 2))).toBe(true); // exactly 7000
    expect(hits(start(KID_LEADER, 3))).toBe(true); // 8000
  });

  it('boundary: a Leader of 6000 power does not give [Rush]', () => {
    expect(hits(start(KID_LEADER, 1))).toBe(false);
    expect(hits(start(KID_LEADER, 0))).toBe(false);
  });

  it('a Leader without the {Kid Pirates} type does not, however strong', () => {
    expect(hits(start(RED_LEADER, 2))).toBe(false);
    expect(hits(start(RED_LEADER, 3))).toBe(false);
  });

  it('needs the [DON!! x1]: with no DON!! given to Wire there is no [Rush]', () => {
    expect(hits(start(KID_LEADER, 2, 0))).toBe(false);
  });

  it("reads the Leader's current power: a +2000 buff on a Leader with 1 DON!! (7000) counts", () => {
    const g = start(KID_LEADER, 1);
    expect(hits(g)).toBe(false);
    boost(g, g.leader('p1'), 1000);
    expect(hits(g)).toBe(true);
  });

  it('without a played-this-turn restriction it needs no [Rush]: a Wire played earlier attacks anyway', () => {
    const g = mk({
      leader: KID_LEADER,
      characters: [{ card: ID }],
    });
    expect(canHit(g, g.find('p1', 'characters', ID), g.leader('p2'))).toBe(true);
  });
});

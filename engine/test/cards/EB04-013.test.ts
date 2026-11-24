/** EB04-013 Carrot. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, play } from './helpers.ts';
import {
  at,
  canPick,
  isRested,
  MINK1,
  MINK3,
  MINK6,
  MINKS_LEADER,
  mk,
  offered,
  RED_LEADER,
  V,
} from './helpers-eb04g1.ts';

const ID = 'EB04-013';
const rested = (card: string) => ({ card, rested: true });

describe('EB04-013 Carrot', () => {
  const start = (leader: string | { card: string; rested: boolean } = rested(MINKS_LEADER)) =>
    mk(
      {
        leader,
        hand: [ID],
        characters: [rested(MINK1), rested(MINK3), rested(MINK6), rested(V.c1)],
      },
      {},
    );

  it('[On Play] with a {Minks} Leader: sets up to 2 {Minks} Characters and your Leader as active', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [at(g, 'p1', 'characters', MINK1), at(g, 'p1', 'characters', MINK6)]);
    expect(isRested(g, at(g, 'p1', 'characters', MINK1))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', MINK6))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', MINK3))).toBe(true);
    expect(isRested(g, g.leader('p1'))).toBe(false);
    expect(dec(g)?.kind).toBe('main');
  });

  it('only {Minks} Characters are offered (a rested non-{Minks} one is not), at most 2', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, at(g, 'p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, at(g, 'p1', 'characters', MINK3))).toBe(true);
    pick(g, [at(g, 'p1', 'characters', MINK1), at(g, 'p1', 'characters', MINK3)]);
    // The pick is full at 2: no third Character can be chosen.
    expect(offered(g)).toEqual([]);
    expect(isRested(g, at(g, 'p1', 'characters', MINK6))).toBe(true);
  });

  it('"up to 2": picking none still sets the Leader (it is not an "up to" choice)', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(isRested(g, g.leader('p1'))).toBe(false);
    expect(isRested(g, at(g, 'p1', 'characters', MINK1))).toBe(true);
  });

  it('with a Leader that is not {Minks} nothing is set active, the Leader stays rested', () => {
    const g = start(rested(RED_LEADER));
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(isRested(g, g.leader('p1'))).toBe(true);
    expect(isRested(g, at(g, 'p1', 'characters', MINK1))).toBe(true);
  });
});

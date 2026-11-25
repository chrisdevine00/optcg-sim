/** EB02-019 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import {
  canHit,
  C1,
  C4,
  canPick,
  expectDecision,
  mk,
  NAVY_LEADER,
  pick,
  V,
} from './helpers-aeb2g1.ts';
import { none, play } from './helpers.ts';

const ID = 'EB02-019';
const rested = (card: string) => ({ card, rested: true });

describe('EB02-019 Roronoa Zoro', () => {
  it('with 2 or more opposing Characters (boundary) it can attack a rested Character the turn it is played, not the Leader', () => {
    const g = mk(
      { characters: [{ card: ID, playedThisTurn: true }] },
      { characters: [rested(C1), rested(C4)] },
    );
    const me = g.find('p1', 'characters', ID);
    expect(canHit(g, me, g.find('p2', 'characters', C1))).toBe(true);
    expect(canHit(g, me, g.find('p2', 'characters', C4))).toBe(true);
    expect(canHit(g, me, g.leader('p2'))).toBe(false); // [Rush: Character] only
  });

  it('with only 1 opposing Character it cannot attack on the turn it is played', () => {
    const g = mk(
      { characters: [{ card: ID, playedThisTurn: true }] },
      { characters: [rested(C1)] },
    );
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', C1))).toBe(false);
  });

  it('an active Character that was not just played attacks normally; the ability does not need a rested target to be on', () => {
    const g = mk({ characters: [ID] }, { characters: [rested(C1)] });
    expect(canHit(g, g.find('p1', 'characters', ID), g.find('p2', 'characters', C1))).toBe(true);
  });

  it('[On Play] with a {Straw Hat Crew} Leader: rests an opposing Character with cost 4 or less (cost 5 not offered)', () => {
    const g = mk({ hand: [ID], costArea: { active: 5, rested: 0 } }, { characters: [C4, V.c5] });
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', C4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', C4)]);
    expect(g.card(g.find('p2', 'characters', C4)).rested).toBe(true);
  });

  it('[On Play] without a {Straw Hat Crew} Leader nothing is rested', () => {
    const g = mk(
      { leader: NAVY_LEADER, hand: [ID], costArea: { active: 5, rested: 0 } },
      { characters: [C4] },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.card(g.find('p2', 'characters', C4)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = mk({ hand: [ID], costArea: { active: 5, rested: 0 } }, { characters: [C4] });
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', C4)).rested).toBe(false);
  });
});

/** OP10-081 Usopp. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  canAccept,
  canPick,
  dec,
  decline,
  DRESS_LEADER,
  DRESS_STAGE,
  expectDecision,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-081';
const start = (p1: object = {}) =>
  mk(
    { leader: DRESS_LEADER, hand: [ID], deck: [V.c4, V.c5, V.c6], ...p1 },
    { characters: [V.c1, V.c2, V.c3] },
  );

describe('OP10-081 Usopp', () => {
  it('[On Play] rest your Dressrosa Leader: K.O. a Character with cost 2 or less, then trash 2 from the deck top', () => {
    const g = start();
    play(g, ID);
    accept(g);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // cost 2 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c3]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([V.c2]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5, V.c4]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([V.c6]);
  });

  it('the rested card may be a Dressrosa Stage', () => {
    const g = start({ leader: OTHER_LEADER, stage: DRESS_STAGE });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'stage', DRESS_STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5, V.c4]);
  });

  it('"up to 1": the K.O. may be skipped and the 2 cards are still trashed', () => {
    const g = start();
    play(g, ID);
    accept(g);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c2, V.c3]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c5, V.c4]);
  });

  it('with a short deck it trashes what is there', () => {
    const g = start({ deck: [V.c4] });
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c4]);
    expect(idsOf(g, 'p1', 'deck')).toEqual([]);
  });

  it("declining the cost: nothing is rested, K.O.'d or trashed", () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c2, V.c3]);
    expect(idsOf(g, 'p1', 'trash')).toEqual([]);
  });

  it('must not fire without a Dressrosa Leader or Stage, or with the Leader already rested', () => {
    for (const p1 of [{ leader: OTHER_LEADER }, { leader: { card: DRESS_LEADER, rested: true } }]) {
      const g = start(p1);
      play(g, ID);
      if (dec(g)?.kind === 'optional') {
        expect(canAccept(g)).toBe(false);
        decline(g);
      }
      expectDecision(g, 'main', 'p1');
      expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1, V.c2, V.c3]);
      expect(idsOf(g, 'p1', 'trash')).toEqual([]);
    }
  });
});

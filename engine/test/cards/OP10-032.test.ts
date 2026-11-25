/** OP10-032 Tashigi. */
import { describe, expect, it } from 'vitest';
import { accept, decline, expectDecision, pick, V } from './helpers.ts';
import {
  G3,
  ids,
  koedInBattle,
  mk,
  OPP,
  plant,
  plantOpponentEffect,
  PLAIN_LEADER,
  rested,
} from './helpers-a10g1.ts';

const ID = 'OP10-032';
const KO = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const BOUNCE = {
  move: {
    what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
    to: { zone: 'hand' },
  },
};

/** p2's turn; p2's planted effect `action` hits p1's `target`. */
const hit = (target: string, chars: (string | object)[] = [], action: object = KO) => {
  const g = mk({ characters: [ID, target, ...chars] as string[] }, {}, OPP);
  plantOpponentEffect(g, action as Record<string, unknown>);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP10-032 Tashigi', () => {
  it("rests Tashigi instead of removing your other green Character by the opponent's effect", () => {
    const g = hit(G3);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, G3]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });

  it('declining lets the removal happen and keeps Tashigi active', () => {
    const g = hit(G3);
    decline(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(ids(g, 'p1', 'trash')).toEqual([G3]);
  });

  it("covers any removal by the opponent's effect: a return to the hand too", () => {
    const g = hit(G3, [], BOUNCE);
    accept(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, G3]);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
  });

  it('must not protect a non-green Character', () => {
    const g = hit(V.c1);
    expectDecision(g, 'main', 'p2');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('must not protect Tashigi herself or another [Tashigi] (only "other than [Tashigi]")', () => {
    const g = hit(ID);
    expectDecision(g, 'main', 'p2');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it("must not apply to your own effect's removal", () => {
    const g = mk({ characters: [ID, G3] });
    plant(g, 'p1', { ko: { from: 'characters', owner: 'you', pick: { exactly: 1 } } });
    pick(g, [g.find('p1', 'characters', G3)]);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([G3]);
  });

  it('must not apply to a K.O. in battle', () => {
    const g = koedInBattle(G3, { leader: PLAIN_LEADER, characters: [ID] });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'trash')).toEqual([G3]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('a rested Tashigi cannot rest herself again: no offer, the removal happens', () => {
    const g = mk({ characters: [rested(ID), G3] }, {}, OPP);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', G3)]);
    expectDecision(g, 'main', 'p2');
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('after shielding once she is rested, so a second removal in the same turn is not shielded', () => {
    const g = hit(G3, [G3]);
    accept(g);
    plantOpponentEffect(g, KO);
    pick(g, [g.find('p1', 'characters', G3)]);
    expectDecision(g, 'main', 'p2');
    expect(ids(g, 'p1', 'characters')).toEqual([ID, G3]);
    expect(ids(g, 'p1', 'trash')).toEqual([G3]);
  });
});

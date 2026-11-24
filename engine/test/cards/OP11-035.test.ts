/** OP11-035 Fisher Tiger. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  none,
  payDon,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { koByBattle } from './helpers-op16g4.ts';
import { canPick, FISH, ids, koBy, koByEffect, MERFOLK, mk, RED_LEADER } from './helpers-op11g1.ts';

const ID = 'OP11-035';
const opp = { turn: 4, activePlayer: 'p2' } as const;
const H = [FISH.c4, MERFOLK.c5, FISH.c7, V.c3, MERFOLK.c3];
const start = (handCards = H) => mk({ characters: [ID], hand: handCards }, {}, opp);

describe('OP11-035 Fisher Tiger', () => {
  it("K.O.'d by your opponent's effect: rest 1 DON!!, then play a {Fish-Man}/{Merfolk} Character with cost <= 4 from hand", () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    payDon(g);
    expect(canPick(g, g.find('p1', 'hand', FISH.c4))).toBe(true); // cost 4: boundary
    expect(canPick(g, g.find('p1', 'hand', MERFOLK.c3))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', MERFOLK.c5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false);
    pick(g, [g.find('p1', 'hand', FISH.c4)]);
    expect(ids(g, 'p1', 'characters')).toEqual([FISH.c4]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('"you may": declining rests no DON!! and plays nothing', () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    decline(g);
    expect(don(g, 'p1').rested).toBe(0);
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it("does not fire when K.O.'d in battle or by your own effect", () => {
    const b = koByBattle({ leader: RED_LEADER, hand: H, costArea: { active: 3, rested: 0 } }, ID);
    expect(dec(b)?.kind).not.toBe('optional');
    const g = start();
    koBy(g, 'p1', ID, 'p1');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });

  it('"up to 1": after paying, may play nothing', () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    accept(g);
    payDon(g);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('with no active DON!! nothing is offered (a public gate) and nothing is played', () => {
    const g = mk(
      { characters: [ID], hand: H, costArea: { active: 0, rested: 3 } },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    koByEffect(g, 'p1', ID);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g, 'p1')).toHaveLength(5);
  });

  it("[On Play]: rest up to 1 of your opponent's Characters (Characters only)", () => {
    const g = mk({ hand: [ID] }, { characters: [V.c7, V.c1] });
    play(g, ID);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c7)]); // any cost
    expect(g.card(g.find('p2', 'characters', V.c7)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    const h = mk({ hand: [ID] }, { characters: [V.c1] });
    play(h, ID);
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c1)).rested).toBe(false);
  });
});

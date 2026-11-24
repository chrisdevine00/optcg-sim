/** OP11-024 Aladine. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  expectDecision,
  hand,
  payDon,
  pick,
  trash,
  V,
} from './helpers.ts';
import { koByBattle } from './helpers-op16g4.ts';
import { canPick, FISH, ids, koBy, koByEffect, MERFOLK, mk, RED_LEADER } from './helpers-op11g1.ts';

const ID = 'OP11-024';
const opp = { turn: 4, activePlayer: 'p2' } as const;
const H = [V.c1, FISH.c2, MERFOLK.c6, FISH.c7, V.c3];
const start = (handCards = H, extra: object = {}) =>
  mk({ characters: [ID], hand: handCards, ...extra }, {}, opp);

describe('OP11-024 Aladine', () => {
  it("K.O.'d by your opponent's effect: trash 1 card and rest 1 DON!!, then play a {Fish-Man}/{Merfolk} Character with cost <= 6 from hand", () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]); // the card to trash
    payDon(g);
    expect(canPick(g, g.find('p1', 'hand', FISH.c2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', MERFOLK.c6))).toBe(true); // cost 6: boundary
    expect(canPick(g, g.find('p1', 'hand', FISH.c7))).toBe(false); // cost 7
    expect(canPick(g, g.find('p1', 'hand', V.c3))).toBe(false); // neither type
    pick(g, [g.find('p1', 'hand', MERFOLK.c6)]);
    expect(ids(g, 'p1', 'characters')).toEqual([MERFOLK.c6]);
    expect(trash(g, 'p1')).toEqual([V.c1, ID]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('"you may": declining pays and plays nothing', () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    decline(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(5);
    expect(don(g, 'p1').rested).toBe(0);
  });

  it("does not fire when K.O.'d in battle or by your own effect", () => {
    const b = koByBattle({ leader: RED_LEADER, hand: H }, ID);
    expect(dec(b)?.kind).not.toBe('optional');
    expect(ids(b, 'p1', 'characters')).toEqual([]);
    const g = start();
    koBy(g, 'p1', ID, 'p1');
    expect(dec(g)?.kind).not.toBe('optional');
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"up to 1": after paying, may play nothing', () => {
    const g = start();
    koByEffect(g, 'p1', ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    payDon(g);
    g.act({ type: 'done' });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(don(g, 'p1').rested).toBe(1);
  });

  it('the trashed card is gone before the play: a lone eligible card trashed as the cost cannot be played', () => {
    const g = start([FISH.c2]);
    koByEffect(g, 'p1', ID);
    accept(g);
    pick(g, [g.find('p1', 'hand', FISH.c2)]);
    payDon(g);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(trash(g, 'p1')).toEqual([FISH.c2, ID]);
  });

  it('with an empty hand or no active DON!! nothing is offered (public gates)', () => {
    const empty = start([]);
    koByEffect(empty, 'p1', ID);
    expect(dec(empty)?.kind).not.toBe('optional');
    const noDon = start(H, { costArea: { active: 0, rested: 3 } });
    koByEffect(noDon, 'p1', ID);
    expect(dec(noDon)?.kind).not.toBe('optional');
    expect(hand(noDon, 'p1')).toHaveLength(5);
  });
});

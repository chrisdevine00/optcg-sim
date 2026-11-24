/** OP11-030 Shirahoshi. */
import { describe, expect, it } from 'vitest';
import { dec, don, hand, none, pick, V } from './helpers.ts';
import {
  activate,
  canPick,
  FMI5,
  MEGALO,
  MERFOLK,
  mk,
  NEPT6,
  offeredAb,
  settle,
} from './helpers-op11g1.ts';

const ID = 'OP11-030';
// Top 5: Neptunian, {Fish-Man Island}, a vanilla, [Megalo] ({Fish-Man Island}), [Camie] ({Merfolk} only).
const deck = [NEPT6, FMI5, V.c1, MEGALO, MERFOLK.c1, V.c2, V.c3];
const start = (extra: object = {}) =>
  mk({ characters: [ID], deck, costArea: { active: 3, rested: 0 }, ...extra });

describe('OP11-030 Shirahoshi', () => {
  it('[Activate: Main]: rests 1 DON!! and itself, reveals a {Neptunian} or {Fish-Man Island} card to hand, the rest go to the bottom', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'search');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1').rested).toBe(1);
    expect(canPick(g, g.find('p1', 'deck', NEPT6))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', FMI5))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', MEGALO))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', MERFOLK.c1))).toBe(false); // {Merfolk} alone
    pick(g, [g.find('p1', 'deck', FMI5)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([FMI5]);
    expect(g.zone('p1', 'deck')).toHaveLength(6);
    expect(
      g
        .zone('p1', 'deck')
        .slice(0, 2)
        .map((c) => c.card),
    ).toEqual([V.c2, V.c3]);
  });

  it('"up to 1": may take nothing, and all 5 go to the bottom', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'search');
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(7);
    expect(g.zone('p1', 'deck')[0]!.card).toBe(V.c2);
  });

  it('looks only at 5 cards: a {Neptunian} in 6th place is not offered', () => {
    const g = start({ deck: [V.c1, V.c2, V.c3, V.c4, V.c5, NEPT6] });
    activate(g, g.find('p1', 'characters', ID), 'search');
    expect(canPick(g, g.find('p1', 'deck', NEPT6))).toBe(false);
  });

  it('cannot be activated without an active DON!! or while rested', () => {
    const noDon = start({ costArea: { active: 0, rested: 3 } });
    expect(offeredAb(noDon, noDon.find('p1', 'characters', ID), 'search')).toBe(false);
    const rested = start({ characters: [{ card: ID, rested: true }] });
    expect(offeredAb(rested, rested.find('p1', 'characters', ID), 'search')).toBe(false);
    expect(dec(rested)?.kind).toBe('main');
  });
});

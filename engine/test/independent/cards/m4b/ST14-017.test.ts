/**
 * ST14-017 Thousand Sunny (Stage, Black, cost 1; Straw Hat Crew).
 *
 * Card text:
 *   "All of your black "Straw Hat Crew" type Characters gain +1 cost.
 *    [On Play] If your Leader has the "Straw Hat Crew" type, draw 1 card."
 *
 * Rules: CR 8-1-3-3 permanent effect; "your" and "black" and the type are all required; CR 4-10-1.
 * Scenery: OP17-091 Brook (black, cost 2, Elbaph / Straw Hat Crew), OP10-089 Nico Robin (black,
 * cost 6, Straw Hat Crew / Dressrosa), P-015 Sunny-Kun (RED, cost 1, FILM / Straw Hat Crew),
 * OP17-094 Rodo (black, cost 1, no Straw Hat Crew; +12 only with an Elbaph Leader),
 * OP02-097 Komille (black, cost 1, Navy). Leaders: OP17-079 (Straw Hat Crew), ST06-001 (Navy only).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  BLUE,
  costOf,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  side,
  sortedIds,
  VAN,
  V,
} from './kit-d.ts';

const SUNNY = 'ST14-017';
const BROOK = 'OP17-091';

function game(leader: string, p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}) {
  return myTurn(side(leader, BLUE, { stage: SUNNY, ...p1 }), side(LEAD.luffy, RED, p2));
}

describe('ST14-017 Thousand Sunny: black Straw Hat Crew Characters gain +1 cost', () => {
  it('a black Straw Hat Crew Character (Brook, 2) becomes 3; Nico Robin 6 becomes 7', () => {
    const g = game(LD.navy, { characters: [BROOK, V.robin] });
    expect(costOf(g, g.find('p1', 'characters', BROOK))).toBe(3);
    expect(costOf(g, g.find('p1', 'characters', V.robin))).toBe(7);
  });

  it('a red Straw Hat Crew Character (Sunny-Kun) is unchanged: colour is required', () => {
    const g = game(LD.navy, { characters: [V.sunnyKun] });
    expect(costOf(g, g.find('p1', 'characters', V.sunnyKun))).toBe(1);
  });

  it('a black Character without the Straw Hat Crew type (Komille, Navy) is unchanged', () => {
    const g = game(LD.navy, { characters: [VAN.komachiyo, 'OP02-097'] });
    expect(costOf(g, g.find('p1', 'characters', 'OP02-097'))).toBe(1);
  });

  it('the opponent’s black Straw Hat Crew Characters are not affected ("your")', () => {
    const g = game(LD.navy, {}, { characters: [BROOK] });
    expect(costOf(g, g.find('p2', 'characters', BROOK))).toBe(2);
  });

  it('it stacks with other cost effects: Rodo (not Straw Hat Crew) stays 13 under an Elbaph Leader', () => {
    const g = game(LD.elbaph, { characters: ['OP17-094', BROOK] });
    expect(costOf(g, g.find('p1', 'characters', 'OP17-094'))).toBe(13);
    expect(costOf(g, g.find('p1', 'characters', BROOK))).toBe(3);
  });
});

describe('ST14-017 Thousand Sunny: [On Play] draw 1 if your Leader is Straw Hat Crew', () => {
  const inHand = (leader: string, deck: string[] = [VAN.sai, ...Array(10).fill(BLUE)]) =>
    myTurn(
      side(leader, BLUE, { hand: [SUNNY], deck, costArea: { active: 1, rested: 0 } }),
      side(LEAD.luffy, RED),
    );

  it('Straw Hat Crew Leader (OP17-079): draws the top card, no question asked', () => {
    const g = inHand(LD.elbaph);
    playFromHand(g, SUNNY);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.sai]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([SUNNY]);
  });

  it('CR 4-10-1: a Leader without the type (ST06-001 Navy) draws nothing', () => {
    const g = inHand(LD.navy);
    playFromHand(g, SUNNY);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    expect(g.zone('p1', 'deck')).toHaveLength(11);
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([SUNNY]);
  });

  it('the Leader test is on the Leader, not on Characters: a Straw Hat Crew Character does not help', () => {
    const g = myTurn(
      side(LD.navy, BLUE, {
        hand: [SUNNY],
        characters: [BROOK],
        costArea: { active: 1, rested: 0 },
      }),
      side(LEAD.luffy, RED),
    );
    playFromHand(g, SUNNY);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });
});

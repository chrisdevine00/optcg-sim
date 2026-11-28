/**
 * OP18-097 Abyss Pentagram (Black Stage, cost 1, {Celestial Dragons}/{Holy Knights of God}/{Five Elders}).
 *
 * Card text: "If your Leader has the {Celestial Dragons} type, the cost of playing {Holy Knights of
 *             God} or {Five Elders} type Character cards with a cost of 2 or more from your hand
 *             will be reduced by 1.
 *             [On Play] Draw 1 card and trash 2 cards from the top of your deck."
 *
 * Readings (m6b-audit Q9): "cost of 2 or more" is read on the printed cost before the reduction;
 * only plays from hand are reduced; the Stage itself costs its printed 1.
 * Scenery: OP18-088 Saint Sommers (HKG, cost 6; its [On Play] needs 6 DON!! on the field, so tests
 * leave fewer), OP18-085 Cerberus (HKG, cost 1), OP18-119 Shamrock (HKG, cost 8), OP13-084 St.
 * Shepherd Ju Peter (Celestial Dragons/Five Elders, cost 7, no scripted effect), OP03-082 Kumadori
 * (CP9, cost 4). Leader: OP18-060 (the {Celestial Dragons} one, abilities removed) or ST01-001.
 */
import { describe, expect, it } from 'vitest';
import { at, atMain, cardIds, donOf, play, kind, LDR } from './kit-e.ts';
import { LE, mineE, X } from './kit-e.ts';

const ST = 'OP18-097';
const SOMM = X.sommers;
const CERB = X.cerberus;
const SHAM = X.shamrock;
const FIVE7 = 'OP13-084';
const KUMA = X.cp4;
const MISS = 'OP02-060';

function withStage(leader: string, hand: string[], active: number) {
  return mineE(leader, { stage: ST, hand, costArea: { active, rested: 0 } });
}

/** Whether `card` can be played with exactly `n` active DON!! (and how many were rested if so). */
function cost(leader: string, card: string, n: number): number | null {
  const g = withStage(leader, [card], n);
  const inst = at(g, 'p1', 'hand', card);
  if (!g.legal().some((a) => a.type === 'playCard' && a.card === inst)) return null;
  play(g, inst);
  return donOf(g, 'p1').rested;
}

describe('OP18-097 Abyss Pentagram: play cost reduced by 1 for {HKG} / {Five Elders} Characters of cost 2+', () => {
  it('a cost 6 {HKG} Character costs 5 with a {Celestial Dragons} Leader', () => {
    expect(cost(LE.cd, SOMM, 5)).toBe(5);
    expect(cost(LE.cd, SOMM, 4)).toBeNull();
  });

  it('a cost 8 {HKG} Character costs 7', () => {
    expect(cost(LE.cd, SHAM, 7)).toBe(7);
    expect(cost(LE.cd, SHAM, 6)).toBeNull();
  });

  it('a {Five Elders} Character is covered too (cost 7 -> 6)', () => {
    expect(cost(LE.cd, FIVE7, 6)).toBe(6);
    expect(cost(LE.cd, FIVE7, 5)).toBeNull();
  });

  it('boundary: a cost 1 {HKG} Character is not reduced (needs 2 or more)', () => {
    expect(cost(LE.cd, CERB, 1)).toBe(1);
  });

  it('only those types: a {CP9} cost 4 Character is not reduced', () => {
    expect(cost(LE.cd, KUMA, 4)).toBe(4);
    expect(cost(LE.cd, KUMA, 3)).toBeNull();
  });

  it('must not apply without a {Celestial Dragons} Leader: Sommers still costs 6', () => {
    expect(cost(LDR.luffy, SOMM, 6)).toBe(6);
    expect(cost(LDR.luffy, SOMM, 5)).toBeNull();
  });

  it('the opponent’s Stage does not reduce my costs', () => {
    const g = mineE(LE.cd, { hand: [SOMM], costArea: { active: 5, rested: 0 } }, { stage: ST });
    const inst = at(g, 'p1', 'hand', SOMM);
    expect(g.legal().some((a) => a.type === 'playCard' && a.card === inst)).toBe(false);
  });
});

describe('OP18-097 Abyss Pentagram: [On Play] draw 1 card and trash 2 cards from the top of your deck', () => {
  it('draws the top card, then trashes the next two', () => {
    const g = mineE(LDR.luffy, {
      hand: [ST],
      deck: ['OP18-085', 'OP18-086', 'OP18-087', MISS, MISS, MISS],
      costArea: { active: 1, rested: 0 },
    });
    play(g, at(g, 'p1', 'hand', ST));
    expect(kind(g)).toBe('main');
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual(['OP18-085']);
    expect(cardIds(g, 'p1', 'trash').sort()).toEqual(['OP18-086', 'OP18-087']);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(3);
    expect(cardIds(g, 'p1', 'stage')).toEqual([ST]);
  });

  it('the Stage is played for its printed cost 1 (no reduction on itself)', () => {
    const g = mineE(LE.cd, { hand: [ST], costArea: { active: 1, rested: 0 } });
    play(g, at(g, 'p1', 'hand', ST));
    expect(donOf(g, 'p1')).toMatchObject({ active: 0, rested: 1 });
  });
});

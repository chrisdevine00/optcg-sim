/**
 * OP13-035 Bepo (Character, Green, cost 5, 7000, no Counter, {FILM}/{Heart Pirates}/{Minks}).
 *
 * Card text: "[End of Your Turn] Set this Character or up to 1 of your DON!! cards as active."
 *
 * Rules: digest 72 ([End of Your Turn] runs in the turn player's End Phase, step 1), digest 55
 * (given DON!! cannot be set active), RL-17 (only a rested Character can be attacked).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attackTargets,
  WV,
  dons,
  endTurn,
  isMain,
  mine,
  need,
  optionLabels,
  pickOption,
  WL,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const BEPO = 'OP13-035';
const THIS = 'Set this Character as active';
const DON = 'Set up to 1 of your DON!! cards as active';

function board(bepoRested: boolean, active: number, rested: number, don = 0): TestGame {
  return mine(WL.shanks, {
    characters: [{ card: BEPO, rested: bepoRested, don }],
    costArea: { active, rested },
  });
}

describe('OP13-035 Bepo: [End of Your Turn] set this Character or up to 1 DON!! as active', () => {
  it('at the end of my turn I choose between the two options', () => {
    const g = board(true, 2, 5);
    endTurn(g);
    need(g, 'choose', 'p1');
    expect(optionLabels(g).sort()).toEqual([DON, THIS].sort());
  });

  it('"this Character": a rested Bepo becomes active, the DON!! stay as they were', () => {
    const g = board(true, 2, 5);
    endTurn(g);
    pickOption(g, THIS);
    expect(g.card(g.find('p1', 'characters', BEPO)).rested).toBe(false);
    expect(dons(g)).toMatchObject({ active: 2, rested: 5 });
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('"DON!!": exactly one rested DON!! becomes active; Bepo stays rested', () => {
    const g = board(true, 2, 5);
    endTurn(g);
    pickOption(g, DON);
    expect(g.card(g.find('p1', 'characters', BEPO)).rested).toBe(true);
    expect(dons(g)).toMatchObject({ active: 3, rested: 4 });
  });

  it('set active, Bepo is not an attack target on the opponent turn; left rested it is', () => {
    const mk = () =>
      mine(
        WL.shanks,
        { characters: [{ card: BEPO, rested: true }], costArea: { active: 2, rested: 5 } },
        { characters: [WV.thatch] },
      );
    const a = mk();
    endTurn(a);
    pickOption(a, THIS);
    need(a, 'main', 'p2');
    const bepoA = a.find('p1', 'characters', BEPO);
    expect(attackTargets(a, a.find('p2', 'characters', WV.thatch))).not.toContain(bepoA);
    const b = mk();
    endTurn(b);
    pickOption(b, DON);
    need(b, 'main', 'p2');
    const bepoB = b.find('p1', 'characters', BEPO);
    expect(attackTargets(b, b.find('p2', 'characters', WV.thatch))).toContain(bepoB);
  });

  it('with Bepo already active, choosing it changes nothing; choosing DON!! still works', () => {
    const g = board(false, 2, 5);
    endTurn(g);
    pickOption(g, THIS);
    expect(g.card(g.find('p1', 'characters', BEPO)).rested).toBe(false);
    expect(dons(g)).toMatchObject({ active: 2, rested: 5 });
    const h = board(false, 2, 5);
    endTurn(h);
    pickOption(h, DON);
    expect(dons(h)).toMatchObject({ active: 3, rested: 4 });
  });

  it('with no rested DON!!, choosing DON!! sets nothing', () => {
    const g = board(true, 7, 0);
    endTurn(g);
    pickOption(g, DON);
    expect(dons(g)).toMatchObject({ active: 7, rested: 0 });
    expect(g.card(g.find('p1', 'characters', BEPO)).rested).toBe(true);
  });

  it('DON!! given to a card is not set active: only given DON!! and none rested means no change', () => {
    const g = board(true, 3, 0, 2);
    endTurn(g);
    pickOption(g, DON);
    expect(g.card(g.find('p1', 'characters', BEPO)).don).toBe(2);
    expect(dons(g)).toMatchObject({ active: 3, rested: 0, given: 2 });
  });

  it('it fires only at the end of my own turn: nothing is asked at the end of the opponent turn', () => {
    const g = board(true, 2, 5);
    endTurn(g);
    pickOption(g, THIS);
    need(g, 'main', 'p2');
    endTurn(g);
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('it fires at the end of every one of my turns', () => {
    const g = board(true, 2, 5);
    endTurn(g);
    pickOption(g, DON);
    endTurn(g); // p2
    need(g, 'main', 'p1');
    // my next turn ends the same way
    act(g, { type: 'endTurn' });
    need(g, 'choose', 'p1');
    expect(optionLabels(g)).toContain(THIS);
  });
});

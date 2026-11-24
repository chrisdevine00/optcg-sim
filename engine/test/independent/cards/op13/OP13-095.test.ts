/**
 * OP13-095 Saint Rosward (Character, Black, cost 3, 0 power, Counter +1000, {Celestial Dragons}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: If you only have "Celestial Dragons" type
 * Characters, K.O. up to 2 of your opponent's Characters with a base cost of 3 or less."
 *
 * Rules: CR 8-3-1 (cost), CR 8-3-1-3 (unpayable), CR 8-3-3 (a failed "if" ends the text; the cost is
 * already paid), CR 8-4-4-1 ("up to"). Scenery: OP13-085 Saint Jalmac ({Celestial Dragons}, cost 2).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  afterOpponentSabo,
  at,
  atMain,
  chars,
  choices,
  doneRaw,
  hand,
  kind,
  LD13,
  mine,
  need,
  no,
  offeredIds,
  payHandRaw,
  pickSet,
  playRaw,
  reachablePickSets,
  S13,
  SC15,
  trash,
  unusable,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-095';
const JAL = S13.jalmac;
const F1 = SC15.red2;
const F2 = SC15.red4;

function start(
  o: {
    own?: string[];
    p2?: string[];
    hand?: string[];
  } = {},
): TestGame {
  const g = mine(
    LD13.black,
    { hand: [ID, ...(o.hand ?? [F1, F2])], characters: o.own ?? [] },
    { characters: o.p2 ?? ['OP01-010', SC15.red2, SC15.red3, SC15.red4] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

describe('OP13-095 Saint Rosward: [On Play] trash 1: if I only have {Celestial Dragons} Characters, K.O. up to 2 with base cost 3 or less', () => {
  it('only Rosward on my field: trash 1 and K.O. two Characters of cost 3 or less', () => {
    const g = start();
    need(g, 'optional', 'p1');
    yes(g);
    payHandRaw(g, [F1]);
    need(g, 'choose', 'p1');
    pickSet(g, [SC15.red2, SC15.red3]);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual(['OP01-010', SC15.red4].sort());
    expect(trash(g, 'p2')).toEqual([SC15.red2, SC15.red3].sort());
    expect(trash(g)).toEqual([F1]);
    expect(hand(g)).toEqual([F2]);
  });

  it('boundary: base cost 3 is offered, base cost 4 never is', () => {
    const g = start();
    yes(g);
    payHandRaw(g, [F1]);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s).not.toContain(SC15.red4);
    expect([...sets].join(' ')).toContain(SC15.red3);
  });

  it('"up to 2": one target is allowed, none is allowed, three never', () => {
    const g = start();
    yes(g);
    payHandRaw(g, [F1]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(SC15.red3)).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').length === 2)).toBe(true);
  });

  it('"up to 2": choosing nobody leaves every Character, the card is still trashed', () => {
    const g = start();
    yes(g);
    payHandRaw(g, [F1]);
    doneRaw(g);
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(trash(g)).toEqual([F1]);
  });

  it('a {Celestial Dragons} Character beside Rosward does not spoil "only"', () => {
    const g = start({ own: [JAL] });
    yes(g);
    payHandRaw(g, [F1]);
    need(g, 'choose', 'p1');
    pickSet(g, [SC15.red3]);
    doneRaw(g);
    expect(trash(g, 'p2')).toEqual([SC15.red3]);
  });

  it('a Character of another type on my field makes the "if" fail: the card is trashed, nobody is K.O.’d', () => {
    const g = start({ own: [SC15.red3] });
    need(g, 'optional', 'p1');
    yes(g);
    payHandRaw(g, [F1]);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(trash(g)).toEqual([F1]);
  });

  it('declining the cost: nothing is trashed and nobody is K.O.’d', () => {
    const g = start();
    no(g);
    expect(hand(g)).toEqual([F1, F2].sort());
    expect(chars(g, 'p2')).toHaveLength(4);
    expect(atMain(g)).toBe(true);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid', () => {
    const g = start({ hand: [] });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(4);
  });

  it('only the opponent’s Characters are candidates, never my own', () => {
    const g = start({ own: [JAL], p2: [SC15.red3] });
    yes(g);
    payHandRaw(g, [F1]);
    expect(offeredIds(g)).toEqual([SC15.red3]);
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', JAL));
  });

  it('"base cost": a cost 3 Character whose current cost is 5 (+2 from the opponent’s Sabo) is still a legal target', () => {
    const g = afterOpponentSabo(LD13.black, { hand: [ID, F1, F2] }, SC15.red3);
    expect(g.card(at(g, 'p2', 'characters', SC15.red3)).cost).toBe(5);
    playRaw(g, g.find('p1', 'hand', ID));
    yes(g);
    payHandRaw(g, [F1]);
    need(g, 'choose', 'p1');
    pickSet(g, [SC15.red3]);
    expect(trash(g, 'p2')).toEqual([SC15.red3]);
  });
});

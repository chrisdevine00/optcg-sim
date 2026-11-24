/**
 * OP13-097 The World's Equilibrium Cannot Be Maintained Forever (Event, Black, cost 1, {Celestial Dragons}/{Five Elders}).
 *
 * Card text: "[Main] You may rest 5 of your DON!! cards: If the only Characters on your field are
 * "Celestial Dragons" type Characters, K.O. up to 1 of your opponent's Characters with a base cost
 * of 6 or less. [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (cost), CR 8-3-1-3 (unpayable), CR 8-3-3 (failed "if"), CR 7-1-3-1-2 (Event
 * [Counter]), CR 7-1-5-3 ("during this battle" ends with the battle). Not tested, because it is an
 * open question (OPEN-QUESTIONS M6b-Q21 / E-Q4): "the only Characters are {Celestial Dragons}" with
 * no Character at all. Scenery: OP13-085 Saint Jalmac and OP13-087 Saint Charlos ({Celestial Dragons}).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  afterOpponentSabo,
  at,
  atMain,
  attack,
  canCounterWith,
  chars,
  choices,
  don,
  doneRaw,
  kind,
  LD13,
  mine,
  need,
  no,
  noDefence,
  offeredIds,
  payDon,
  pickRaw,
  playRaw,
  S13,
  SC15,
  theirs,
  trash,
  unusable,
  useCounter,
  yes,
} from './kit-op13d.ts';

const ID = 'OP13-097';
const JAL = S13.jalmac;

function start(o: { own?: string[]; p2?: string[]; active?: number } = {}): TestGame {
  const g = mine(
    LD13.black,
    { hand: [ID], characters: o.own ?? [JAL], costArea: { active: o.active ?? 10, rested: 0 } },
    { characters: o.p2 ?? [SC15.red6, SC15.red7] },
  );
  playRaw(g, g.find('p1', 'hand', ID));
  return g;
}

/** Accept the "may rest 5" cost and pay it; the target pick (if any) stays pending. */
function pay(g: TestGame): void {
  need(g, 'optional', 'p1');
  yes(g);
  payDon(g, 5);
}

describe('OP13-097 [Main] may rest 5 DON!!: if only {Celestial Dragons} Characters, K.O. up to 1 Character with base cost 6 or less', () => {
  it('pays 5 more DON!! (6 in all), then K.O.’s the chosen Character', () => {
    const g = start();
    pay(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red6));
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([SC15.red7]);
    expect(trash(g, 'p2')).toEqual([SC15.red6]);
    expect(trash(g)).toEqual([ID]);
    expect(don(g)).toMatchObject({ active: 4, rested: 6 });
  });

  it('boundary: base cost 6 is offered, base cost 7 is not', () => {
    const g = start();
    pay(g);
    expect(offeredIds(g)).toEqual([SC15.red6]);
  });

  it('a Character of another type on my field fails the "if": the DON!! stay rested, nobody is K.O.’d', () => {
    const g = start({ own: [JAL, SC15.red3] });
    pay(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      doneRaw(g);
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 4, rested: 6 });
  });

  it('several {Celestial Dragons} Characters still satisfy "only"', () => {
    const g = start({ own: [JAL, 'OP13-087'] });
    pay(g);
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', SC15.red6));
    expect(trash(g, 'p2')).toEqual([SC15.red6]);
  });

  it('declining the cost: only the Event’s own 1 DON!! is spent, nobody is K.O.’d', () => {
    const g = start();
    need(g, 'optional', 'p1');
    no(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('CR 8-3-1-3: with only 4 active DON!! left after the Event’s cost, resting 5 is impossible', () => {
    const g = start({ active: 5 });
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 4, rested: 1 });
  });

  it('"up to 1": after paying, choosing nobody is legal; the DON!! stay rested', () => {
    const g = start();
    pay(g);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expect(chars(g, 'p2')).toHaveLength(2);
    expect(don(g)).toMatchObject({ active: 4, rested: 6 });
  });

  it('only the opponent’s Characters are candidates, not my own {Celestial Dragons} Character', () => {
    const g = start();
    pay(g);
    expect(choices(g)).not.toContain(at(g, 'p1', 'characters', JAL));
  });

  it('[Counter]: +3000 to my Leader makes 5000 beat a 7000 attacker, and my Life stays', () => {
    const g = theirs(
      LD13.black,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
    expect(kind(g)).toBe('block');
    noDefence(g);
    // Life was lost because no counter was used in this branch; replay with the counter.
    expect(g.life('p1')).toBe(3);
    const h = theirs(
      LD13.black,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(h, at(h, 'p2', 'characters', SC15.red5), h.leader('p1'));
    act0(h);
    expect(canCounterWith(h, h.find('p1', 'hand', ID))).toBe(true);
    useCounter(h, h.find('p1', 'hand', ID), h.leader('p1'));
    expect(h.power(h.leader('p1'))).toBe(8000);
    expect(kind(h)).toBe('counter');
    expect(don(h)).toMatchObject({ active: 2, rested: 1 });
    noDefence(h);
    expect(h.life('p1')).toBe(4);
  });

  it('[Counter]: the +3000 ends with the battle', () => {
    const g = theirs(
      LD13.black,
      { hand: [ID], costArea: { active: 3, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
    act0(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    noDefence(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter] is only the +3000: the [Main] K.O. effect is not run and no DON!! cost is asked', () => {
    const g = theirs(
      LD13.black,
      { hand: [ID], characters: [JAL], costArea: { active: 10, rested: 0 } },
      { characters: [SC15.red5] },
    );
    attack(g, at(g, 'p2', 'characters', SC15.red5), g.leader('p1'));
    act0(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    expect(kind(g)).toBe('counter');
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(chars(g, 'p2')).toEqual([SC15.red5]);
  });

  it('"base cost": a cost 5 Character whose current cost is 7 (+2 from the opponent’s Sabo) is still a legal target', () => {
    const g = afterOpponentSabo(LD13.black, { hand: [ID], characters: [JAL] }, SC15.red5);
    expect(g.card(at(g, 'p2', 'characters', SC15.red5)).cost).toBe(7);
    playRaw(g, g.find('p1', 'hand', ID));
    pay(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SC15.red5);
    pickRaw(g, at(g, 'p2', 'characters', SC15.red5));
    expect(trash(g, 'p2')).toEqual([SC15.red5]);
  });
});

/** Pass the Block Step (no blocker) so that the Counter Step is pending. */
function act0(g: TestGame): void {
  if (kind(g) === 'block') g.act({ type: 'block', blocker: null });
  expect(kind(g)).toBe('counter');
}

/**
 * OP10-052 Bartolomeo (Character, Blue, cost 5, 6000, no Counter, {Dressrosa}/{Barto Club}).
 *
 * Card text: "[Blocker] [On Play] Place up to 1 Character with a cost of 1 or less at the bottom of the
 * owner's deck."
 *
 * Rules: [Blocker] (CR 10-1-4), "Character" with no owner means either side's, "up to" may be 0
 * (CR 8-1-2), cost 1 or less includes 1, the card goes to the bottom of its owner's deck (CR 3-7-1).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  block,
  C10,
  deck,
  doneRaw,
  expectMain,
  inst,
  kw,
  L10,
  mine,
  need,
  offeredNow,
  pickRaw,
  playRaw,
  theirs,
  zoneIds,
} from './kit-op10b.ts';

const BARTO = 'OP10-052';

function start(
  p1chars: (string | { card: string; rested: boolean })[] = [],
  p2chars: (string | { card: string; rested: boolean })[] = [C10.mohji],
) {
  return mine(L10.luffy, { hand: [BARTO], characters: p1chars }, { characters: p2chars });
}

describe("OP10-052 Bartolomeo: [Blocker]; [On Play] place up to 1 Character with a cost of 1 or less at the bottom of its owner's deck", () => {
  it("places an opposing cost-1 Character at the bottom of the opponent's deck", () => {
    const g = start();
    const before = deck(g, 'p2').length;
    playRaw(g, BARTO);
    need(g, 'choose', 'p1');
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expectMain(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([]);
    expect(deck(g, 'p2')).toHaveLength(before + 1);
    expect(deck(g, 'p2').at(-1)).toBe(C10.mohji);
    expect(zoneIds(g, 'p2', 'hand')).toEqual([]);
    expect(zoneIds(g, 'p2', 'trash')).toEqual([]);
  });

  it('boundary: cost 1 is offered, cost 2 is not', () => {
    const g = start([], [C10.mohji, C10.sai]);
    playRaw(g, BARTO);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.mohji]);
  });

  it('my own Characters are eligible: my cost-1 Character goes to the bottom of MY deck', () => {
    const g = start([C10.gordon], []);
    const before = deck(g, 'p1').length;
    playRaw(g, BARTO);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.gordon]);
    pickRaw(g, inst(g, 'p1', 'characters', C10.gordon));
    expect(deck(g, 'p1')).toHaveLength(before + 1);
    expect(deck(g, 'p1').at(-1)).toBe(C10.gordon);
  });

  it('Bartolomeo himself (cost 5) and the Leaders are not offered', () => {
    const g = start([C10.gordon], [C10.mohji]);
    playRaw(g, BARTO);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C10.gordon, C10.mohji].sort());
    for (const i of [g.leader('p1'), g.leader('p2')]) {
      expect(g.legal().some((a) => a.type === 'pick' && a.choice === i)).toBe(false);
    }
  });

  it('"up to 1": choosing nothing places nothing', () => {
    const g = start();
    playRaw(g, BARTO);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.mohji]);
  });

  it('only one Character is placed even when two qualify', () => {
    const g = start([C10.gordon], [C10.mohji]);
    playRaw(g, BARTO);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expectMain(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([BARTO, C10.gordon].sort());
  });

  it('a rested cost-1 Character can be placed', () => {
    const g = start([], [{ card: C10.mohji, rested: true }]);
    playRaw(g, BARTO);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(deck(g, 'p2').at(-1)).toBe(C10.mohji);
  });

  it('with no Character of cost 1 or less nothing is placed', () => {
    const g = start([], [C10.sai]);
    playRaw(g, BARTO);
    if (g.legal().some((a) => a.type === 'done')) doneRaw(g);
    expectMain(g);
    expect(zoneIds(g, 'p2', 'characters')).toEqual([C10.sai]);
  });

  it('has [Blocker]', () => {
    const g = start();
    playRaw(g, BARTO);
    doneRaw(g);
    expect(kw(g, inst(g, 'p1', 'characters', BARTO))).toContain('Blocker');
  });

  it('[Blocker] works: it blocks an attack on my Leader and is the new target', () => {
    const g = theirs(L10.luffy, { characters: [BARTO] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    block(g, inst(g, 'p1', 'characters', BARTO));
    expect(g.card(inst(g, 'p1', 'characters', BARTO)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });
});

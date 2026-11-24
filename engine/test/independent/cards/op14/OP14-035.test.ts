/**
 * OP14-035 Yosaku (Character, Blue, cost 2, 2000, Counter +1000, {East Blue}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, up to 1 of your opponent's rested
 * Characters with a cost of 4 or less will not become active in your opponent's next Refresh Phase."
 *
 * Rules: CR 6-2 (Refresh Phase untaps), CR 4-8-1 ("up to" allows 0), CR 8-3-2 ([Your Turn] condition).
 * Open reading (M6b-Q30): whether resting by attacking counts as "becomes rested". The tests use an
 * attack, the plainest way a Character becomes rested on its owner's turn.
 */
import { describe, expect, it } from 'vitest';
import type { CardPlacement } from '@optcg/engine';
import { act, attack, endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  answerMay,
  atMain,
  C14,
  canFinish,
  choices,
  choose,
  inst,
  kind,
  L14,
  mine,
  need,
  noDefence,
  offeredNow,
  payDon,
  put,
  reachablePickSets,
  rested,
  theirs,
} from './kit-op14b.ts';

const YO = 'OP14-035';
const R = (card: string): CardPlacement => ({ card, rested: true });

function start(p2chars: (string | CardPlacement)[], p1extra: (string | CardPlacement)[] = []) {
  return mine(L14.luffy, { characters: [YO, ...p1extra] }, { characters: p2chars });
}
function swing(g: TestGame) {
  attack(g, inst(g, 'p1', 'characters', YO), g.leader('p2'));
}
/** End p1's turn: p2's Refresh Phase runs, p2 owes a Main decision. */
function toP2Main(g: TestGame) {
  endTurn(g);
  need(g, 'main', 'p2');
}
/** From p2's Main back to p1's Main, then end p1's turn again: p2's second Refresh has run. */
function toP2NextMain(g: TestGame) {
  endTurn(g);
  need(g, 'main', 'p1');
  endTurn(g);
  need(g, 'main', 'p2');
}

describe('OP14-035 Yosaku: [Your Turn] when rested, an opponent rested Character (cost 4 or less) skips their next Refresh', () => {
  it("attacking rests it; the chosen rested Character stays rested through the opponent's Refresh, the others untap", () => {
    const g = start([R(C14.hajrudin), R(C14.marco), R(C14.kingdew)]);
    swing(g);
    need(g, 'choose', 'p1');
    choose(g, [inst(g, 'p2', 'characters', C14.hajrudin)]);
    noDefence(g);
    expect(atMain(g)).toBe(true);
    toP2Main(g);
    expect(rested(g, inst(g, 'p2', 'characters', C14.hajrudin))).toBe(true);
    expect(rested(g, inst(g, 'p2', 'characters', C14.marco))).toBe(false);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });

  it('boundary: a rested cost-4 Character is offered, a rested cost-5 Character is not', () => {
    const g = start([R(C14.hajrudin), R(C14.kingdew)]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.hajrudin]);
  });

  it('a rested cost-3 and a rested cost-1 Character are offered; an ACTIVE cost-3 Character is not', () => {
    const g = start([R(C14.marco), R(C14.camie), C14.praline]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.camie, C14.marco].sort());
  });

  it('"will not become active" lasts for one Refresh only: the second Refresh untaps it', () => {
    const g = start([R(C14.hajrudin)]);
    swing(g);
    choose(g, [inst(g, 'p2', 'characters', C14.hajrudin)]);
    noDefence(g);
    toP2Main(g);
    expect(rested(g, inst(g, 'p2', 'characters', C14.hajrudin))).toBe(true);
    toP2NextMain(g);
    expect(rested(g, inst(g, 'p2', 'characters', C14.hajrudin))).toBe(false);
  });

  it('"up to 1": choosing nothing leaves every rested Character to untap normally', () => {
    const g = start([R(C14.hajrudin), R(C14.marco)]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    noDefence(g);
    toP2Main(g);
    expect(rested(g, inst(g, 'p2', 'characters', C14.hajrudin))).toBe(false);
    expect(rested(g, inst(g, 'p2', 'characters', C14.marco))).toBe(false);
  });

  it('at most 1 Character is held back even when two qualify', () => {
    const g = start([R(C14.hajrudin), R(C14.marco)]);
    swing(g);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(sets.size).toBeGreaterThanOrEqual(3);
  });

  it('only the picked copy is held back when the opponent has two identical rested Characters', () => {
    const g = start([R(C14.hajrudin), R(C14.hajrudin)]);
    swing(g);
    const first = inst(g, 'p2', 'characters', C14.hajrudin, 0);
    const second = inst(g, 'p2', 'characters', C14.hajrudin, 1);
    choose(g, [first]);
    noDefence(g);
    toP2Main(g);
    expect(rested(g, first)).toBe(true);
    expect(rested(g, second)).toBe(false);
  });

  it('with no rested opposing Character of cost 4 or less, nothing is held back (no target can be chosen)', () => {
    const g = start([R(C14.kingdew), C14.marco]);
    swing(g);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    noDefence(g);
    toP2Main(g);
    expect(rested(g, inst(g, 'p2', 'characters', C14.kingdew))).toBe(false);
  });

  it('must not: your own rested Characters are never offered', () => {
    const g = start([R(C14.marco)], [R(C14.sai)]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([C14.marco]);
  });

  it('must not fire on playing it: it stays active and no prompt appears', () => {
    const g = mine(L14.luffy, { hand: [YO] }, { characters: [R(C14.marco)] });
    put(g, YO);
    expect(atMain(g)).toBe(true);
    expect(rested(g, inst(g, 'p1', 'characters', YO))).toBe(false);
  });

  it("must not fire on the opponent's turn: an opposing effect that rests it asks nothing and holds nothing back", () => {
    // p2 plays OP14-038 (rest 2 of your cards: draw 1, rest up to 1 of your opponent's Characters with 7000 base power or less).
    const g = theirs(
      L14.luffy,
      { characters: [YO] },
      { hand: ['OP14-038'], characters: [R(C14.marco)] },
    );
    put(g, 'OP14-038', 'p2');
    answerMay(g, true, 'p2');
    payDon(g, 2, 'costActive');
    need(g, 'choose', 'p2');
    choose(g, [inst(g, 'p1', 'characters', YO)]);
    expect(rested(g, inst(g, 'p1', 'characters', YO))).toBe(true);
    need(g, 'main', 'p2');
  });
});

/**
 * EB02-015 Jewelry Bonney (Character, Green, cost 7, 7000, Counter +1000, {Bonney Pirates}/{Supernovas}).
 *
 * Card text: "[On Play] Up to 1 of your opponent's rested Characters will not become active in your
 * opponent's next Refresh Phase. Then, set up to 1 of your DON!! cards as active at the end of this
 * turn."
 *
 * Rules: Refresh Phase (CR 6-2: the turn player's rested cards become active), "up to"
 * (CR 8-4-4-1), "at the end of this turn" is a delayed effect run in my End Phase (rules-digest 71).
 * Whether the DON!! half still happens when no Character was chosen is not asserted.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  act,
  canFinish,
  canHit,
  choices,
  choose,
  chooseNone,
  donOf,
  E2C,
  E2L,
  endTurn,
  answerCount,
  countOptions,
  kind,
  mine,
  need,
  offers,
  playRaw,
  settleYes,
} from './kit-eb02a.ts';

const BONNEY = 'EB02-015';

function pos(oppChars: PlayerSpec['characters']) {
  return mine(
    E2L.shc,
    { hand: [BONNEY], costArea: { active: 10, rested: 0 } },
    { characters: oppChars },
  );
}

const rested = (card: string) => ({ card, rested: true });

/** End my turn; the end-of-turn "set up to 1 DON!!" asks a count (most first): answer 1. */
function endMine(g: ReturnType<typeof pos>, count = 1) {
  endTurn(g);
  if (kind(g) === 'choose' && countOptions(g).length > 0) answerCount(g, count);
}

describe('EB02-015 Jewelry Bonney: [On Play] freeze a rested Character; set a DON!! active at end of turn', () => {
  it('the chosen rested Character is still rested after the opponent’s next Refresh Phase', () => {
    const g = pos([rested(E2C.kingdew)]);
    playRaw(g, BONNEY);
    const kingdew = g.find('p2', 'characters', E2C.kingdew);
    choose(g, [kingdew]);
    endMine(g);
    need(g, 'main', 'p2');
    expect(g.card(kingdew).rested).toBe(true);
    expect(canHit(g, kingdew, g.leader('p1'))).toBe(false);
  });

  it('a rested Character that was not chosen becomes active as usual', () => {
    const g = pos([rested(E2C.kingdew), rested(E2C.hajrudin)]);
    playRaw(g, BONNEY);
    choose(g, [g.find('p2', 'characters', E2C.kingdew)]);
    endMine(g);
    expect(g.card(g.find('p2', 'characters', E2C.kingdew)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', E2C.hajrudin)).rested).toBe(false);
  });

  it('only rested Characters are offered (an active one is not)', () => {
    const g = pos([rested(E2C.kingdew), E2C.hajrudin]);
    playRaw(g, BONNEY);
    expect(offers(g, g.find('p2', 'characters', E2C.kingdew))).toBe(true);
    expect(offers(g, g.find('p2', 'characters', E2C.hajrudin))).toBe(false);
  });

  it('only my opponent’s Characters are offered, not my own rested ones', () => {
    const g = mine(
      E2L.shc,
      { hand: [BONNEY], characters: [rested(E2C.marco)], costArea: { active: 10, rested: 0 } },
      { characters: [rested(E2C.kingdew)] },
    );
    playRaw(g, BONNEY);
    expect(choices(g).every((i) => g.card(i).owner === 'p2')).toBe(true);
  });

  it('"up to 1": choosing nothing freezes nobody', () => {
    const g = pos([rested(E2C.kingdew)]);
    playRaw(g, BONNEY);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    endMine(g);
    expect(g.card(g.find('p2', 'characters', E2C.kingdew)).rested).toBe(false);
  });

  it('freezes only one Character even when several are rested', () => {
    const g = pos([rested(E2C.kingdew), rested(E2C.hajrudin), rested(E2C.marco)]);
    playRaw(g, BONNEY);
    choose(g, [g.find('p2', 'characters', E2C.hajrudin)]);
    endMine(g);
    const restedNow = g.zone('p2', 'characters').filter((c) => c.rested);
    expect(restedNow.map((c) => c.card)).toEqual([E2C.hajrudin]);
  });

  it('"next Refresh Phase" only: at the opponent’s following Refresh Phase it becomes active', () => {
    const g = pos([rested(E2C.kingdew)]);
    playRaw(g, BONNEY);
    const kingdew = g.find('p2', 'characters', E2C.kingdew);
    choose(g, [kingdew]);
    endMine(g);
    expect(g.card(kingdew).rested).toBe(true);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    endMine(g);
    need(g, 'main', 'p2');
    expect(g.card(kingdew).rested).toBe(false);
  });

  it('the DON!! is set active at the end of this turn, not at once', () => {
    const g = pos([rested(E2C.kingdew)]);
    playRaw(g, BONNEY);
    choose(g, [g.find('p2', 'characters', E2C.kingdew)]);
    // Bonney cost 7: 3 active, 7 rested; nothing is set active yet.
    expect([donOf(g, 'p1').active, donOf(g, 'p1').rested]).toEqual([3, 7]);
    endMine(g);
    need(g, 'main', 'p2');
    // Exactly one rested DON!! was set active in my End Phase ("up to 1").
    expect([donOf(g, 'p1').active, donOf(g, 'p1').rested]).toEqual([4, 6]);
  });

  it('the opponent’s own DON!! is not touched by the DON!! half', () => {
    const g = pos([rested(E2C.kingdew)]);
    playRaw(g, BONNEY);
    choose(g, [g.find('p2', 'characters', E2C.kingdew)]);
    const before = donOf(g, 'p2');
    settleYes(g, 'p1');
    expect([before.active, before.rested]).toEqual([donOf(g, 'p2').active, donOf(g, 'p2').rested]);
    expect(kind(g)).toBe('main');
  });

  it('Bonney is played normally and stays on my field', () => {
    const g = pos([rested(E2C.kingdew)]);
    playRaw(g, BONNEY);
    chooseNone(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([BONNEY]);
  });
});

/**
 * EB02-051 Three-Pace Hum Soul Notch Slash (Black Event, cost 3, {Former Rumbar Pirates}).
 *
 * Card text: "[Main] Choose one: * K.O. up to 1 of your opponent's Characters with a cost of 2 or less.
 * * Give up to 1 of your opponent's Characters -4 cost during this turn."
 *
 * Rules: exactly one mode is performed; both target OPPONENT Characters only; "up to 1" may be 0; the
 * K.O. mode checks the current cost ("or less" is inclusive); the cost change lasts this turn, and a
 * negative cost is treated as 0 outside calculations (CR 1-3-6-2).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  chars,
  kind,
  LE,
  mine,
  mode,
  modeLabels,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  trash,
  skipEmptyPick,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const SLASH = 'EB02-051';

function play(opp: string[], own: string[] = []) {
  const g = mine(LE.luffy, { hand: [SLASH], characters: own }, { characters: opp });
  playRaw(g, SLASH);
  return g;
}

describe('EB02-051 Three-Pace Hum Soul Notch Slash: [Main] choose one', () => {
  it('is a cost 3 Event offering exactly two modes', () => {
    const g = play([SE.komachiyo]);
    need(g, 'choose', 'p1');
    expect(modeLabels(g)).toHaveLength(2);
    expect(modeLabels(g)[0]).toMatch(/K\.O\./);
    expect(modeLabels(g)[1]).toMatch(/4 cost/);
  });

  it('K.O. mode: offers only opposing Characters with cost 2 or less (boundary 2 yes, 3 no) and K.O.s the chosen one', () => {
    const g = play([SE.komachiyo, SE.sai, SE.marco], [SE.mohji]);
    mode(g, /K\.O\./);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.komachiyo, SE.sai].sort());
    pickCards(g, [SE.sai]);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo, SE.marco].sort());
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([SE.sai]);
    expect(chars(g)).toEqual([SE.mohji]);
    expect(trash(g)).toEqual([SLASH]);
  });

  it('K.O. mode: K.O.s at most 1 Character even when two qualify', () => {
    const g = play([SE.komachiyo, SE.sai]);
    mode(g, /K\.O\./);
    pickCards(g, [SE.komachiyo]);
    expect(kind(g)).toBe('main');
    expect(chars(g, 'p2')).toEqual([SE.sai]);
  });

  it('K.O. mode: "up to 1" may K.O. nothing', () => {
    const g = play([SE.komachiyo]);
    mode(g, /K\.O\./);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo]);
    expect(trash(g)).toEqual([SLASH]);
  });

  it('K.O. mode with no Character of cost 2 or less does nothing', () => {
    const g = play([SE.marco, SE.kingdew]);
    mode(g, /K\.O\./);
    skipEmptyPick(g);
    expect(chars(g, 'p2')).toEqual([SE.marco, SE.kingdew].sort());
  });

  it('cost mode: the chosen opposing Character gets -4 cost this turn (any starting cost may be chosen)', () => {
    const g = play([SE.kingdew, SE.hajrudin]);
    mode(g, /4 cost/);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.kingdew, SE.hajrudin].sort());
    pickCards(g, [SE.kingdew]);
    expect(g.card(ch(g, 'p2', SE.kingdew)).cost).toBe(1);
    expect(g.card(ch(g, 'p2', SE.hajrudin)).cost).toBe(4);
    expect(chars(g, 'p2')).toHaveLength(2);
  });

  it('cost mode: a cost below 4 is treated as 0, not negative', () => {
    const g = play([SE.marco]);
    mode(g, /4 cost/);
    pickCards(g, [SE.marco]);
    expect(g.card(ch(g, 'p2', SE.marco)).cost).toBe(0);
  });

  it('cost mode: the reduction lasts this turn only', () => {
    const g = play([SE.kingdew]);
    mode(g, /4 cost/);
    pickCards(g, [SE.kingdew]);
    const target = ch(g, 'p2', SE.kingdew);
    expect(g.card(target).cost).toBe(1);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.card(target).cost).toBe(5);
  });

  it('cost mode: "up to 1" may choose nothing', () => {
    const g = play([SE.kingdew]);
    mode(g, /4 cost/);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.card(ch(g, 'p2', SE.kingdew)).cost).toBe(5);
  });

  it('must not: the K.O. mode does not reduce cost and the cost mode does not K.O. (even to cost 0)', () => {
    const g = play([SE.komachiyo, SE.sai]);
    mode(g, /4 cost/);
    pickCards(g, [SE.komachiyo]);
    expect(chars(g, 'p2')).toEqual([SE.komachiyo, SE.sai].sort());
    expect(g.card(ch(g, 'p2', SE.komachiyo)).cost).toBe(0);
    expect(g.card(ch(g, 'p2', SE.sai)).cost).toBe(2);
  });

  it('must not: own Characters are never targets of either mode', () => {
    const g = play([SE.komachiyo], [SE.sai]);
    mode(g, /4 cost/);
    expect(offeredIds(g)).toEqual([SE.komachiyo]);
    none(g);
  });
});

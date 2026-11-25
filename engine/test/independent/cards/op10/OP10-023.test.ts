/**
 * OP10-023 Issho (Character, Green, cost 5, 6000, Counter +1000, {Navy}/{Dressrosa}).
 *
 * Card text: "[On Play] If your Leader has the "Navy" type, rest up to 2 of your opponent's
 * Characters with a cost of 5 or less."
 *
 * Rules: the "If" has no colon: an effect condition on my Leader's types. "Up to 2" may be 0, 1 or
 * 2 targets; the cost filter reads the current cost; only opposing Characters; resting is not a K.O.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  kind,
  L10,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  reachablePickSets,
  V10,
  VAN,
} from './kit-op10a.ts';

const ISSHO = 'OP10-023';
const OPP = [VAN.kingdew, VAN.thatch, VAN.marco, VAN.sai];

function start(leader: string, opp: Parameters<typeof mine>[2] = { characters: OPP }) {
  const g = mine(leader, { hand: [ISSHO] }, opp);
  playRaw(g, ISSHO);
  return g;
}

const rested = (g: ReturnType<typeof start>, card: string) =>
  g.card(at(g, 'p2', 'characters', card)).rested;

describe('OP10-023 Issho: [On Play] with a {Navy} Leader, rest up to 2 opposing Characters with cost 5 or less', () => {
  it('printed values: cost 5, 6000, Counter +1000', () => {
    const g = mine(L10.navy, { hand: [ISSHO] });
    const c = g.find('p1', 'hand', ISSHO);
    expect(g.card(c).cost).toBe(5);
    expect(g.card(c).counter).toBe(1000);
    expect(g.power(c)).toBe(6000);
  });

  it('with a {Navy} Leader: rests 2 chosen opposing Characters', () => {
    const g = start(L10.navy);
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew, VAN.marco]);
    expect(rested(g, VAN.kingdew)).toBe(true);
    expect(rested(g, VAN.marco)).toBe(true);
    expect(rested(g, VAN.sai)).toBe(false);
    expect(rested(g, VAN.thatch)).toBe(false);
    expect(kind(g)).toBe('main');
  });

  it('boundary: cost 5 is offered, cost 6 is not', () => {
    const g = start(L10.navy);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.kingdew, VAN.marco, VAN.sai].sort());
  });

  it('a Leader with {Navy} as one of two types qualifies', () => {
    const g = start('OP10-001');
    need(g, 'choose', 'p1');
    pickCards(g, [VAN.kingdew]);
    expect(rested(g, VAN.kingdew)).toBe(true);
  });

  it('boundary: a Leader without {Navy} gets nothing: no prompt, nothing rested', () => {
    const g = start('ST01-001');
    expect(kind(g)).toBe('main');
    expect(OPP.every((c) => !rested(g, c))).toBe(true);
  });

  it("only the Leader's type counts: a {Navy} Character on my field does not enable it", () => {
    const g = mine(
      'ST01-001',
      { hand: [ISSHO], characters: [V10.tashigiNavy] },
      { characters: OPP },
    );
    playRaw(g, ISSHO);
    expect(kind(g)).toBe('main');
    expect(OPP.every((c) => !rested(g as ReturnType<typeof start>, c))).toBe(true);
  });

  it('"up to 2": may rest just 1', () => {
    const g = start(L10.navy);
    pickCards(g, [VAN.sai]);
    expect(rested(g, VAN.sai)).toBe(true);
    expect(rested(g, VAN.marco)).toBe(false);
  });

  it('"up to 2": may rest none', () => {
    const g = start(L10.navy);
    none(g);
    expect(OPP.every((c) => !rested(g, c))).toBe(true);
  });

  it('at most 2 can be chosen even with three eligible', () => {
    const g = start(L10.navy);
    const sets = reachablePickSets(g);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(2);
    expect([...sets].some((s) => s.split('+').filter(Boolean).length === 2)).toBe(true);
  });

  it('only opposing Characters: neither my own Characters nor a Leader is offered', () => {
    const g = mine(
      L10.navy,
      { hand: [ISSHO], characters: [VAN.hajrudin] },
      { characters: [VAN.marco] },
    );
    playRaw(g, ISSHO);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.marco]);
  });

  it('it rests but does not K.O.: every chosen Character stays on the field', () => {
    const g = start(L10.navy);
    pickCards(g, [VAN.kingdew, VAN.marco]);
    expect(cardIds(g, 'p2', 'characters')).toHaveLength(4);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });
});
